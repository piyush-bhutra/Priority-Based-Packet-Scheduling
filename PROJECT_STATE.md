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
The subsequent authorized hygiene cleanup extended `.gitignore` to `.env.*`, common private keys,
credential files/directories and `venv`, while preserving deliberate `.env.example` / `.env.*.example`
templates. All 38 ignore-behavior checks passed. No tracked credential/private-key candidates were found.
The custom A–E/3-ms manual experiment needs its exact input table/output captured before teammates can
reproduce or cite its numerical results; do not replace it with the predefined balanced workload.

## Minimal security cleanup — current verification status

- Baseline: `5e7ba73`; no application, scheduling, package manifest or lockfile changes.
- Registry/advisory inspection: Vitest 3.2.7 and tinypool 1.1.1 are the latest compatible major-line
  releases. Patched transitive versions violate Vitest's declared ranges; major upgrade/overrides were
  deferred as requested. Fresh full npm audit remains **3 packages: 2 critical, 1 moderate**; runtime-only
  npm audit remains **0 findings**. Detailed local-workflow exposure and future action: docs/SECURITY_AUDIT.md.
- Cleanup verification: backend **118 passed**, frontend units **22 passed**, TypeScript/production
  build passed. The initial browser run and command execution stalled; that environment blocker is
  now resolved. A fresh browser run passed **all 13 tests** with no application/configuration changes.
- Publication scan covered 62 source/documentation files, including the pending audit document, and
  all three existing commits: no known credential/private-key patterns or sensitive-file candidates.
  Nineteen current ignore checks passed in addition to the original 38 checks; no tracked files are ignored.
- Hygiene/documentation changes are prepared for a verified checkpoint and the user's authorized
  GitHub push. Application source and dependency files remain unchanged from `5e7ba73`.

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
presentation requirements. The academic report was completed in the shared workspace at
`D:\CN Project\reports\Priority_Based_Packet_Scheduling_Course_Project_Report.docx` on 2026-10-25:
27 pages, the official eleven-chapter template, fifteen recent literature entries, tabulated references,
and six original project figures. All pages were rendered in Word and visually inspected; contents
numbers match the rendered chapter locations. Fifteen fresh predefined-scenario/policy runs match
the saved schedule and aggregate-metric evidence. The team must fill the signing date and signatures.
Contents numbers are static and must be rechecked if later edits change pagination.
The latest report revision also supplies a matching PDF in the same reports directory. It replaces
Introduction subsections with five continuous paragraphs on one page and adds targeted page breaks
for code, workflow and experiment blocks. Both 27-page outputs passed layout and contents checks.
No further UI/scheduling implementation is required for the requested scope. Complete the custom
evidence record, review the disclosed development-dependency findings before a security-clean
release, and review the completed report alongside docs/TEAM_HANDOFF.md. Persistence, mobile layouts, deployment
and additional algorithms remain excluded. The user has now explicitly authorized publication of the
current verified branch to the GitHub repository listed below. The report files referenced above are
outside this source repository and must be shared separately if teammates need the Word/PDF deliverables.

## Git checkpoint

Backend checkpoint: `6af3b3a` — `feat: implement verified packet scheduling backend MVP`.
Frontend checkpoint message: `feat: add verified desktop packet scheduling laboratory`.
Frontend checkpoint hash: `b1db69e`.
Release documentation checkpoint message: `docs: audit release readiness and prepare team handoff`.
Origin: `https://github.com/piyush-bhutra/Priority-Based-Packet-Scheduling.git`.
Fetch/inspection found no existing remote branches before initial publication. The next checkpoint
contains the verified hygiene/documentation changes. Confirm publication by comparing `git rev-parse HEAD`
with `git ls-remote origin refs/heads/master`; this file does not claim a push before it is verified.
