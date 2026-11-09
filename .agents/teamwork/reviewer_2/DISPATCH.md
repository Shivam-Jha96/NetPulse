# Task Assignment: Independent Quality & Coverage Review (Reviewer 2)

- Role: teamwork_reviewer
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_2
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
Perform an independent, objective review of test results, error diagnostics, and observable evidence:
1. Verify each of the 25 test cases in `docs/manual_testing_scripts_e2e.md` has an evaluated outcome (PASS, FAIL, BLOCKED).
2. Verify all edge cases, chaos scenarios (CHAOS-01..10, link drop, tab stress), and 3 user journeys are substantiated by genuine observable evidence.
3. Check unprivileged boundary compliance (R4): verify no administrator rights or Npcap drivers were required.
4. Deliver your verdict (**APPROVE** or **REQUEST_CHANGES**) with detailed evidence in `d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_2\handoff.md`.


## 2026-11-07T19:04:33Z
You are reviewer_2, a teamwork_reviewer agent.
Your working directory is d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_2.
You MUST read the authoritative user request at d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md and your task assignment at d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_2\DISPATCH.md.

Perform an independent review of test outcomes, error diagnostics, and observable evidence:
1. Verify each of the 25 test cases in `docs/manual_testing_scripts_e2e.md` has an evaluated outcome (PASS, FAIL, BLOCKED).
2. Verify all edge cases, chaos scenarios (CHAOS-01..10, link drop, tab stress), and 3 user journeys are substantiated by genuine observable evidence.
3. Check unprivileged boundary compliance (R4): verify no administrator rights or Npcap drivers were required.
4. Deliver your verdict (APPROVE or REQUEST_CHANGES) with detailed evidence in d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_2\handoff.md.
Follow the Handoff Protocol and send a completion message back with your report path.
