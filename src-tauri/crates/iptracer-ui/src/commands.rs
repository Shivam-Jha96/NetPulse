use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tokio::sync::watch;

use iptracer_core::bogon::classify_ip;
use iptracer_core::cloud::{
    CloudSyncRequest, CloudSyncResult, CloudTelemetryClient, EnterprisePolicyEngine,
    EnterprisePolicyProfile,
};
use iptracer_core::dns::{DefaultDnsInspector, DnsInspectionResult, DnsInspector};
use iptracer_core::error::{AppError, AppResponse, AppResult, ErrorCategory, ErrorCode};
use iptracer_core::lan::{DefaultLanScanner, LanDevice, LanScanResult, LanScanner};
use iptracer_core::multitrace::{
    HistoricalPathRecord, MultiTraceConfig, MultiTraceEngine, MultiTraceEvent, MultiTraceResult,
};
use iptracer_core::ping::{DefaultPingMonitor, PingConfig, PingMonitor, PingSample};
use iptracer_core::portscan::{
    parse_port_selection, resolve_service_name, DefaultPortScanner, PortResult, PortScanConfig,
    PortScanResult, PortScanner, PortState, ScanType,
};
use iptracer_core::report::{ReportEngine, ReportExportRequest, ReportExportResult};
use iptracer_core::storage::{FavoriteRecord, HistoryRecord, VaultDatabase};
use iptracer_core::subnet::{DefaultSubnetCalculator, SubnetCalculator, SubnetDetails};
use iptracer_core::traceroute::{DefaultTracerouteEngine, HopTelemetry, TracerouteConfig, TracerouteEngine};
use iptracer_core::watchdog::{WatchdogConfig, WatchdogEngine, WatchdogEvent, WatchdogStatus};
use iptracer_core::whois::{DefaultWhoisService, RdapRecord, WhoisService};
use iptracer_daemon::{DefaultHelperClient, ElevatedCommand, ElevatedEvent, PrivilegeHelperClient};
use iptracer_geo::threat::evaluate_threat;
use iptracer_geo::{DefaultGeoProvider, GeolocationProvider};
use iptracer_net::create_socket_provider;

use crate::models::{
    ElevationStatus, IpTraceResult, LocationModel, NetworkInterface, NetworkModel, ThreatModel,
};
use crate::updater::{check_update_endpoint, UpdateStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceOptions {
    pub force_refresh: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionHandle {
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortScanRequest {
    pub target: Option<String>,
    pub ports: Option<String>,
    pub mode: Option<String>,
    pub concurrency: Option<usize>,
    pub timeout_ms: Option<u64>,
    pub grab_banners: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsQueryRequest {
    pub domain: Option<String>,
    pub record_type: Option<String>,
    pub record_types: Option<Vec<String>>,
    pub transport: Option<String>,
    pub servers: Option<Vec<String>>,
}

// Session registry to manage and cancel running tasks
pub struct SessionManager {
    cancel_senders: Mutex<HashMap<String, watch::Sender<bool>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            cancel_senders: Mutex::new(HashMap::new()),
        }
    }

    pub fn register(&self, id: String, tx: watch::Sender<bool>) {
        let mut map = self.cancel_senders.lock().unwrap();
        map.insert(id, tx);
    }

    pub fn cancel(&self, id: &str) -> bool {
        let mut map = self.cancel_senders.lock().unwrap();
        if let Some(tx) = map.remove(id) {
            let _ = tx.send(true);
            true
        } else {
            false
        }
    }
}

pub struct AppState {
    pub geo_provider: Arc<DefaultGeoProvider>,
    pub subnet_calc: Arc<DefaultSubnetCalculator>,
    pub ping_monitor: Arc<DefaultPingMonitor>,
    pub traceroute_engine: Arc<DefaultTracerouteEngine>,
    pub port_scanner: Arc<DefaultPortScanner>,
    pub dns_inspector: Arc<DefaultDnsInspector>,
    pub whois_service: Arc<DefaultWhoisService>,
    pub lan_scanner: Arc<DefaultLanScanner>,
    pub helper_client: Arc<DefaultHelperClient>,
    pub vault: Arc<VaultDatabase>,
    pub sessions: Arc<SessionManager>,
    pub watchdog: Arc<WatchdogEngine>,
    pub multitrace: Arc<MultiTraceEngine>,
    pub policy_engine: Arc<EnterprisePolicyEngine>,
    pub cloud_client: Arc<CloudTelemetryClient>,
}

impl Default for AppState {
    fn default() -> Self {
        let socket_provider = create_socket_provider();
        let vault = Arc::new(VaultDatabase::open_in_memory().unwrap());
        let traceroute_engine = Arc::new(DefaultTracerouteEngine::new(socket_provider.clone()));
        let watchdog = Arc::new(WatchdogEngine::new(socket_provider.clone()));
        let multitrace = Arc::new(MultiTraceEngine::new(traceroute_engine.clone(), vault.clone()));
        let policy_engine = Arc::new(EnterprisePolicyEngine::new());
        let cloud_client = Arc::new(CloudTelemetryClient::new());

        Self {
            geo_provider: Arc::new(DefaultGeoProvider::new()),
            subnet_calc: Arc::new(DefaultSubnetCalculator::new()),
            ping_monitor: Arc::new(DefaultPingMonitor::new(socket_provider.clone())),
            traceroute_engine,
            port_scanner: Arc::new(DefaultPortScanner::new()),
            dns_inspector: Arc::new(DefaultDnsInspector::new()),
            whois_service: Arc::new(DefaultWhoisService::new()),
            lan_scanner: Arc::new(DefaultLanScanner::new(socket_provider)),
            helper_client: Arc::new(DefaultHelperClient::new()),
            vault,
            sessions: Arc::new(SessionManager::new()),
            watchdog,
            multitrace,
            policy_engine,
            cloud_client,
        }
    }
}

#[tauri::command]
pub async fn trace_ip(
    target: String,
    options: Option<TraceOptions>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<IpTraceResult>, ()> {
    let start = Instant::now();
    let force = options.and_then(|o| o.force_refresh).unwrap_or(false);

    let ip_res: AppResult<IpAddr> = if target.trim().is_empty() {
        // No target provided: discover client egress IP
        state.geo_provider.lookup_online_cascade("1.1.1.1".parse().unwrap()).await
            .map(|r| r.ip)
    } else if let Ok(ip) = target.trim().parse::<IpAddr>() {
        Ok(ip)
    } else {
        // Resolve domain name to IP
        use std::net::ToSocketAddrs;
        let socket_str = format!("{}:0", target.trim());
        match socket_str.to_socket_addrs() {
            Ok(mut addrs) => {
                if let Some(addr) = addrs.next() {
                    Ok(addr.ip())
                } else {
                    Err(AppError::new(ErrorCode::ERR_DNS_NXDOMAIN, ErrorCategory::Resolution, "Could not resolve domain"))
                }
            }
            Err(e) => Err(AppError::new(ErrorCode::ERR_DNS_NXDOMAIN, ErrorCategory::Resolution, e.to_string())),
        }
    };

    let ip = match ip_res {
        Ok(ip) => ip,
        Err(err) => return Ok(AppResponse::err(err, start.elapsed().as_secs_f64() * 1000.0)),
    };

    let classification = classify_ip(ip);
    let is_bogon = classification.is_bogon;
    let ip_version = match ip {
        IpAddr::V4(_) => "IPv4".to_string(),
        IpAddr::V6(_) => "IPv6".to_string(),
    };

    // Geolocation lookup (offline database first, fallback to online cascade)
    let geo_res = state.geo_provider.lookup_ip(ip, force).await;
    let geo = match geo_res {
        Ok(g) => g,
        Err(e) => return Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    };

    let threat = evaluate_threat(ip);
    let duration_ms = start.elapsed().as_secs_f64() * 1000.0;

    let result = IpTraceResult {
        query: target,
        ip: ip.to_string(),
        ip_version,
        is_bogon,
        is_anycast: false,
        hostname: None,
        location: LocationModel {
            continent: geo.continent,
            continent_code: geo.continent_code,
            country: geo.country,
            country_code: geo.country_code,
            region: geo.region,
            region_code: geo.region_code,
            city: geo.city,
            postal_code: geo.postal_code,
            latitude: geo.latitude,
            longitude: geo.longitude,
            timezone: geo.timezone,
            accuracy_radius_km: geo.accuracy_radius_km,
        },
        network: NetworkModel {
            asn: geo.asn,
            asn_org: geo.asn_org.unwrap_or_else(|| "Unknown".to_string()),
            isp: geo.isp.unwrap_or_else(|| "Unknown".to_string()),
            cidr: None,
            bgp_prefix: None,
        },
        threat: ThreatModel {
            abuse_confidence_score: threat.abuse_confidence_score,
            total_reports: threat.total_reports,
            is_tor_exit: threat.is_tor_exit,
            is_proxy: threat.is_proxy,
            is_datacenter: threat.is_datacenter,
            threat_level: match threat.threat_level {
                iptracer_geo::threat::ThreatLevel::Clean => "CLEAN".to_string(),
                iptracer_geo::threat::ThreatLevel::Low => "LOW".to_string(),
                iptracer_geo::threat::ThreatLevel::Medium => "MEDIUM".to_string(),
                iptracer_geo::threat::ThreatLevel::High => "HIGH".to_string(),
                iptracer_geo::threat::ThreatLevel::Critical => "CRITICAL".to_string(),
            },
            last_reported_at: threat.last_reported_at,
        },
        source: match geo.source {
            iptracer_geo::GeoSource::OfflineMaxmind => "OFFLINE_MAXMIND".to_string(),
            iptracer_geo::GeoSource::OnlineFailover => "ONLINE_FAILOVER".to_string(),
            iptracer_geo::GeoSource::LocalCache => "CACHE".to_string(),
        },
        provider: geo.provider,
        response_time_ms: duration_ms,
        timestamp: chrono::Utc::now().timestamp_millis(),
    };

    Ok(AppResponse::ok(result, duration_ms))
}

#[tauri::command]
pub async fn run_traceroute(
    app: tauri::AppHandle,
    config: TracerouteConfig,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<SessionHandle>, ()> {
    let (cancel_tx, cancel_rx) = watch::channel(false);

    let (session_id, mut hop_rx) = match state.traceroute_engine.start_trace(config, cancel_rx).await {
        Ok(res) => res,
        Err(err) => return Ok(AppResponse::err(err, 0.0)),
    };

    state.sessions.register(session_id.clone(), cancel_tx);

    let app_clone = app.clone();
    let sid = session_id.clone();
    tokio::spawn(async move {
        let mut buffer: Vec<HopTelemetry> = Vec::new();
        let mut flush_timer = tokio::time::interval(Duration::from_millis(50));

        loop {
            tokio::select! {
                Some(hop) = hop_rx.recv() => {
                    let _ = app_clone.emit("trace:hop-discovered", &hop);
                    buffer.push(hop);
                }
                _ = flush_timer.tick() => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("trace:hop-batch", &batch);
                    }
                }
                else => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("trace:hop-batch", &batch);
                    }
                    let _ = app_clone.emit("trace:completed", serde_json::json!({
                        "sessionId": sid,
                        "status": "COMPLETED"
                    }));
                    break;
                }
            }
        }
    });

    Ok(AppResponse::ok(SessionHandle { session_id }, 0.0))
}

#[tauri::command]
pub async fn stop_traceroute(
    session_id: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<bool>, ()> {
    let stopped = state.sessions.cancel(&session_id);
    Ok(AppResponse::ok(stopped, 0.0))
}

#[tauri::command]
pub async fn start_continuous_ping(
    app: tauri::AppHandle,
    config: PingConfig,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<SessionHandle>, ()> {
    let (cancel_tx, cancel_rx) = watch::channel(false);

    let (session_id, mut sample_rx) = match state.ping_monitor.start_ping(config, cancel_rx).await {
        Ok(res) => res,
        Err(err) => return Ok(AppResponse::err(err, 0.0)),
    };

    state.sessions.register(session_id.clone(), cancel_tx);

    let app_clone = app.clone();
    tokio::spawn(async move {
        let mut buffer: Vec<PingSample> = Vec::new();
        let mut flush_timer = tokio::time::interval(Duration::from_millis(50));

        loop {
            tokio::select! {
                Some(sample) = sample_rx.recv() => {
                    let _ = app_clone.emit("ping:tick", &sample);
                    buffer.push(sample);
                }
                _ = flush_timer.tick() => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("ping:sample-batch", &batch);
                    }
                }
                else => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("ping:sample-batch", &batch);
                    }
                    break;
                }
            }
        }
    });

    Ok(AppResponse::ok(SessionHandle { session_id }, 0.0))
}

#[tauri::command]
pub async fn stop_continuous_ping(
    session_id: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<bool>, ()> {
    let stopped = state.sessions.cancel(&session_id);
    Ok(AppResponse::ok(stopped, 0.0))
}

#[tauri::command]
pub async fn calculate_subnet(
    cidr: String,
    vlsm_requests: Option<Vec<(String, u32)>>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<SubnetDetails>, ()> {
    let start = Instant::now();
    match state.subnet_calc.calculate(&cidr, vlsm_requests) {
        Ok(details) => Ok(AppResponse::ok(details, start.elapsed().as_secs_f64() * 1000.0)),
        Err(err) => Ok(AppResponse::err(err, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn get_network_interfaces() -> Result<AppResponse<Vec<NetworkInterface>>, ()> {
    // Return standard loopback and primary interfaces
    let interfaces = vec![
        NetworkInterface {
            name: "Loopback Pseudo-Interface 1".to_string(),
            ip_addresses: vec!["127.0.0.1".to_string(), "::1".to_string()],
            mac_address: None,
            is_up: true,
            is_loopback: true,
        },
        NetworkInterface {
            name: "Ethernet / Wi-Fi".to_string(),
            ip_addresses: vec!["192.168.1.105".to_string()],
            mac_address: Some("00:1A:2B:3C:4D:5E".to_string()),
            is_up: true,
            is_loopback: false,
        },
    ];
    Ok(AppResponse::ok(interfaces, 0.0))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanScanRequest {
    pub interface_name: Option<String>,
}

#[tauri::command]
pub async fn check_elevation_status(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<ElevationStatus>, ()> {
    let connected = state.helper_client.is_connected().await;
    Ok(AppResponse::ok(
        ElevationStatus {
            is_elevated: connected,
            helper_connected: connected,
        },
        0.0,
    ))
}

#[tauri::command]
pub async fn request_elevation(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<ElevationStatus>, ()> {
    let _ = state.helper_client.connect().await;
    let connected = state.helper_client.is_connected().await;
    Ok(AppResponse::ok(
        ElevationStatus {
            is_elevated: connected,
            helper_connected: connected,
        },
        0.0,
    ))
}

#[tauri::command]
pub async fn scan_lan(
    app: tauri::AppHandle,
    interface_name: Option<String>,
    config: Option<LanScanRequest>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<LanScanResult>, ()> {
    let start = Instant::now();
    let iface = config.and_then(|c| c.interface_name).or(interface_name);

    let (tx, mut rx) = tokio::sync::mpsc::channel::<LanDevice>(254);
    let app_clone = app.clone();

    tokio::spawn(async move {
        let mut buffer: Vec<LanDevice> = Vec::new();
        let mut interval = tokio::time::interval(Duration::from_millis(50));
        loop {
            tokio::select! {
                Some(dev) = rx.recv() => {
                    let _ = app_clone.emit("lan:device-discovered", &dev);
                    buffer.push(dev);
                }
                _ = interval.tick() => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("lan:device-discovered-batch", &batch);
                    }
                }
                else => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("lan:device-discovered-batch", &batch);
                    }
                    break;
                }
            }
        }
    });

    match state.lan_scanner.scan(iface, Some(tx)).await {
        Ok(res) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("lan", &res.interface_name, &json);
            }
            Ok(AppResponse::ok(res, dur))
        }
        Err(err) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            Ok(AppResponse::err(err, dur))
        }
    }
}

#[tauri::command]
pub async fn scan_ports(
    app: tauri::AppHandle,
    config: Option<PortScanRequest>,
    target: Option<String>,
    ports: Option<String>,
    mode: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<PortScanResult>, ()> {
    let start = Instant::now();
    let tgt = config.as_ref().and_then(|c| c.target.clone())
        .or(target)
        .unwrap_or_else(|| "127.0.0.1".to_string());
    let port_str = config.as_ref().and_then(|c| c.ports.clone())
        .or(ports)
        .unwrap_or_else(|| "top-100".to_string());
    let parsed_ports = parse_port_selection(&port_str);
    let concurrency = config.as_ref().and_then(|c| c.concurrency).unwrap_or(250);
    let timeout_ms = config.as_ref().and_then(|c| c.timeout_ms).unwrap_or(1500);
    let grab_banners = config.as_ref().and_then(|c| c.grab_banners).unwrap_or(true);
    let scan_mode = match config.as_ref().and_then(|c| c.mode.clone()).or(mode).as_deref() {
        Some("SYN_STEALTH") => ScanType::SynStealth,
        Some("UDP") => ScanType::Udp,
        _ => ScanType::TcpConnect,
    };

    let scan_config = PortScanConfig {
        target: tgt.clone(),
        target_ip: None,
        ports: parsed_ports.clone(),
        port_range_desc: Some(port_str.clone()),
        concurrency,
        timeout: Duration::from_millis(timeout_ms),
        scan_type: scan_mode,
        grab_banners,
    };

    let (tx, mut rx) = tokio::sync::mpsc::channel::<PortResult>(1000);
    let app_clone = app.clone();

    tokio::spawn(async move {
        let mut buffer: Vec<PortResult> = Vec::new();
        let mut interval = tokio::time::interval(Duration::from_millis(50));
        loop {
            tokio::select! {
                Some(p) = rx.recv() => {
                    let _ = app_clone.emit("port:found", &p);
                    buffer.push(p);
                }
                _ = interval.tick() => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("port:found-batch", &batch);
                    }
                }
                else => {
                    if !buffer.is_empty() {
                        let batch = std::mem::take(&mut buffer);
                        let _ = app_clone.emit("port:found-batch", &batch);
                    }
                    break;
                }
            }
        }
    });

    if scan_mode == ScanType::SynStealth {
        use std::net::ToSocketAddrs;
        let target_ip: IpAddr = match tgt.parse::<IpAddr>() {
            Ok(ip) => ip,
            Err(_) => match format!("{}:80", tgt).to_socket_addrs() {
                Ok(mut addrs) => addrs.next().map(|a| a.ip()).unwrap_or(IpAddr::V4(std::net::Ipv4Addr::LOCALHOST)),
                Err(_) => IpAddr::V4(std::net::Ipv4Addr::LOCALHOST),
            },
        };

        let cmd = ElevatedCommand::StartSynScan {
            target: target_ip,
            ports: parsed_ports.clone(),
        };

        if let Ok(mut elevated_rx) = state.helper_client.dispatch_command(cmd).await {
            let mut results = Vec::new();
            let mut open_cnt = 0;
            let mut closed_cnt = 0;

            while let Some(evt) = elevated_rx.recv().await {
                if let ElevatedEvent::SynPortDiscovered { port, is_open, latency_ms } = evt {
                    let st = if is_open { open_cnt += 1; PortState::Open } else { closed_cnt += 1; PortState::Closed };
                    let pr = PortResult {
                        port,
                        protocol: "TCP".to_string(),
                        state: st,
                        service: resolve_service_name(port).to_string(),
                        product: None,
                        version: None,
                        banner: None,
                        tls_info: None,
                        latency_ms: Some(latency_ms),
                    };
                    let _ = tx.send(pr.clone()).await;
                    results.push(pr);
                }
            }

            let dur = start.elapsed().as_secs_f64() * 1000.0;
            let res = PortScanResult {
                target: tgt.clone(),
                target_ip: target_ip.to_string(),
                scan_type: ScanType::SynStealth,
                port_range: Some(port_str),
                concurrency: Some(concurrency),
                total_ports_scanned: Some(parsed_ports.len()),
                open_count: open_cnt,
                closed_count: closed_cnt,
                filtered_count: 0,
                duration_ms: dur as u64,
                ports: results,
            };

            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("portscan", &tgt, &json);
            }
            return Ok(AppResponse::ok(res, dur));
        }
    }

    match state.port_scanner.scan(scan_config, Some(tx)).await {
        Ok(res) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("portscan", &tgt, &json);
            }
            Ok(AppResponse::ok(res, dur))
        }
        Err(err) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            Ok(AppResponse::err(err, dur))
        }
    }
}

#[tauri::command]
pub async fn query_dns(
    domain: Option<String>,
    record_type: Option<String>,
    record_types: Option<Vec<String>>,
    transport: Option<String>,
    _servers: Option<Vec<String>>,
    config: Option<DnsQueryRequest>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<DnsInspectionResult>, ()> {
    let start = Instant::now();
    let dom = config.as_ref().and_then(|c| c.domain.clone())
        .or(domain)
        .unwrap_or_else(|| "cloudflare.com".to_string());
    let rec = config.as_ref().and_then(|c| c.record_type.clone())
        .or(record_type)
        .or_else(|| record_types.and_then(|v| v.first().cloned()))
        .unwrap_or_else(|| "A".to_string());
    let trans = config.as_ref().and_then(|c| c.transport.clone()).or(transport);

    match state.dns_inspector.inspect(&dom, &rec, trans.as_deref()).await {
        Ok(res) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("dns", &dom, &json);
            }
            Ok(AppResponse::ok(res, dur))
        }
        Err(err) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            Ok(AppResponse::err(err, dur))
        }
    }
}

#[tauri::command]
pub async fn query_whois(
    query: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<RdapRecord>, ()> {
    let start = Instant::now();
    match state.whois_service.query_rdap(&query).await {
        Ok(res) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("whois", &query, &json);
            }
            Ok(AppResponse::ok(res, dur))
        }
        Err(err) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            Ok(AppResponse::err(err, dur))
        }
    }
}

#[tauri::command]
pub async fn check_for_updates() -> Result<AppResponse<UpdateStatus>, ()> {
    let start = Instant::now();
    match check_update_endpoint("1.0.0", None).await {
        Ok(status) => Ok(AppResponse::ok(status, start.elapsed().as_secs_f64() * 1000.0)),
        Err(err) => Ok(AppResponse::err(err, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn get_vault_history(
    utility: String,
    limit: Option<usize>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<Vec<HistoryRecord>>, ()> {
    let lim = limit.unwrap_or(50);
    match state.vault.get_history(&utility, lim) {
        Ok(records) => Ok(AppResponse::ok(records, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

#[tauri::command]
pub async fn save_vault_history(
    utility: String,
    query: String,
    result_json: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<i64>, ()> {
    match state.vault.save_history(&utility, &query, &result_json) {
        Ok(id) => Ok(AppResponse::ok(id, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

#[tauri::command]
pub async fn clear_vault_history(
    utility: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<bool>, ()> {
    match state.vault.clear_history(utility.as_deref()) {
        Ok(_) => Ok(AppResponse::ok(true, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

#[tauri::command]
pub async fn get_vault_favorites(
    utility: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<Vec<FavoriteRecord>>, ()> {
    match state.vault.get_favorites(utility.as_deref()) {
        Ok(favs) => Ok(AppResponse::ok(favs, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

#[tauri::command]
pub async fn add_vault_favorite(
    utility: String,
    title: String,
    target: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<i64>, ()> {
    match state.vault.add_favorite(&utility, &title, &target) {
        Ok(id) => Ok(AppResponse::ok(id, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

#[tauri::command]
pub async fn delete_vault_favorite(
    id: i64,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<bool>, ()> {
    match state.vault.delete_favorite(id) {
        Ok(_) => Ok(AppResponse::ok(true, 0.0)),
        Err(err) => Ok(AppResponse::err(err, 0.0)),
    }
}

// ---------------------------------------------------------------------------
// Phase 4 Enterprise & Ecosystem IPC Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn start_watchdog(
    app: tauri::AppHandle,
    config: Option<WatchdogConfig>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<WatchdogStatus>, ()> {
    let start = Instant::now();
    let (tx, mut rx) = tokio::sync::mpsc::channel::<WatchdogEvent>(100);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(evt) = rx.recv().await {
            match evt {
                WatchdogEvent::Status(status) => {
                    let _ = app_clone.emit("watchdog:status", &status);
                }
                WatchdogEvent::Alert(alert) => {
                    let _ = app_clone.emit("watchdog:alert", &alert);
                }
            }
        }
    });

    match state.watchdog.start(config, Some(tx)).await {
        Ok(_) => {
            let status = state.watchdog.get_status();
            Ok(AppResponse::ok(status, start.elapsed().as_secs_f64() * 1000.0))
        }
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn stop_watchdog(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<bool>, ()> {
    let start = Instant::now();
    match state.watchdog.stop() {
        Ok(_) => Ok(AppResponse::ok(true, start.elapsed().as_secs_f64() * 1000.0)),
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn get_watchdog_status(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<WatchdogStatus>, ()> {
    let start = Instant::now();
    let status = state.watchdog.get_status();
    Ok(AppResponse::ok(status, start.elapsed().as_secs_f64() * 1000.0))
}

#[tauri::command]
pub async fn run_multitrace(
    app: tauri::AppHandle,
    config: MultiTraceConfig,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<MultiTraceResult>, ()> {
    let start = Instant::now();
    let (tx, mut rx) = tokio::sync::mpsc::channel::<MultiTraceEvent>(128);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(evt) = rx.recv().await {
            match evt {
                MultiTraceEvent::Progress(prog) => {
                    let _ = app_clone.emit("multitrace:progress", &prog);
                }
                MultiTraceEvent::Completed(res) => {
                    let _ = app_clone.emit("multitrace:completed", &res);
                }
            }
        }
    });

    match state.multitrace.run_multitrace(config, Some(tx)).await {
        Ok(res) => {
            let dur = start.elapsed().as_secs_f64() * 1000.0;
            if let Ok(json) = serde_json::to_string(&res) {
                let _ = state.vault.save_history("multitrace", &res.session_id, &json);
            }
            Ok(AppResponse::ok(res, dur))
        }
        Err(err) => Ok(AppResponse::err(err, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn get_historical_paths(
    target: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<Vec<HistoricalPathRecord>>, ()> {
    let start = Instant::now();
    match state.multitrace.get_historical_paths(&target) {
        Ok(paths) => Ok(AppResponse::ok(paths, start.elapsed().as_secs_f64() * 1000.0)),
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn export_report(
    request: ReportExportRequest,
) -> Result<AppResponse<ReportExportResult>, ()> {
    let start = Instant::now();
    match ReportEngine::export_report(request) {
        Ok(res) => Ok(AppResponse::ok(res, start.elapsed().as_secs_f64() * 1000.0)),
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn sync_cloud_telemetry(
    request: CloudSyncRequest,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<CloudSyncResult>, ()> {
    let start = Instant::now();
    match state.cloud_client.sync_telemetry(request).await {
        Ok(res) => Ok(AppResponse::ok(res, start.elapsed().as_secs_f64() * 1000.0)),
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

#[tauri::command]
pub async fn get_enterprise_policy(
    profile_id: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<AppResponse<EnterprisePolicyProfile>, ()> {
    let start = Instant::now();
    let res = if let Some(pid) = profile_id {
        state.policy_engine.switch_profile(&pid)
    } else {
        Ok(state.policy_engine.get_policy())
    };

    match res {
        Ok(policy) => Ok(AppResponse::ok(policy, start.elapsed().as_secs_f64() * 1000.0)),
        Err(e) => Ok(AppResponse::err(e, start.elapsed().as_secs_f64() * 1000.0)),
    }
}

