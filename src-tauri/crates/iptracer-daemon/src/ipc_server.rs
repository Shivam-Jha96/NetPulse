use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::watch;
#[allow(unused_imports)]
use tracing::{error, info, warn};

#[allow(unused_imports)]
use iptracer_core::error::{AppError, AppResult, ErrorCategory, ErrorCode};

use crate::auth::{get_ipc_endpoint, verify_token, AuthRequest, AuthResponse};
use crate::raw_engine::RawEngine;
use crate::{ElevatedCommand, ElevatedEvent};

pub struct HelperIpcServer {
    raw_engine: Arc<RawEngine>,
    endpoint: String,
}

impl HelperIpcServer {
    pub fn new() -> Self {
        Self {
            raw_engine: Arc::new(RawEngine::new()),
            endpoint: get_ipc_endpoint(),
        }
    }

    pub async fn run(self, mut shutdown_rx: watch::Receiver<bool>) -> AppResult<()> {
        info!("Starting iptracer-helper IPC server on: {}", self.endpoint);

        #[cfg(windows)]
        {
            use tokio::net::windows::named_pipe::ServerOptions;

            let pipe_name = self.endpoint.clone();
            let mut is_first = true;

            loop {
                tokio::select! {
                    _ = shutdown_rx.changed() => {
                        if *shutdown_rx.borrow() {
                            info!("Shutdown signal received, stopping IPC server");
                            break;
                        }
                    }
                    server_res = async {
                        let server = ServerOptions::new()
                            .first_pipe_instance(is_first)
                            .create(&pipe_name);
                        is_first = false;
                        server
                    } => {
                        match server_res {
                            Ok(server) => {
                                info!("Named pipe server created, awaiting client handshake...");
                                tokio::select! {
                                    _ = shutdown_rx.changed() => {
                                        break;
                                    }
                                    res = server.connect() => {
                                        if res.is_ok() {
                                            let engine = self.raw_engine.clone();
                                            let (shutdown_tx, shutdown_child) = watch::channel(false);
                                            tokio::spawn(async move {
                                                handle_client_stream(server, engine, shutdown_child).await;
                                                drop(shutdown_tx);
                                            });
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Failed to create Windows Named Pipe server: {}", e);
                                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                            }
                        }
                    }
                }
            }
        }

        #[cfg(unix)]
        {
            use tokio::net::UnixListener;
            let _ = std::fs::remove_file(&self.endpoint);
            let listener = UnixListener::bind(&self.endpoint).map_err(|e| {
                AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::System, e.to_string())
            })?;

            loop {
                tokio::select! {
                    _ = shutdown_rx.changed() => {
                        if *shutdown_rx.borrow() {
                            info!("Shutdown signal received, closing Unix domain socket");
                            let _ = std::fs::remove_file(&self.endpoint);
                            break;
                        }
                    }
                    accept_res = listener.accept() => {
                        match accept_res {
                            Ok((stream, _)) => {
                                let engine = self.raw_engine.clone();
                                let (_shutdown_tx, shutdown_child) = watch::channel(false);
                                tokio::spawn(async move {
                                    handle_client_stream(stream, engine, shutdown_child).await;
                                });
                            }
                            Err(e) => {
                                warn!("Unix socket accept error: {}", e);
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

/// Generic stream handler for either Named Pipe or Unix Domain Socket
async fn handle_client_stream<S>(
    stream: S,
    engine: Arc<RawEngine>,
    _shutdown_rx: watch::Receiver<bool>,
) where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin + Send + 'static,
{
    let (reader, mut writer) = tokio::io::split(stream);
    let mut buf_reader = BufReader::new(reader);
    let mut line = String::new();

    // 1. Peer Authentication Handshake
    if buf_reader.read_line(&mut line).await.is_err() {
        return;
    }

    let auth_req: AuthRequest = match serde_json::from_str(&line) {
        Ok(req) => req,
        Err(_) => {
            let res = AuthResponse {
                authenticated: false,
                session_id: String::new(),
                message: "Invalid handshake payload format".to_string(),
            };
            let _ = writer.write_all(format!("{}\n", serde_json::to_string(&res).unwrap()).as_bytes()).await;
            return;
        }
    };

    if !verify_token(&auth_req.token, auth_req.client_pid) {
        let res = AuthResponse {
            authenticated: false,
            session_id: String::new(),
            message: "Peer token authorization failed".to_string(),
        };
        let _ = writer.write_all(format!("{}\n", serde_json::to_string(&res).unwrap()).as_bytes()).await;
        return;
    }

    let session_id = format!("sess-{}", auth_req.client_pid);
    let res = AuthResponse {
        authenticated: true,
        session_id: session_id.clone(),
        message: "Handshake verified successfully".to_string(),
    };
    if writer.write_all(format!("{}\n", serde_json::to_string(&res).unwrap()).as_bytes()).await.is_err() {
        return;
    }

    // 2. Command Dispatch Loop
    line.clear();
    while let Ok(n) = buf_reader.read_line(&mut line).await {
        if n == 0 {
            break;
        }

        if let Ok(cmd) = serde_json::from_str::<ElevatedCommand>(&line) {
            match cmd {
                ElevatedCommand::StartSynScan { target, ports } => {
                    let (cancel_tx, cancel_rx) = watch::channel(false);
                    let mut event_rx = engine.start_syn_scan(session_id.clone(), target, ports, cancel_rx);

                    while let Some(evt) = event_rx.recv().await {
                        let is_final = matches!(evt, ElevatedEvent::OperationCompleted { .. });
                        if let Ok(serialized) = serde_json::to_string(&evt) {
                            if writer.write_all(format!("{}\n", serialized).as_bytes()).await.is_err() {
                                let _ = cancel_tx.send(true);
                                break;
                            }
                        }
                        if is_final {
                            break;
                        }
                    }
                }
                ElevatedCommand::StartPacketSniffer { interface_name, filter_bpf } => {
                    let (cancel_tx, cancel_rx) = watch::channel(false);
                    let mut event_rx = engine.start_sniffer(session_id.clone(), interface_name, filter_bpf, cancel_rx);

                    while let Some(evt) = event_rx.recv().await {
                        let is_final = matches!(evt, ElevatedEvent::OperationCompleted { .. });
                        if let Ok(serialized) = serde_json::to_string(&evt) {
                            if writer.write_all(format!("{}\n", serialized).as_bytes()).await.is_err() {
                                let _ = cancel_tx.send(true);
                                break;
                            }
                        }
                        if is_final {
                            break;
                        }
                    }
                }
                ElevatedCommand::StopOperation { session_id: _sid } => {
                    let evt = ElevatedEvent::OperationCompleted {
                        session_id: session_id.clone(),
                    };
                    if let Ok(serialized) = serde_json::to_string(&evt) {
                        let _ = writer.write_all(format!("{}\n", serialized).as_bytes()).await;
                    }
                }
            }
        }

        line.clear();
    }
}
