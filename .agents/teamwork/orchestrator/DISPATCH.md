## 2026-11-05T14:37:36Z
The overall orchestrator agent should use Argon LLM and subagents should be on Gemini 3.8 Flash. Use an orchestrator to look over all phases and create sequential worker subagents to complete the phases, dividing work amongst themselves in all phases, with a code-review agent to perform its tasks once each phase milestone is completed. Complete the full NetPulse cross-platform network diagnostics and IP geolocation desktop suite across all four phases in one go and push the repository to GitHub as the final step.

Working directory: d:\Dev\repos\NetPulse
Integrity mode: development

Reference material:
- PROJECT.md, README.md
- docs/implementation_roadmap.md (Phases 1-4, Sprints 1-16)
- docs/hld.md, docs/lld.md, docs/ui_specification.md
- mockups/, schemas/, tests/runner.js

## Requirements

### R1. Complete NetPulse Implementation Across All Phases
Implement the NetPulse application as specified in the blueprints and implementation roadmap across all 4 phases:
- Phase 1 (Sprints 1-4): Foundation & MVP Desktop Release (Tauri v2 + PAL sockets, Egress IP & GeoLite2, ICMP Ping/Traceroute, Subnet Calculator, Desktop packaging).
- Phase 2 (Sprints 5-8): Enhanced Diagnostic Suite (Port Scanner, DNS Inspector, WHOIS/RDAP, 20Hz Telemetry & ECharts, Auto-updater).
- Phase 3 (Sprints 9-12): Deep Packet Intelligence & Hardening (Privilege daemon `iptracer-helper`, SYN stealth scan, LAN ARP discovery, code signing & hardening; support non-elevated graceful fallback / simulated mode when elevation is absent).
- Phase 4 (Sprints 13-16): Enterprise, Telemetry & Ecosystem (Sentinel watchdogs & alerts, multi-target traceroute, cloud sync stubs & reporting).

### R2. Orchestrated Worker Subagents and Milestone Code Reviews
The orchestrator coordinates sequential worker subagents dividing the workload across all phases. After each phase milestone is completed, a dedicated code-review agent reviews and verifies the changes against specifications, architecture contracts, and quality standards before proceeding to the next phase.

### R3. Regular Progress Reporting
Provide a progress report every 5 minutes detailing current sprint/phase status, completed tasks, and upcoming work.

### R4. GitHub Remote Push
As the final step, push the completed repository and all commits to `origin master` (configuring the remote as needed).
