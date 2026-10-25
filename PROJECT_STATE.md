# Project state

Updated: 2026-10-25 (Asia/Calcutta).

## Current milestone

Milestones 1–3: backend MVP implemented and verified. Phase 4 frontend awaits explicit user review
and authorization. This repository is independent of the parent workspace; parent PRD is unchanged.

## Implemented functionality

- Python 3.12.14 isolated `.venv`, Flask 3.1.3, pytest 9.0.2 and complete dependency lock.
- Frozen packet model and strict workload/config validation with actionable field paths.
- Independent FCFS, non-preemptive Priority and Aging selection policies; default interval 5 ms.
- Decimal event engine, arrivals/selection/transmission/completion/idle events, stable same-time ordering.
- Waiting-queue timeline, ordered schedule, per-packet/aggregate/original-priority-class metrics.
- Five documented predefined scenarios and stateless multiple-policy comparison on identical inputs.
- GET health, GET scenarios and POST simulate; JSON errors and 1 MiB request limit.
- Windows setup/execution guidance, API and architecture notes, live verifier and observed reports.

## Verification results

- Executed `.venv\Scripts\python.exe -m pytest -q`: **118 passed, 0 failed**.
- Executed `uv ... pip check`: all 13 installed packages compatible.
- Recreated a separate ignored virtual environment from `backend/requirements.lock`; all 118 tests passed
  there too, verifying the documented uv setup path without changing global Python packages.
- Flask starts with debug disabled on loopback; exercised actual HTTP endpoints successfully.
- Live health 200, scenarios 200, simulate 200 across five scenarios and three algorithms (15 runs),
  invalid empty workload 400. Temporary live-verifier process stopped after completion.
- All 15 orders match literal expected schedules; outputs saved in `docs/verification.json`.
- Independent manual A/C/B schedule matches exact starts, completions, waits, turnaround and metrics.
- Burst high-priority average wait: FCFS 5 ms -> Priority 2 ms; low-priority 1.5 ms -> 3 ms.
- Aging packet L: strict-priority start 16 ms -> aging start 10 ms, effective priority 1.
- Independent code review identified raw JSON rounding, excessive nesting and ambient Decimal validation
  issues. Reproduced with regression tests and fixed; final suite includes those regressions.
- Follow-up independent review found no residual material concerns.
- Original requirements copy checked against parent; no parent Git repository was initialized.

## Known issues and limitations

No known unresolved backend correctness defect after verification and review. Educational model only:
one output link, unbounded queue, no packet loss, routing, capture, protocol overhead or real bandwidth.
No React interface, persistence, deployment, authentication or permissive cross-origin configuration.
JSON display numbers/ratios can have normal floating representation rounding; internal schedule decisions
use Decimal. Finite scenarios demonstrate aging's effect without proving a general waiting bound.

Environment notes: the Windows Python launcher has no registered interpreter. Existing `.venv` derives
from bundled Python, with packages installed using uv into `.venv` only. Its initial ensurepip bootstrap
failed; uv avoids relying on pip in that environment. Sandbox socket restrictions required elevated
execution for live HTTP verification. Both setup alternatives are documented in README.

## Assumptions and decisions

- 1–500 packets; arrival/duration/interval <=1,000,000 ms; exact microsecond input resolution.
- Nonblank IDs <=128 characters, exact six supported traffic labels; users may override suggested priority.
- Derive original index from list order; if supplied it must agree. Unknown input fields are rejected.
- Empty workload rejected explicitly (400), all durations/aging intervals strictly positive.
- Equal-time completion precedes arrivals, then selection/start; arrival ties follow input order.
- Selection retains the selected packet in the waiting count until transmission starts.
- Time interval begins at 0; utilization is a fraction and throughput uses packets/ms.
- Unrepresented priority classes have zero count and null average/maximum.
- Single-policy requests also use an algorithms list and the same results envelope.

## Remaining work and recommended next step

Review this backend completion report and API contract. After explicit Phase 4 authorization, build the
React/TypeScript frontend with a Vite API proxy, packet editor, scenario loading, event-driven playback,
Gantt chart, computed metric comparisons and field-level validation. Playback should use backend events
and schedules without reimplementing policies. Then perform integrated browser testing and prepare the
academic report using the professor's official BITE305L template. No frontend work has begun.

## Git checkpoint

Local checkpoint message: `feat: implement verified packet scheduling backend MVP`.
No remote is configured and nothing is pushed. The checkpoint includes this state file and verified
report; identify it using `git log -1 --oneline` (avoids embedding its own hash in its contents).
