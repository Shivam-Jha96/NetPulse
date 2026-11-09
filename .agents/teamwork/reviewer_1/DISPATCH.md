# Task Assignment: Independent Quality & Coverage Review (Reviewer 1)

- Role: teamwork_reviewer
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_1
- Authoritative User Request: d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md
- Specification Document: d:\Dev\repos\NetPulse\docs\manual_testing_scripts_e2e.md
- Test Runners:
  - `tests/e2e/cdp_driver.js`
  - `tests/e2e/run_m1_suites.js`
  - `tests/e2e/run_m2_suites.js`
  - `tests/e2e/run_m3_suites.js`
- Artifacts:
  - Screenshots: `tests/e2e/artifacts/screenshots/`
  - Telemetry: `tests/e2e/artifacts/telemetry/`
  - Reports: `tests/e2e/artifacts/reports/`
- Worker Handoff Reports:
  - `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2\handoff.md`
  - `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m2\handoff.md`
  - `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3\handoff.md`

## Objective
Perform an exhaustive, objective, and adversarial review of the complete manual test execution across all 14 test suites and 25 test cases:
1. Verify 100% test case coverage against `docs/manual_testing_scripts_e2e.md` (MTS-SHELL through MTS-CHAOS, plus 10 chaos vectors, 2 stress scenarios, and 3 user journeys).
2. Inspect the test implementation in `run_m1_suites.js`, `run_m2_suites.js`, and `run_m3_suites.js`.
3. Inspect and validate the observable artifacts: screenshots, JSON telemetry files, and exported report formats (HTML, CSV, JSON, binary PCAP header).
4. Run independent verification commands (e.g., `node tests/runner.js` or inspect binary outputs) to confirm compliance.
5. Deliver your verdict (**APPROVE** or **REQUEST_CHANGES**) with detailed evidence in `d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_1\handoff.md`.


## 2026-11-07T19:04:28Z
You are reviewer_1, a teamwork_reviewer agent.
Your working directory is d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_1.
You MUST read the authoritative user request at d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md and your task assignment at d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_1\DISPATCH.md.

Perform an independent review of the complete manual test execution across all 14 test suites and 25 test cases in `docs/manual_testing_scripts_e2e.md`:
1. Verify 100% test case coverage against `docs/manual_testing_scripts_e2e.md` (MTS-SHELL through MTS-CHAOS, plus 10 chaos vectors, 2 stress scenarios, and 3 user journeys).
2. Inspect the test implementation in `run_m1_suites.js`, `run_m2_suites.js`, and `run_m3_suites.js`.
3. Inspect and validate the observable artifacts: screenshots, JSON telemetry files, and exported report formats (HTML, CSV, JSON, binary PCAP header).
4. Run independent verification commands (e.g., `node tests/runner.js` or inspect binary outputs) to confirm compliance.
5. Deliver your verdict (APPROVE or REQUEST_CHANGES) with detailed evidence in d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_1\handoff.md.
Follow the Handoff Protocol and send a completion message back with your report path.
