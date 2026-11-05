export interface AppResponse<T> {
  success: boolean;
  data: T | null;
  error: AppError | null;
  metadata: {
    requestId: string;
    timestamp: number;
    durationMs: number;
    hostPlatform: string;
    elevationRequired: boolean;
  };
}

export interface AppError {
  code: string;
  category: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  suggestedAction?: string;
}

export interface IpTraceResult {
  query: string;
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  isBogon: boolean;
  isAnycast: boolean;
  hostname: string | null;
  location: {
    continent: string | null;
    continentCode: string | null;
    country: string;
    countryCode: string;
    region: string;
    regionCode: string | null;
    city: string;
    postalCode: string | null;
    latitude: number;
    longitude: number;
    timezone: string;
    accuracyRadiusKm: number | null;
  };
  network: {
    asn: number | null;
    asnOrg: string;
    isp: string;
    cidr: string | null;
    bgpPrefix: string | null;
  };
  threat: {
    abuseConfidenceScore: number;
    totalReports: number;
    isTorExit: boolean;
    isProxy: boolean;
    isDatacenter: boolean;
    threatLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lastReportedAt: string | null;
  };
  source: 'OFFLINE_MAXMIND' | 'ONLINE_FAILOVER' | 'CACHE' | 'LOCAL_SENTINEL';
  provider: string;
  responseTimeMs: number;
  timestamp: number;
}

export interface HopTelemetry {
  ttl: number;
  ip: string | null;
  hostname: string | null;
  asn: number | null;
  asnOrg: string | null;
  countryCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  lossPercent: number;
  sent: number;
  received: number;
  rttLast: number | null;
  rttAvg: number | null;
  rttBest: number | null;
  rttWorst: number | null;
  rttStdev: number | null;
}

export interface TracerouteResult {
  target: string;
  maxHops: number;
  timeoutMs: number;
  hops: HopTelemetry[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
}

export interface PingSample {
  seq: number;
  ttl: number | null;
  rttMs: number | null;
  status: 'SUCCESS' | 'TIMEOUT' | 'HOST_UNREACHABLE' | 'NET_UNREACHABLE' | 'TTL_EXPIRED';
  timestampMs: number;
}

export interface RttStatistics {
  min: number | null;
  avg: number | null;
  max: number | null;
  stdev: number | null;
  p95: number | null;
  p99: number | null;
  jitterMs: number | null;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
}

export interface SubnetCalculationResult {
  inputIp: string;
  prefixLength: number;
  ipVersion: 'IPv4' | 'IPv6';
  networkAddress: string;
  broadcastAddress?: string | null;
  netmask: string;
  wildcardMask: string;
  netmaskBinary: string;
  usableRange: {
    firstUsable: string;
    lastUsable: string;
  };
  totalHosts: string;
  usableHosts: string;
  ipClass?: string | null;
  isPrivate: boolean;
  isLinkLocal?: boolean;
  isMulticast?: boolean;
  vlsmSubnets?: VlsmSubnetAllocation[];
}

export interface VlsmSubnetAllocation {
  name: string;
  neededHosts: number;
  allocatedHosts: number;
  prefix: number;
  subnetAddress: string;
  usableRange: string;
  broadcast: string;
}

export interface NetworkInterface {
  name: string;
  ipAddresses: string[];
  macAddress: string | null;
  isUp: boolean;
  isLoopback: boolean;
}

export interface ElevationStatus {
  isElevated: boolean;
  helperConnected: boolean;
}

// Phase 2 Diagnostics Types

export interface TlsMetadata {
  subject: string;
  issuer: string;
  validTo: string;
  cipher?: string | null;
  alpn?: string | null;
}

export interface PortResult {
  port: number;
  protocol: 'TCP' | 'UDP';
  state: 'OPEN' | 'CLOSED' | 'FILTERED';
  service: string;
  product?: string | null;
  version?: string | null;
  banner?: string | null;
  tlsInfo?: TlsMetadata | null;
  latencyMs?: number | null;
}

export interface PortScanResult {
  target: string;
  targetIp: string;
  scanType: 'TCP_CONNECT' | 'SYN_STEALTH' | 'UDP';
  portRange?: string;
  concurrency?: number;
  durationMs: number;
  totalPortsScanned?: number;
  openCount: number;
  closedCount: number;
  filteredCount: number;
  ports: PortResult[];
}

export interface DnsRecord {
  name: string;
  type: string;
  ttl: number;
  value: string;
  priority?: number | null;
  tag?: string | null;
}

export interface DnssecValidation {
  isValid: boolean;
  state: 'SECURE' | 'INSECURE' | 'BOGUS' | 'INDETERMINATE';
  keyAlgorithm?: string | null;
  details: string;
}

export interface ResolverCheckResult {
  resolverName: string;
  resolverLocation: string;
  countryCode?: string | null;
  status: 'MATCH' | 'MISMATCH' | 'TIMEOUT' | 'ERROR';
  values: string[];
  latencyMs: number;
}

export interface DNSInspectionResult {
  domain: string;
  queryType: string;
  transport?: string;
  authoritativeServer?: string | null;
  responseTimeMs: number;
  dnssecStatus: DnssecValidation;
  records: DnsRecord[];
  propagation: {
    totalResolvers: number;
    matchedResolvers: number;
    propagationPercentage: number;
    resolverResults: ResolverCheckResult[];
  };
}

export interface RdapEvents {
  registration?: string | null;
  expiration?: string | null;
  lastChanged?: string | null;
  lastUpdateOfRdapDb?: string | null;
}

export interface RdapEntity {
  handle?: string | null;
  roles: string[];
  name?: string | null;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface RdapRecord {
  query: string;
  objectType: 'DOMAIN' | 'IPV4' | 'IPV6' | 'AUTONOMOUS_SYSTEM';
  handle: string;
  name?: string | null;
  cidr?: string | null;
  parentHandle?: string | null;
  whoisServer?: string | null;
  rdapUrl?: string | null;
  source: 'RDAP' | 'WHOIS_PORT_43';
  status: string[];
  events: RdapEvents;
  entities: RdapEntity[];
  nameservers: string[];
  rawText?: string | null;
}

export interface UpdateStatus {
  isUpdateAvailable: boolean;
  currentVersion: string;
  targetVersion?: string | null;
  releaseNotes?: string | null;
  signatureVerified: boolean;
  pubkey: string;
}

export interface HistoryRecord {
  id: number;
  utility: string;
  query: string;
  resultJson: string;
  createdAt: string;
}

export interface FavoriteRecord {
  id: number;
  utility: string;
  title: string;
  target: string;
  createdAt: string;
}

// Phase 3 LAN Discovery Scanner Types
export interface LanDevice {
  ip: string;
  mac: string;
  vendor: string;
  hostname: string | null;
  latencyMs: number | null;
  isGateway: boolean;
  deviceType: 'Workstation' | 'Mobile' | 'Network Equipment' | 'IoT' | 'Server' | 'Consumer Electronics' | 'Unknown';
  lastSeen: number;
}

export interface LanScanResult {
  interfaceName: string;
  subnetCidr: string;
  totalHostsScanned: number;
  devicesDiscovered: number;
  devices: LanDevice[];
  durationMs: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Phase 4: Enterprise, Watchdog, MultiTrace & Reporting Types
// ---------------------------------------------------------------------------

export type InterfaceHealthState = 'UP' | 'DOWN' | 'DEGRADED';
export type WatchdogAlertType = 'LATENCY_SPIKE' | 'PACKET_LOSS_EXCEEDED' | 'INTERFACE_DOWN' | 'GATEWAY_SHIFT' | 'TARGET_UNREACHABLE';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface WatchdogTargetConfig {
  name: string;
  endpoint: string;
  targetType: string;
  enabled: boolean;
}

export interface WatchdogConfig {
  intervalSecs: number;
  latencyThresholdMs: number;
  lossThresholdPercent: number;
  targets: WatchdogTargetConfig[];
  alertChannels: string[];
}

export interface TargetProbeStatus {
  name: string;
  endpoint: string;
  latencyMs: number | null;
  lossPercent: number;
  isHealthy: boolean;
  lastCheckMs: number;
}

export interface WatchdogAlert {
  id: string;
  alertType: WatchdogAlertType;
  severity: AlertSeverity;
  target: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface WatchdogStatus {
  running: boolean;
  uptimeSecs: number;
  lastProbeTime: number | null;
  activeInterface: string;
  interfaceState: InterfaceHealthState;
  targetStatuses: TargetProbeStatus[];
  totalAlertsEmitted: number;
  recentAlerts: WatchdogAlert[];
}

export type DeviationType = 'HOP_ADDED' | 'HOP_REMOVED' | 'IP_MISMATCH' | 'ASN_SHIFT' | 'LATENCY_ANOMALY';

export interface RouteDeviation {
  hopNumber: number;
  baselineIp: string | null;
  currentIp: string | null;
  baselineAsn: number | null;
  currentAsn: number | null;
  deviationType: DeviationType;
  description: string;
}

export interface MultiTraceConfig {
  targets: string[];
  maxHops?: number;
  timeoutMs?: number;
}

export interface HistoricalPathRecord {
  target: string;
  recordedAt: string;
  totalHops: number;
  hops: HopTelemetry[];
  isBaseline: boolean;
}

export interface TargetTraceProgress {
  target: string;
  currentHop: number;
  maxHops: number;
  hops: HopTelemetry[];
  completed: boolean;
  error: string | null;
  deviations: RouteDeviation[];
}

export interface MultiTraceResult {
  sessionId: string;
  timestamp: number;
  targets: TargetTraceProgress[];
  totalDeviations: number;
}

export type ReportFormat = 'PCAP' | 'CSV' | 'HTML' | 'JSON';
export type ReportType = 'PING_SERIES' | 'TRACEROUTE' | 'PORT_SCAN' | 'LAN_INVENTORY' | 'FULL_AUDIT';

export interface ReportExportRequest {
  format: ReportFormat;
  reportType: ReportType;
  title?: string;
  target?: string;
  pingSamples?: PingSample[];
  hops?: HopTelemetry[];
  ports?: PortResult[];
  lanDevices?: LanDevice[];
  alerts?: WatchdogAlert[];
  rawPacketsHex?: string[];
}

export interface ReportExportResult {
  filename: string;
  format: ReportFormat;
  mimeType: string;
  contentText: string | null;
  contentBase64: string | null;
  sizeBytes: number;
  generatedAt: string;
}

export interface EnterprisePolicyProfile {
  profileId: string;
  profileName: string;
  version: string;
  enforceStrictEgress: boolean;
  maxPortScanConcurrency: number;
  allowedPortRanges: [number, number][];
  prohibitedPorts: number[];
  minProbeIntervalMs: number;
  latencyAlertThresholdMs: number;
  lossAlertThresholdPct: number;
  cloudSyncIntervalMins: number;
  telemetryEnabled: boolean;
}

export interface CloudSyncRequest {
  endpointUrl?: string;
  bearerToken?: string;
  organizationId?: string;
  events?: { id: string; eventType: string; timestamp: number; payload: Record<string, unknown> }[];
  flushOfflineSpool?: boolean;
}

export interface CloudSyncResult {
  syncedCount: number;
  spooledCount: number;
  serverAckId: string;
  status: string;
  syncedAt: string;
}
