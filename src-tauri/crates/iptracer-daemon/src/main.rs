use tokio::sync::watch;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use iptracer_daemon::ipc_server::HelperIpcServer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting NetPulse Privilege Separation Daemon (iptracer-helper v1.0.0)");

    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    tokio::spawn(async move {
        if let Ok(()) = tokio::signal::ctrl_c().await {
            info!("Received termination signal (SIGINT/Ctrl-C), initiating shutdown...");
            let _ = shutdown_tx.send(true);
        }
    });

    let server = HelperIpcServer::new();
    server.run(shutdown_rx).await?;

    info!("NetPulse Privilege Separation Daemon gracefully stopped.");
    Ok(())
}
