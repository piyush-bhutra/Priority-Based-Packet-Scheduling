# Project state

Updated: 2026-10-25 (Asia/Calcutta).

## Current milestone

Milestones 1–5: backend MVP and authorized desktop frontend implemented, integrated and verified.
The backend remains frozen at `6af3b3a`; its code, tests and API contract are unchanged. This repository
is independent of the parent workspace; parent PRD is unchanged. Local professor demonstration is ready.
Frontend/manual acceptance is complete per the user's confirmation. Implementation is frozen for
teammate handoff and academic report preparation; the release audit below records remaining evidence
and development-tooling findings separately from functional readiness.

## Implemented functionality

- Python 3.12.14 isolated `.venv`, Flask 3.1.3, pytest 9.0.2 and complete dependency lock.
- Frozen packet model and strict workload/config validation with actionable field paths.
- Independent FCFS, non-preemptive Priority and Aging selection policies; default interval 5 ms.
- Decimal event engine, arrivals/selection/transmission/completion/idle events, stable same-time ordering.
- Waiting-queue timeline, ordered schedule, per-packet/aggregate/original-priority-class metrics.
- Five documented predefined scenarios and stateless multiple-policy comparison on identical inputs.
- GET health, GET scenarios and POST simulate; JSON errors and 1 MiB request limit.
- Windows setup/execution guidance, API and architecture notes, live verifier and observed reports.
- React/TypeScript/Vite desktop laboratory with bespoke charcoal/mint styling and local fonts.
- Scenario/packet editor, add/edit/remove/restore, independent traffic type and priority, validated inputs.
- Start/pause/resume/replay/reset, speed, time seeking and exact backend-event stepping.
- Live waiting/router/transmission/delivered visualization; Gantt, queue chart, packet inspection and trace.
- Three-policy comparison from identical submissions, class delay charts, packet comparison and computed observations.
- Original/effective aging priority, correct units/N/A classes, loading/error/retry states and guided demo.
- Vite proxy to Flask, production build, unit/browser tests and screenshot verification.

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
- Frontend `npm.cmd test`: **22 passed, 0 failed**.
- Frontend `npm.cmd run build`: strict TypeScript check and Vite production build succeeded.
- Frontend `npm.cmd run test:e2e`: **13 passed, 0 failed**, using Edge and real local Flask/Vite.
- Browser checks covered all five scenarios/all three schedules, editor changes, input errors, pause/resume,
  reset/speed/seek, same-time events, API failure recovery, N/A classes and aging priority inspection.
- Layout/screenshots verified at 1920×1080 and 1366×768; no horizontal overflow and laptop transport fits.
- Backend regression suite rerun after integration: **118 passed**. Git diff against `6af3b3a` confirms
  no changes to backend/, tests/, PRD.md, docs/api.md or docs/demonstrations.md.
- Frontend independent review found no blocking issues. Static comparison Gantt segments were removed
  from keyboard tab order following its minor accessibility observation.
- Final release audit reran pytest (**118 passed**), frontend units (**22 passed**), Edge integration
  (**13 passed**, including clean server startup), explicit `npx.cmd tsc --noEmit` and production build
  (both exit 0). Source still matches backend `6af3b3a` and frontend `b1db69e` exactly.
- User-reported manual custom A–E workload acceptance includes expected FCFS/Priority/Aging schedules
  and aging-interval-dependent order, including interval 3 ms. This is manual user evidence; exact
  input rows and numerical outputs were not persisted in the repository and have been requested.
- Tracked/history scan covered 60 files and both implementation commits: no known credential-pattern
  matches and no tracked virtual environments, node_modules, build output or cache artifacts.

## Known issues and limitations

No known unresolved backend correctness defect after verification and review. Educational model only:
one output link, unbounded queue, no packet loss, routing, capture, protocol overhead or real bandwidth.
No persistence, deployment, authentication or permissive cross-origin configuration.
JSON display numbers/ratios can have normal floating representation rounding; internal schedule decisions
use Decimal. Finite scenarios demonstrate aging's effect without proving a general waiting bound.
The frontend requires both local servers, uses a minimum desktop layout width of 1200 px and keeps
edits/results in browser memory only. Large workloads can produce narrow Gantt segments; full timing
values remain available in the packet comparison table. Edge/Windows is the verified browser target.

Release-audit findings (2026-10-25): `npm audit` reports three vulnerable development dependency
packages (two critical, one moderate) in Vitest/tinypool/@vitest/mocker. Runtime-only
`npm audit --omit=dev` reports zero findings. No dependency changes were made under the documentation-only
freeze. This is not a clean dependency-security sign-off; see docs/TEAM_HANDOFF.md for advisories.
The existing `.gitignore` covers actual project environments/generated output and `.env`, but not
`.env.*`, private keys or a differently named `venv`. None are tracked; broader rules remain a follow-up.
The custom A–E/3-ms manual experiment needs its exact input table/output captured before teammates can
reproduce or cite its numerical results; do not replace it with the predefined balanced workload.

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
- The frontend requests all three policies together for comparison; policy selection only chooses which
  backend result to display. Any workload/aging edit clears all prior results.
- Replay uses timestamp then event sequence; queue cards retain arrival order. No scheduling is implemented
  in JavaScript. At 1× playback, one simulated ms is shown over one wall-clock second.
- Frontend numerical fields accept decimal notation with up to six fractional places; backend validates again.

## Remaining work and recommended next step

Rehearse the 3–5 minute demonstration in docs/frontend.md and review the interface with the professor's
presentation requirements. Prepare the academic report using the official BITE305L template when supplied.
No further UI/scheduling implementation is required for the requested scope. Complete the custom
evidence record, review the disclosed development-dependency/ignore findings before a security-clean
release, and prepare the report from docs/TEAM_HANDOFF.md. Persistence, mobile layouts, deployment
and additional algorithms remain excluded. No remote or push has been authorized by this audit.

## Git checkpoint

Backend checkpoint: `6af3b3a` — `feat: implement verified packet scheduling backend MVP`.
Frontend checkpoint message: `feat: add verified desktop packet scheduling laboratory`.
Frontend checkpoint hash: `b1db69e`.
Release documentation checkpoint message: `docs: audit release readiness and prepare team handoff`.
No remote is configured and nothing is pushed. The checkpoint includes this state file and verified
report; identify the latest checkpoint using `git log -1 --oneline`.
