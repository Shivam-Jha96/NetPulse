# Code Review Task: Phase 1 Foundation & MVP Desktop Release (Sprints 1–4)

## Objective
Perform a comprehensive, independent code review and verification of Phase 1 implementation against specifications, architecture contracts, and quality standards before Phase 2 begins.

## Working Directory
`.agents/teamwork/reviewer_phase1/`

## Key Specifications & Blueprints
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 1, Sprints 1-4)
- `docs/hld.md` (High-Level Design)
- `docs/lld.md` (Low-Level Design)
- `docs/ui_specification.md` (Design system & tokens)
- `schemas/` (JSON schemas)
- `tests/runner.js` (E2E acceptance runner)
- `.agents/teamwork/worker_phase1/handoff.md` (Phase 1 Worker Handoff Report)

## Verification Checks Required
1. **Verification Commands Execution**:
   - Run `node tests/runner.js` and verify all 28 tests pass.
   - Run `cargo check --workspace --manifest-path src-tauri/Cargo.toml` and verify 0 errors.
   - Run `cargo test --workspace --manifest-path src-tauri/Cargo.toml` and verify all unit tests pass.
   - Run `npm run build` and verify clean TypeScript typechecking and Vite production bundling.
2. **Architecture & Contract Compliance**:
   - Inspect `src-tauri/Cargo.toml` and the 5 crates: `iptracer-core`, `iptracer-net`, `iptracer-geo`, `iptracer-daemon`, `iptracer-ui`.
   - Verify unprivileged Win32 socket implementation in `iptracer-net` (`Iphlpapi.dll` / `IcmpSendEcho2`).
   - Verify bogon filtering in `iptracer-core/src/bogon.rs` against RFC 1918, RFC 3927, RFC 6598, etc.
   - Verify offline fallback in `iptracer-geo/src/mmdb.rs`.
   - Verify continuous ping with RFC 3550 jitter calculation and unprivileged traceroute state machine.
   - Verify subnet / CIDR & VLSM calculator.
   - Verify React 19 presentation layer in `src/` (views, stores, cyber-glassmorphism styles, frameless titlebar).
3. **Code Quality & Robustness**:
   - Check error handling: strongly typed `Result<T, AppError>`, no unhandled `unwrap()` calls on network I/O.
   - Check security: zero elevation required for Phase 1 diagnostics.
4. **Handoff Report**:
   - Write `.agents/teamwork/reviewer_phase1/handoff.md` with:
     - Review Summary & Verdict: **APPROVE** or **REQUEST_CHANGES**
     - Detailed Findings across Architecture, Code Quality, Security, and Verification Results
     - Send message back to orchestrator.
