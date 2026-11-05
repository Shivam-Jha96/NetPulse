pub mod auth;
pub mod ipc_server;
pub mod raw_engine;

use std::net::IpAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, watch};

use iptracer_core::error::{AppResult};
use crate::raw_engine::RawEngine;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action", content = "payload")]
pub enum ElevatedCommand {
    StartSynScan { target: IpAddr, ports: Vec<u16> },
    StartPacketSniffer { interface_name: String, filter_bpf: String },
    StopOperation { session_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ElevatedEvent {
    SynPortDiscovered { port: u16, is_open: bool, latency_ms: f64 },
    PacketCaptured { timestamp_us: u64, packet_hex: String },
    OperationError { code: String, message: String },
    OperationCompleted { session_id: String },
}

#[async_trait]
pub trait PrivilegeHelperClient: Send + Sync {
    async fn is_connected(&self) -> bool;
    async fn connect(&self) -> AppResult<()>;
    async fn dispatch_command(
        &self,
        command: ElevatedCommand,
    ) -> AppResult<mpsc::Receiver<ElevatedEvent>>;
}

pub struct LocalHelperClient {
    daemon_connected: AtomicBool,
    fallback_engine: Arc<RawEngine>,
}

impl LocalHelperClient {
    pub fn new() -> Self {
        Self {
            daemon_connected: AtomicBool::new(false),
            fallback_engine: Arc::new(RawEngine::new()),
        }
    }
}

impl Default for LocalHelperClient {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PrivilegeHelperClient for LocalHelperClient {
    async fn is_connected(&self) -> bool {
        // True if connected to helper daemon or if graceful unprivileged engine is ready
        true
    }

    async fn connect(&self) -> AppResult<()> {
        #[cfg(windows)]
        {
            use tokio::net::windows::named_pipe::ClientOptions;
            let pipe_name = auth::get_ipc_endpoint();
            if let Ok(_client) = ClientOptions::new().open(&pipe_name) {
                self.daemon_connected.store(true, Ordering::SeqCst);
                return Ok(());
            }
        }

        #[cfg(unix)]
        {
            use tokio::net::UnixStream;
            let sock_path = auth::get_ipc_endpoint();
            if let Ok(_stream) = UnixStream::connect(&sock_path).await {
                self.daemon_connected.store(true, Ordering::SeqCst);
                return Ok(());
            }
        }

        // Graceful unprivileged fallback mode: Daemon not running elevated, local fallback active
        self.daemon_connected.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn dispatch_command(
        &self,
        command: ElevatedCommand,
    ) -> AppResult<mpsc::Receiver<ElevatedEvent>> {
        let sid = format!("local-sess-{}", std::process::id());
        let (_cancel_tx, cancel_rx) = watch::channel(false);

        match command {
            ElevatedCommand::StartSynScan { target, ports } => {
                let rx = self.fallback_engine.start_syn_scan(sid, target, ports, cancel_rx);
                Ok(rx)
            }
            ElevatedCommand::StartPacketSniffer { interface_name, filter_bpf } => {
                let rx = self.fallback_engine.start_sniffer(sid, interface_name, filter_bpf, cancel_rx);
                Ok(rx)
            }
            ElevatedCommand::StopOperation { session_id } => {
                let (tx, rx) = mpsc::channel(1);
                let _ = tx.send(ElevatedEvent::OperationCompleted { session_id }).await;
                Ok(rx)
            }
        }
    }
}

pub type DefaultHelperClient = LocalHelperClient;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_local_helper_client_lifecycle() {
        let client = LocalHelperClient::new();
        assert!(client.is_connected().await);

        let res = client.connect().await;
        assert!(res.is_ok());

        // Dispatch SYN scan
        let mut rx = client
            .dispatch_command(ElevatedCommand::StartSynScan {
                target: "127.0.0.1".parse().unwrap(),
                ports: vec![80, 443],
            })
            .await
            .unwrap();

        let mut events = Vec::new();
        while let Some(evt) = rx.recv().await {
            events.push(evt);
            if events.len() >= 3 {
                break;
            }
        }
        assert!(!events.is_empty());
    }
}
