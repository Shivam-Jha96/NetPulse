# Task Assignment: Replacement Worker for Milestone M1 (Finalization & Delivery)

- Role: teamwork_worker
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2
- Authoritative User Request: d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md
- Project Scope Document: d:\Dev\repos\NetPulse\.agents\teamwork\orchestrator_1\PROJECT.md
- Predecessor Work:
  - `tests/e2e/cdp_driver.js`
  - `tests/e2e/run_m1_suites.js`
  - `tests/e2e/artifacts/screenshots/`
  - `tests/e2e/artifacts/telemetry/`
  - `.agents/teamwork/worker_m1/progress.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Predecessor `worker_m1` authored `tests/e2e/cdp_driver.js` and `tests/e2e/run_m1_suites.js`, and generated screenshots and telemetry, but encountered a system network disconnection before writing its final handoff.
Your job as replacement worker (`worker_m1_gen2`):
1. Execute `node tests/e2e/run_m1_suites.js` to run the complete M1 test suite against `src-tauri/target/release/netpulse.exe`.
2. Verify that all 9 test cases in M1 pass with clean execution:
   - `MTS-SHELL-001`, `MTS-SHELL-002`, `MTS-SHELL-003`
   - `MTS-DASH-001`, `MTS-DASH-002`
   - `MTS-TRACE-001`, `MTS-TRACE-002`
   - `MTS-MTRACE-001`
   - `MTS-WATCH-001`
3. Inspect the observable evidence (screenshots, telemetry JSON, console logs) to ensure complete integrity.
4. Deliver the complete Milestone M1 test execution handoff report to `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2\handoff.md` with:
   - Table of all 9 test cases with evaluated outcomes (PASS/FAIL/BLOCKED)
   - Duration of each test
   - File paths of screenshots and telemetry JSON evidence
   - 5-component handoff protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
5. Send a completion message to the parent orchestrator with your report path.


## 2026-11-07T18:03:09Z
[Message] timestamp=2026-11-07T18:03:09Z sender=4e4fab85-c0a4-4e1b-9597-cd603615e99c priority=MESSAGE_PRIORITY_HIGH content=You are worker_m1_gen2, a teamwork_worker agent replacing worker_m1.
Your working directory is d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2.
You MUST read the authoritative user request at d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md and your task assignment at d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope: Finalize and verify Milestone M1 Test Execution
1. Run `node tests/e2e/run_m1_suites.js` to execute all 9 M1 test cases against `src-tauri/target/release/netpulse.exe`:
   - MTS-SHELL-001, MTS-SHELL-002, MTS-SHELL-003
   - MTS-DASH-001, MTS-DASH-002
   - MTS-TRACE-001, MTS-TRACE-002
   - MTS-MTRACE-001
   - MTS-WATCH-001
2. Verify all tests pass, check the screenshots in `tests/e2e/artifacts/screenshots/` and telemetry in `tests/e2e/artifacts/telemetry/`.
3. Deliver your comprehensive execution report to `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2\handoff.md`.
Follow the Handoff Protocol and send a completion message back with your report path.
