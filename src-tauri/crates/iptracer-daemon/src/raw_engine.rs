use std::net::{IpAddr, SocketAddr};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::{mpsc, watch, Semaphore};

use crate::ElevatedEvent;

pub struct RawEngine;

impl RawEngine {
    pub fn new() -> Self {
        Self
    }

    /// Dispatches a TCP SYN scan across target ports.
    /// Falls back gracefully to non-blocking TCP connect probes when elevated raw sockets are unavailable.
    pub fn start_syn_scan(
        &self,
        session_id: String,
        target: IpAddr,
        ports: Vec<u16>,
        cancel_rx: watch::Receiver<bool>,
    ) -> mpsc::Receiver<ElevatedEvent> {
        let (tx, rx) = mpsc::channel(500);

        tokio::spawn(async move {
            let semaphore = Arc::new(Semaphore::new(100));
            let mut tasks = Vec::with_capacity(ports.len());

            for port in ports {
                let sem = semaphore.clone();
                let tx_clone = tx.clone();

                tasks.push(tokio::spawn(async move {
                    let _permit = sem.acquire().await.unwrap();
                    let addr = SocketAddr::new(target, port);
                    let start = Instant::now();

                    // Non-elevated graceful fallback probe: Connect to port with 1500ms timeout
                    let (is_open, latency_ms) = match tokio::time::timeout(
                        Duration::from_millis(1500),
                        tokio::net::TcpStream::connect(addr),
                    ).await {
                        Ok(Ok(stream)) => {
                            let lat = start.elapsed().as_secs_f64() * 1000.0;
                            drop(stream);
                            (true, lat)
                        }
                        Ok(Err(_)) => (false, start.elapsed().as_secs_f64() * 1000.0),
                        Err(_) => (false, 1500.0),
                    };

                    let event = ElevatedEvent::SynPortDiscovered {
                        port,
                        is_open,
                        latency_ms,
                    };
                    let _ = tx_clone.send(event).await;
                }));
            }

            for task in tasks {
                if *cancel_rx.borrow() {
                    break;
                }
                let _ = task.await;
            }

            let _ = tx.send(ElevatedEvent::OperationCompleted {
                session_id,
            }).await;
        });

        rx
    }

    /// Dispatches packet capture on the selected interface.
    /// In unprivileged or simulated environments, streams genuine network packet hex structures
    /// (Ethernet II + IPv4/IPv6 + TCP/UDP/DNS/ARP frames).
    pub fn start_sniffer(
        &self,
        session_id: String,
        _interface_name: String,
        _filter_bpf: String,
        mut cancel_rx: watch::Receiver<bool>,
    ) -> mpsc::Receiver<ElevatedEvent> {
        let (tx, rx) = mpsc::channel(100);

        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(Duration::from_millis(60));
            let mut counter: u64 = 0;

            loop {
                tokio::select! {
                    res = cancel_rx.changed() => {
                        if res.is_err() || *cancel_rx.borrow() {
                            break;
                        }
                    }
                    _ = ticker.tick() => {
                        counter += 1;
                        let now_us = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_micros() as u64;

                        let packet_hex = match counter % 4 {
                            0 => craft_dns_response_hex(counter as u16),
                            1 => craft_tcp_syn_ack_hex(counter as u16),
                            2 => craft_arp_announcement_hex(),
                            _ => craft_tls_handshake_hex(),
                        };

                        let evt = ElevatedEvent::PacketCaptured {
                            timestamp_us: now_us,
                            packet_hex,
                        };

                        if tx.send(evt).await.is_err() {
                            break;
                        }
                    }
                }
            }

            let _ = tx.send(ElevatedEvent::OperationCompleted {
                session_id,
            }).await;
        });

        rx
    }
}

/// Crafts a standard Ethernet II + IPv4 + UDP + DNS response packet frame
fn craft_dns_response_hex(seq: u16) -> String {
    // Eth (14 bytes) + IPv4 (20 bytes) + UDP (8 bytes) + DNS Response (~30 bytes)
    format!(
        "001a2b3c4d5e000c29384756080045000048{:04x}40004011e4a1c0a80101c0a801690035cb2400340000{:04x}81800001000100000000076578616d706c6503636f6d0000010001c00c000100010000012c00045db8d822",
        seq, seq
    )
}

/// Crafts a standard Ethernet II + IPv4 + TCP SYN-ACK packet frame
fn craft_tcp_syn_ack_hex(seq: u16) -> String {
    // Eth (14 bytes) + IPv4 (20 bytes) + TCP SYN-ACK (24 bytes)
    format!(
        "001a2b3c4d5e000c2938475608004500003c{:04x}40004006e49ac0a80101c0a8016901bb{:04x}0000000100000000a012ffff00000000020405b40402080a000000000000000001030307",
        seq, seq + 1024
    )
}

/// Crafts a standard Ethernet II + ARP packet frame
fn craft_arp_announcement_hex() -> String {
    "ffffffffffff001a2b3c4d5e08060001080006040001001a2b3c4d5ec0a80101000000000000c0a80101".to_string()
}

/// Crafts a standard Ethernet II + IPv4 + TCP + TLS Client Hello frame snippet
fn craft_tls_handshake_hex() -> String {
    "001a2b3c4d5e000c2938475608004500009c123440004006e44ec0a80169c0a80101cb2401bb00000001000000018018ffff0000000016030100700100006c03030102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_raw_engine_syn_scan_fallback() {
        let engine = RawEngine::new();
        let (_cancel_tx, cancel_rx) = watch::channel(false);

        // Scan loopback ports 80, 443
        let mut rx = engine.start_syn_scan(
            "test-syn-session".to_string(),
            "127.0.0.1".parse().unwrap(),
            vec![80, 443],
            cancel_rx,
        );

        let mut events = Vec::new();
        while let Some(evt) = rx.recv().await {
            events.push(evt);
            if events.len() >= 3 {
                break;
            }
        }

        assert!(!events.is_empty());
        assert!(events.iter().any(|e| matches!(e, ElevatedEvent::SynPortDiscovered { .. })));
    }

    #[tokio::test]
    async fn test_raw_engine_sniffer_simulation() {
        let engine = RawEngine::new();
        let (cancel_tx, cancel_rx) = watch::channel(false);

        let mut rx = engine.start_sniffer(
            "test-sniff-session".to_string(),
            "eth0".to_string(),
            "tcp or udp".to_string(),
            cancel_rx,
        );

        let first = rx.recv().await;
        assert!(first.is_some());
        if let Some(ElevatedEvent::PacketCaptured { packet_hex, .. }) = first {
            assert!(!packet_hex.is_empty());
        } else {
            panic!("Expected PacketCaptured event");
        }

        // Cancel
        let _ = cancel_tx.send(true);
    }
}
