import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  AppResponse,
  DNSInspectionResult,
  ElevationStatus,
  FavoriteRecord,
  HistoryRecord,
  HopTelemetry,
  IpTraceResult,
  LanDevice,
  LanScanResult,
  NetworkInterface,
  PingSample,
  PortResult,
  PortScanResult,
  RdapRecord,
  SubnetCalculationResult,
  UpdateStatus,
  WatchdogConfig,
  WatchdogStatus,
  WatchdogAlert,
  MultiTraceConfig,
  MultiTraceResult,
  TargetTraceProgress,
  HistoricalPathRecord,
  ReportExportRequest,
  ReportExportResult,
  EnterprisePolicyProfile,
  CloudSyncRequest,
  CloudSyncResult,
} from '../types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const api = {
  async traceIp(target: string, options?: { forceRefresh?: boolean }): Promise<AppResponse<IpTraceResult>> {
    if (isTauri) {
      return invoke<AppResponse<IpTraceResult>>('trace_ip', { target, options });
    }

    // High-fidelity fallback / simulated mode when run in standalone browser
    const isBogon = target.startsWith('10.') || target.startsWith('192.168.') || target.startsWith('127.');
    const result: IpTraceResult = {
      query: target || '1.1.1.1',
      ip: target || '1.1.1.1',
      ipVersion: 'IPv4',
      isBogon,
      isAnycast: false,
      hostname: 'one.one.one.one',
      location: {
        continent: 'North America',
        continentCode: 'NA',
        country: isBogon ? 'Local Network' : 'United States',
        countryCode: isBogon ? 'LAN' : 'US',
        region: isBogon ? 'Private Subnet' : 'California',
        regionCode: isBogon ? null : 'CA',
        city: isBogon ? 'Internal' : 'San Jose',
        postalCode: '95113',
        latitude: 37.3382,
        longitude: -121.8863,
        timezone: 'America/Los_Angeles',
        accuracyRadiusKm: 10,
      },
      network: {
        asn: isBogon ? null : 13335,
        asnOrg: isBogon ? 'Local Gateway' : 'Cloudflare Inc.',
        isp: isBogon ? 'Internal LAN' : 'Cloudflare',
        cidr: '1.1.1.0/24',
        bgpPrefix: '1.1.1.0/24',
      },
      threat: {
        abuseConfidenceScore: 0,
        totalReports: 0,
        isTorExit: false,
        isProxy: false,
        isDatacenter: !isBogon,
        threatLevel: 'CLEAN',
        lastReportedAt: null,
      },
      source: 'OFFLINE_MAXMIND',
      provider: 'MaxMind GeoLite2 (Embedded)',
      responseTimeMs: 0.45,
      timestamp: Date.now(),
    };

    return {
      success: true,
      data: result,
      error: null,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        durationMs: 0.45,
        hostPlatform: 'web',
        elevationRequired: false,
      },
    };
  },

  async runTraceroute(config: { target: string; maxHops: number; timeout: { secs: number; nanos: number } }): Promise<AppResponse<{ sessionId: string }>> {
    if (isTauri) {
      return invoke<AppResponse<{ sessionId: string }>>('run_traceroute', { config });
    }
    return {
      success: true,
      data: { sessionId: 'mock-trace-' + Date.now() },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async stopTraceroute(sessionId: string): Promise<AppResponse<boolean>> {
    if (isTauri) {
      return invoke<AppResponse<boolean>>('stop_traceroute', { sessionId });
    }
    return { success: true, data: true, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async startContinuousPing(config: { target: string; interval: { secs: number; nanos: number }; packetSize: number; dfBit: boolean; timeout: { secs: number; nanos: number } }): Promise<AppResponse<{ sessionId: string }>> {
    if (isTauri) {
      return invoke<AppResponse<{ sessionId: string }>>('start_continuous_ping', { config });
    }
    return {
      success: true,
      data: { sessionId: 'mock-ping-' + Date.now() },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async stopContinuousPing(sessionId: string): Promise<AppResponse<boolean>> {
    if (isTauri) {
      return invoke<AppResponse<boolean>>('stop_continuous_ping', { sessionId });
    }
    return { success: true, data: true, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async calculateSubnet(cidr: string, vlsmRequests?: Array<[string, number]>): Promise<AppResponse<SubnetCalculationResult>> {
    if (isTauri) {
      return invoke<AppResponse<SubnetCalculationResult>>('calculate_subnet', { cidr, vlsmRequests });
    }

    // Client-side math calculation fallback
    const parts = cidr.trim().split('/');
    const ip = parts[0] || '192.168.1.0';
    const prefix = parseInt(parts[1] || '24', 10);
    const total = Math.pow(2, 32 - prefix);
    const usable = Math.max(0, total - 2);

    return {
      success: true,
      data: {
        inputIp: ip,
        prefixLength: prefix,
        ipVersion: 'IPv4',
        networkAddress: ip,
        broadcastAddress: ip.replace(/\.\d+$/, '.255'),
        netmask: '255.255.255.0',
        wildcardMask: '0.0.0.255',
        netmaskBinary: '11111111.11111111.11111111.00000000',
        usableRange: {
          firstUsable: ip.replace(/\.\d+$/, '.1'),
          lastUsable: ip.replace(/\.\d+$/, '.254'),
        },
        totalHosts: String(total),
        usableHosts: String(usable),
        ipClass: 'C',
        isPrivate: true,
        isLinkLocal: false,
        isMulticast: false,
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 0.1, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async getNetworkInterfaces(): Promise<AppResponse<NetworkInterface[]>> {
    if (isTauri) {
      return invoke<AppResponse<NetworkInterface[]>>('get_network_interfaces');
    }
    return {
      success: true,
      data: [
        { name: 'Ethernet', ipAddresses: ['192.168.1.105'], macAddress: '00:1A:2B:3C:4D:5E', isUp: true, isLoopback: false },
        { name: 'Loopback', ipAddresses: ['127.0.0.1'], macAddress: null, isUp: true, isLoopback: true },
      ],
      error: null,
      metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async checkElevationStatus(): Promise<AppResponse<ElevationStatus>> {
    if (isTauri) {
      return invoke<AppResponse<ElevationStatus>>('check_elevation_status');
    }
    return {
      success: true,
      data: { isElevated: false, helperConnected: false },
      error: null,
      metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  onHopDiscovered(callback: (hop: HopTelemetry) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<HopTelemetry>('trace:hop-discovered', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  onPingTick(callback: (sample: PingSample) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<PingSample>('ping:tick', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  async scanPorts(config: {
    target: string;
    ports?: string;
    mode?: string;
    concurrency?: number;
    timeoutMs?: number;
    grabBanners?: boolean;
  }): Promise<AppResponse<PortScanResult>> {
    if (isTauri) {
      return invoke<AppResponse<PortScanResult>>('scan_ports', { config });
    }

    // Web simulation mode
    const ports: PortResult[] = [
      { port: 80, protocol: 'TCP', state: 'OPEN', service: 'http', product: 'nginx', version: '1.24.0', banner: 'HTTP/1.1 200 OK\r\nServer: nginx/1.24.0', latencyMs: 14.2 },
      { port: 443, protocol: 'TCP', state: 'OPEN', service: 'https', product: 'nginx', version: '1.24.0', banner: 'HTTP/2 200 OK', tlsInfo: { subject: config.target, issuer: 'Let\'s Encrypt Authority', validTo: '2028-12-31T23:59:59Z', cipher: 'TLS_AES_256_GCM_SHA384', alpn: 'h2' }, latencyMs: 16.8 },
      { port: 8080, protocol: 'TCP', state: 'OPEN', service: 'http-proxy', product: 'Envoy', version: '1.30', banner: 'HTTP/1.1 404 Not Found', latencyMs: 19.5 },
      { port: 22, protocol: 'TCP', state: 'CLOSED', service: 'ssh', latencyMs: null },
      { port: 3306, protocol: 'TCP', state: 'FILTERED', service: 'mysql', latencyMs: null },
    ];

    return {
      success: true,
      data: {
        target: config.target,
        targetIp: '127.0.0.1',
        scanType: (config.mode as any) || 'TCP_CONNECT',
        portRange: config.ports || 'top-100',
        concurrency: config.concurrency || 250,
        durationMs: 420,
        totalPortsScanned: 100,
        openCount: 3,
        closedCount: 1,
        filteredCount: 96,
        ports,
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 420, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async queryDns(
    domain: string,
    recordType = 'A',
    transport = 'UDP_TCP'
  ): Promise<AppResponse<DNSInspectionResult>> {
    if (isTauri) {
      return invoke<AppResponse<DNSInspectionResult>>('query_dns', { domain, recordType, transport });
    }

    // Web simulation mode
    return {
      success: true,
      data: {
        domain,
        queryType: recordType,
        transport,
        authoritativeServer: `ns1.${domain}`,
        responseTimeMs: 18.5,
        dnssecStatus: {
          isValid: true,
          state: 'SECURE',
          keyAlgorithm: 'ECDSAP256SHA256',
          details: 'Cryptographic chain-of-trust validated via Authenticated Data (AD) flag from recursive resolver.',
        },
        records: [
          { name: domain, type: 'A', ttl: 300, value: '104.21.48.12' },
          { name: domain, type: 'A', ttl: 300, value: '172.67.182.201' },
        ],
        propagation: {
          totalResolvers: 18,
          matchedResolvers: 18,
          propagationPercentage: 100,
          resolverResults: [
            { resolverName: 'Cloudflare Anycast', resolverLocation: 'Frankfurt, Germany', countryCode: 'DE', status: 'MATCH', values: ['104.21.48.12', '172.67.182.201'], latencyMs: 12.3 },
            { resolverName: 'Google Public DNS', resolverLocation: 'Mountain View, USA', countryCode: 'US', status: 'MATCH', values: ['104.21.48.12', '172.67.182.201'], latencyMs: 18.9 },
            { resolverName: 'Quad9 Security', resolverLocation: 'Zurich, Switzerland', countryCode: 'CH', status: 'MATCH', values: ['104.21.48.12', '172.67.182.201'], latencyMs: 15.4 },
            { resolverName: 'OpenDNS Cisco', resolverLocation: 'San Francisco, USA', countryCode: 'US', status: 'MATCH', values: ['104.21.48.12', '172.67.182.201'], latencyMs: 22.1 },
            { resolverName: 'AdGuard DNS', resolverLocation: 'Limassol, Cyprus', countryCode: 'CY', status: 'MATCH', values: ['104.21.48.12', '172.67.182.201'], latencyMs: 24.6 },
          ],
        },
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 18.5, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async queryWhois(query: string): Promise<AppResponse<RdapRecord>> {
    if (isTauri) {
      return invoke<AppResponse<RdapRecord>>('query_whois', { query });
    }

    return {
      success: true,
      data: {
        query,
        objectType: query.includes('.') && !query.match(/^\d/) ? 'DOMAIN' : 'IPV4',
        handle: 'NET-1-1-1-0-1',
        name: 'CLOUDFLARENET',
        cidr: '1.1.1.0/24',
        parentHandle: 'NET-1-0-0-0-0',
        whoisServer: 'whois.cloudflare.com',
        rdapUrl: `https://rdap.org/${query}`,
        source: 'RDAP',
        status: ['active', 'clientTransferProhibited'],
        events: {
          registration: '2014-03-14T00:00:00Z',
          expiration: '2029-03-14T00:00:00Z',
          lastChanged: '2024-01-18T10:45:12Z',
          lastUpdateOfRdapDb: '2026-11-01T00:00:00Z',
        },
        entities: [
          {
            handle: 'ABUSE-CF',
            roles: ['abuse'],
            name: 'Cloudflare Abuse Department',
            organization: 'Cloudflare, Inc.',
            email: 'abuse@cloudflare.com',
            phone: '+1-650-319-8930',
            address: '101 Townsend St, San Francisco, CA 94107, USA',
          },
          {
            handle: 'REGISTRAR-1910',
            roles: ['registrar'],
            name: 'Cloudflare Registrar',
            organization: 'Cloudflare, Inc.',
            email: 'registrar@cloudflare.com',
            phone: '+1-650-319-8930',
            address: 'San Francisco, CA, USA',
          },
        ],
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com', 'ns3.cloudflare.com'],
        rawText: `Registry Domain ID: 14895793_DOMAIN_COM-VRSN\nRegistrar: Cloudflare, Inc.\nStatus: active`,
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 12.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async checkForUpdates(): Promise<AppResponse<UpdateStatus>> {
    if (isTauri) {
      return invoke<AppResponse<UpdateStatus>>('check_for_updates');
    }
    return {
      success: true,
      data: {
        isUpdateAvailable: true,
        currentVersion: '1.0.0',
        targetVersion: '1.1.0',
        releaseNotes: 'NetPulse Phase 2 Enhanced Diagnostic Suite: Port Scanner, DNSSEC Inspector, WHOIS/RDAP, 20Hz ECharts streaming.',
        signatureVerified: true,
        pubkey: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      error: null,
      metadata: { requestId: '', timestamp: Date.now(), durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async getVaultHistory(utility: string, limit = 50): Promise<AppResponse<HistoryRecord[]>> {
    if (isTauri) {
      return invoke<AppResponse<HistoryRecord[]>>('get_vault_history', { utility, limit });
    }
    return { success: true, data: [], error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async saveVaultHistory(utility: string, query: string, resultJson: string): Promise<AppResponse<number>> {
    if (isTauri) {
      return invoke<AppResponse<number>>('save_vault_history', { utility, query, resultJson });
    }
    return { success: true, data: 1, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async clearVaultHistory(utility?: string): Promise<AppResponse<boolean>> {
    if (isTauri) {
      return invoke<AppResponse<boolean>>('clear_vault_history', { utility });
    }
    return { success: true, data: true, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async getVaultFavorites(utility?: string): Promise<AppResponse<FavoriteRecord[]>> {
    if (isTauri) {
      return invoke<AppResponse<FavoriteRecord[]>>('get_vault_favorites', { utility });
    }
    return { success: true, data: [], error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async addVaultFavorite(utility: string, title: string, target: string): Promise<AppResponse<number>> {
    if (isTauri) {
      return invoke<AppResponse<number>>('add_vault_favorite', { utility, title, target });
    }
    return { success: true, data: 1, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  async deleteVaultFavorite(id: number): Promise<AppResponse<boolean>> {
    if (isTauri) {
      return invoke<AppResponse<boolean>>('delete_vault_favorite', { id });
    }
    return { success: true, data: true, error: null, metadata: { requestId: '', timestamp: 0, durationMs: 0, hostPlatform: 'web', elevationRequired: false } };
  },

  onPortFound(callback: (port: PortResult) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<PortResult>('port:found', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  onPortFoundBatch(callback: (batch: PortResult[]) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<PortResult[]>('port:found-batch', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },


  async requestElevation(): Promise<AppResponse<ElevationStatus>> {
    if (isTauri) {
      return invoke<AppResponse<ElevationStatus>>('request_elevation');
    }
    return {
      success: true,
      data: { isElevated: true, helperConnected: true },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async scanLan(interfaceName?: string): Promise<AppResponse<LanScanResult>> {
    if (isTauri) {
      return invoke<AppResponse<LanScanResult>>('scan_lan', { interfaceName });
    }

    // High-fidelity web fallback simulation
    const mockDevices: LanDevice[] = [
      {
        ip: '192.168.1.1',
        mac: '6C:4F:89:97:71:C0',
        vendor: 'Cisco Systems, Inc.',
        hostname: 'gateway.lan',
        latencyMs: 0.85,
        isGateway: true,
        deviceType: 'Network Equipment',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.10',
        mac: '2C:71:FF:B9:7F:1F',
        vendor: 'Apple, Inc.',
        hostname: 'MacBook-Pro.local',
        latencyMs: 1.24,
        isGateway: false,
        deviceType: 'Workstation',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.50',
        mac: 'B8:27:EB:55:12:34',
        vendor: 'Raspberry Pi Foundation',
        hostname: 'raspberrypi.local',
        latencyMs: 2.15,
        isGateway: false,
        deviceType: 'IoT',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.65',
        mac: '24:0A:C4:AA:BB:CC',
        vendor: 'Espressif Inc.',
        hostname: 'esp32-sensor.local',
        latencyMs: 3.42,
        isGateway: false,
        deviceType: 'IoT',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.88',
        mac: '00:01:E6:12:34:56',
        vendor: 'HP Inc.',
        hostname: 'HP-LaserJet-M404.local',
        latencyMs: 2.85,
        isGateway: false,
        deviceType: 'Workstation',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.105',
        mac: '00:1A:2B:3C:4D:5E',
        vendor: 'Intel Corporation',
        hostname: 'DESKTOP-NETPULSE.local',
        latencyMs: 0.15,
        isGateway: false,
        deviceType: 'Workstation',
        lastSeen: Date.now(),
      },
      {
        ip: '192.168.1.120',
        mac: '00:00:F0:11:22:33',
        vendor: 'Samsung Electronics',
        hostname: 'Galaxy-S24.local',
        latencyMs: 4.12,
        isGateway: false,
        deviceType: 'Mobile',
        lastSeen: Date.now(),
      },
    ];

    return {
      success: true,
      data: {
        interfaceName: interfaceName || 'Ethernet / Wi-Fi',
        subnetCidr: '192.168.1.0/24',
        totalHostsScanned: 254,
        devicesDiscovered: mockDevices.length,
        devices: mockDevices,
        durationMs: 450.0,
        timestamp: Date.now(),
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 450.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  onLanDeviceDiscovered(callback: (device: LanDevice) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<LanDevice>('lan:device-discovered', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  onLanDeviceDiscoveredBatch(callback: (batch: LanDevice[]) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<LanDevice[]>('lan:device-discovered-batch', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  // ---------------------------------------------------------------------------
  // Phase 4 Sentinel Watchdog
  // ---------------------------------------------------------------------------
  async startWatchdog(config?: WatchdogConfig): Promise<AppResponse<WatchdogStatus>> {
    if (isTauri) {
      return invoke<AppResponse<WatchdogStatus>>('start_watchdog', { config });
    }
    const mockStatus: WatchdogStatus = {
      running: true,
      uptimeSecs: 1,
      lastProbeTime: Date.now(),
      activeInterface: 'Ethernet',
      interfaceState: 'UP',
      targetStatuses: [
        { name: 'Default Gateway', endpoint: '192.168.1.1', latencyMs: 1.2, lossPercent: 0, isHealthy: true, lastCheckMs: Date.now() },
        { name: 'Primary DNS', endpoint: '1.1.1.1', latencyMs: 12.4, lossPercent: 0, isHealthy: true, lastCheckMs: Date.now() },
        { name: 'Public Anchor', endpoint: '8.8.8.8', latencyMs: 14.8, lossPercent: 0, isHealthy: true, lastCheckMs: Date.now() },
      ],
      totalAlertsEmitted: 0,
      recentAlerts: [],
    };
    return {
      success: true,
      data: mockStatus,
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 5.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async stopWatchdog(): Promise<AppResponse<boolean>> {
    if (isTauri) {
      return invoke<AppResponse<boolean>>('stop_watchdog');
    }
    return {
      success: true,
      data: true,
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 1.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async getWatchdogStatus(): Promise<AppResponse<WatchdogStatus>> {
    if (isTauri) {
      return invoke<AppResponse<WatchdogStatus>>('get_watchdog_status');
    }
    return {
      success: true,
      data: {
        running: false,
        uptimeSecs: 0,
        lastProbeTime: null,
        activeInterface: 'Ethernet',
        interfaceState: 'UP',
        targetStatuses: [],
        totalAlertsEmitted: 0,
        recentAlerts: [],
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 1.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  onWatchdogStatus(callback: (status: WatchdogStatus) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<WatchdogStatus>('watchdog:status', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  onWatchdogAlert(callback: (alert: WatchdogAlert) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<WatchdogAlert>('watchdog:alert', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  // ---------------------------------------------------------------------------
  // Phase 4 Multi-Target Traceroute & Historical Deviation
  // ---------------------------------------------------------------------------
  async runMultiTrace(config: MultiTraceConfig): Promise<AppResponse<MultiTraceResult>> {
    if (isTauri) {
      return invoke<AppResponse<MultiTraceResult>>('run_multitrace', { config });
    }
    const mockTargets: TargetTraceProgress[] = config.targets.map((tgt) => ({
      target: tgt,
      currentHop: 3,
      maxHops: config.maxHops || 30,
      hops: [
        { ttl: 1, ip: '192.168.1.1', hostname: 'gateway.lan', asn: null, asnOrg: null, countryCode: null, city: null, latitude: null, longitude: null, lossPercent: 0, sent: 1, received: 1, rttLast: 1.2, rttAvg: 1.2, rttBest: 1.2, rttWorst: 1.2, rttStdev: 0 },
        { ttl: 2, ip: '10.0.0.1', hostname: null, asn: 13335, asnOrg: 'Cloudflare', countryCode: 'US', city: null, latitude: null, longitude: null, lossPercent: 0, sent: 1, received: 1, rttLast: 8.5, rttAvg: 8.5, rttBest: 8.5, rttWorst: 8.5, rttStdev: 0 },
        { ttl: 3, ip: tgt, hostname: null, asn: 13335, asnOrg: 'Cloudflare', countryCode: 'US', city: null, latitude: null, longitude: null, lossPercent: 0, sent: 1, received: 1, rttLast: 14.2, rttAvg: 14.2, rttBest: 14.2, rttWorst: 14.2, rttStdev: 0 },
      ],
      completed: true,
      error: null,
      deviations: [],
    }));
    return {
      success: true,
      data: {
        sessionId: 'sim-mtrace-' + Date.now(),
        timestamp: Date.now(),
        targets: mockTargets,
        totalDeviations: 0,
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 25.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async getHistoricalPaths(target: string): Promise<AppResponse<HistoricalPathRecord[]>> {
    if (isTauri) {
      return invoke<AppResponse<HistoricalPathRecord[]>>('get_historical_paths', { target });
    }
    return {
      success: true,
      data: [],
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 2.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  onMultiTraceProgress(callback: (progress: TargetTraceProgress) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<TargetTraceProgress>('multitrace:progress', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  onMultiTraceCompleted(callback: (result: MultiTraceResult) => void): () => void {
    if (!isTauri) return () => {};
    let active = true;
    const promise = listen<MultiTraceResult>('multitrace:completed', (event) => {
      if (active) callback(event.payload);
    });
    return () => {
      active = false;
      promise.then((unlisten) => unlisten());
    };
  },

  // ---------------------------------------------------------------------------
  // Phase 4 Diagnostic Reporting & Export
  // ---------------------------------------------------------------------------
  async exportReport(request: ReportExportRequest): Promise<AppResponse<ReportExportResult>> {
    if (isTauri) {
      return invoke<AppResponse<ReportExportResult>>('export_report', { request });
    }
    const ext = request.format.toLowerCase();
    const filename = `netpulse_export_${Date.now()}.${ext}`;
    return {
      success: true,
      data: {
        filename,
        format: request.format,
        mimeType: request.format === 'HTML' ? 'text/html' : request.format === 'CSV' ? 'text/csv' : 'application/json',
        contentText: request.format !== 'PCAP' ? `Mock export content for ${request.reportType}` : null,
        contentBase64: request.format === 'PCAP' ? 'AAAA' : null,
        sizeBytes: 1024,
        generatedAt: new Date().toISOString(),
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 12.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  // ---------------------------------------------------------------------------
  // Phase 4 Enterprise Policy & Cloud Telemetry
  // ---------------------------------------------------------------------------
  async syncCloudTelemetry(request: CloudSyncRequest): Promise<AppResponse<CloudSyncResult>> {
    if (isTauri) {
      return invoke<AppResponse<CloudSyncResult>>('sync_cloud_telemetry', { request });
    }
    return {
      success: true,
      data: {
        syncedCount: request.events?.length || 0,
        spooledCount: 0,
        serverAckId: 'ack-sim-' + Date.now(),
        status: 'SYNCED',
        syncedAt: new Date().toISOString(),
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 50.0, hostPlatform: 'web', elevationRequired: false },
    };
  },

  async getEnterprisePolicy(profileId?: string): Promise<AppResponse<EnterprisePolicyProfile>> {
    if (isTauri) {
      return invoke<AppResponse<EnterprisePolicyProfile>>('get_enterprise_policy', { profileId });
    }
    return {
      success: true,
      data: {
        profileId: profileId || 'corp-standard-v1',
        profileName: 'NetPulse Corporate Standard Diagnostic Policy',
        version: '1.0.0',
        enforceStrictEgress: false,
        maxPortScanConcurrency: 100,
        allowedPortRanges: [[1, 10000], [20000, 30000]],
        prohibitedPorts: [23, 135, 139, 445],
        minProbeIntervalMs: 100,
        latencyAlertThresholdMs: 100,
        lossAlertThresholdPct: 5,
        cloudSyncIntervalMins: 15,
        telemetryEnabled: true,
      },
      error: null,
      metadata: { requestId: crypto.randomUUID(), timestamp: Date.now(), durationMs: 3.0, hostPlatform: 'web', elevationRequired: false },
    };
  },
};
