# Troubleshooting Guide 🩺

> Practical recipes and diagnostic procedures for resolving real-world networking problems with NetPulse.

---

## 🛠️ Recipe 1: Diagnosing Slow Wi-Fi, Bufferbloat, or Packet Loss

When an internet connection feels sluggish, drops calls, or stutters during video meetings:

### Step 1: Test Your Local Gateway (Wi-Fi Link)
1. Open **Ping Monitor** (<kbd>Ctrl</kbd>+<kbd>3</kbd>).
2. Enter your local router IP (typically `192.168.1.1` or `10.0.0.1`).
3. Click **Start Ping**.
4. **Evaluate Results**:
   - **Baseline Healthy**: RTT < 2 ms, Jitter < 1 ms, Packet Loss = 0%.
   - **Local Wi-Fi Issue**: RTT > 15 ms, jitter spikes, or packet loss > 1%.
   - **Remediation**: If pinging your router is poor, the problem is local Wi-Fi interference, distance, or a congested Wi-Fi channel. Switch to 5 GHz/6 GHz, adjust router placement, or plug in an Ethernet cable.

### Step 2: Test Your External Internet Egress
1. If the router test was clean, change the Ping target to a public reference such as `1.1.1.1` or `8.8.8.8`.
2. Observe RTT and loss:
   - If packet loss appears now, the issue is on your ISP's physical line or upstream transit.

### Step 3: Pinpoint the Exact Failing Hop
1. Open **IP Trace & MTR** (<kbd>Ctrl</kbd>+<kbd>2</kbd>).
2. Enter `1.1.1.1` and click **Start Traceroute**.
3. Inspect the Hop Table:
   - Identify the exact hop number where packet loss begins or latency jumps significantly.
   - Note the ISP or carrier associated with that hop to include in your ISP support ticket.

---

## 🛠️ Recipe 2: Verifying Domain Migrations & DNS Propagation

When you move a domain to a new web server or update DNS records (A, CNAME, MX):

1. Open **DNS Inspector**.
2. Enter your domain name and select record type `A`.
3. First query using **UDP/TCP Transport** (System DNS).
   - This shows what your local computer and local ISP currently see.
4. Next query using **DoH Transport** (Cloudflare / Google).
   - This bypasses local ISP caching and queries global Anycast resolvers.
5. Review the **Global Propagation Grid**:
   - Check status across 15+ global nodes in North America, Europe, Asia, Australia, and South America.
   - If 14/15 nodes report the new IP, global propagation is complete, and any local client still seeing the old server needs to flush their local DNS cache (`ipconfig /flushdns` on Windows or `sudo dscacheutil -flushcache` on macOS).

---

## 🛠️ Recipe 3: Auditing Local Network for Rogue or Unknown Devices

To verify who and what is connected to your office or home network:

1. Open **LAN Scanner** from the sidebar.
2. Select your active Wi-Fi or Ethernet network adapter.
3. Click **Scan Network**.
4. NetPulse sweeps the local `/24` subnet using unprivileged ARP/ICMP requests.
5. Review the discovered device list:
   - Look for unexpected hardware manufacturers (e.g. unknown IoT vendors like Espressif, Tuya, or unknown hardware).
   - Click the **IoT** or **Mobile** filter chips to audit specific device classes.
   - Copy the MAC address of any unauthorized device to blacklist it on your router's administration interface.

---

## 🛠️ Recipe 4: Partitioning Subnets with the VLSM Calculator

To partition a larger IP block into departmental subnets without overlapping addresses:

1. Open **Subnet & VLSM** (<kbd>Ctrl</kbd>+<kbd>4</kbd>).
2. Enter your assigned base block (e.g. `10.50.0.0/22` - 1,022 usable hosts).
3. Under the **VLSM Subnet Planner**, add your required departmental tiers:
   - *Corporate Servers*: 30 hosts
   - *Workstations*: 250 hosts
   - *VoIP Phones*: 120 hosts
   - *Guest Wi-Fi*: 500 hosts
4. Click **Calculate VLSM**.
5. NetPulse calculates the optimal mask for each department (e.g. `/23`, `/24`, `/25`, `/27`), assigns start and broadcast boundaries, and lists available unallocated headroom for future growth.

---

## 🛠️ Recipe 5: Generating Network Evidence for ISP Support Tickets

When reporting packet loss or routing problems to your ISP:

1. Complete a 60-second test in **Ping Monitor** against the problematic endpoint.
2. Complete a 30-hop trace in **IP Trace & MTR** to capture the failing router hop.
3. Click **Export Report** (<kbd>⬇ Download</kbd>) in the top window title bar.
4. Select **Full Workstation Audit** and choose **HTML Audit**, **RFC 4180 CSV**, or **Raw JSON**.
5. Click **Download Report**.
6. Attach the generated document directly to your ISP support ticket as verified forensic network evidence.

---

## 🛠️ Recipe 6: Generating Wireshark Packet Captures (`.pcap`) Without Npcap

When security or network teams request raw PCAP captures for protocol inspection:

1. Run your network diagnostics in NetPulse (Ping, Trace, Port Scan, or LAN sweep).
2. Click **Export Report** in the title bar or Workstation Settings.
3. Select **Libpcap (PCAP)** as the target format.
4. NetPulse serializes the captured socket probes into a standard `libpcap 2.4` binary file using native Rust memory buffers without requiring Npcap OEM drivers or administrator privileges.
5. Save the `.pcap` file and open it immediately in **Wireshark** or **tcpdump** for deep frame analysis.
