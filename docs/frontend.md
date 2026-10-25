# Packet Lab frontend

## Interface and visual direction

The local laboratory uses a restrained charcoal/mint palette with amber high-priority, blue medium-priority
and lilac low-priority packets. Locally packaged Manrope and IBM Plex Mono distinguish explanatory text
from time, counts and packet identities. The layout targets desktop and laptop screens, with no mobile
navigation or mobile-specific layout. Priority numbers accompany colors; keyboard focus is visible and
reduced-motion preferences disable decorative transitions.

Three views:

- **Simulator:** scenario and packet editor, policy/interval controls, waiting queue, single router,
  active transmission, completed packets, clock, transport controls, Gantt timeline, queue occupancy,
  packet inspection, expandable event trace, aggregate and per-priority metrics.
- **Compare policies:** three result summaries and timelines, original-priority mean waiting bars,
  observations derived from the returned results, and per-packet waiting/turnaround comparison.
- **Lab notes:** policy explanations, model boundaries and a guided 3–5 minute demonstration.

Screenshots: [desktop](frontend-desktop.png), [laptop](frontend-laptop.png),
[comparison](frontend-comparison.png). They show actual backend workloads/results.

## Source structure

| File | Responsibility |
|---|---|
| `frontend/src/App.tsx` | Scenario loading, workload/configuration, request lifecycle and navigation |
| `types.ts` | Typed backend request/result/event definitions and UI labels |
| `api.ts` | Same-origin API calls, timeout/abort handling and actionable errors |
| `workload.ts` | Draft fields, validation before numeric conversion, request serialization |
| `playback.ts` | Rebuild visible state from backend events; no scheduling decisions |
| `usePlayback.ts` | Animation clock, pause/resume/reset, speed, seeking and event stepping |
| `components/PacketEditor.tsx` | Editable packet list with stable row keys, add/remove/restore |
| `components/Simulator.tsx` | Queue/router/link visualization and event trace |
| `components/Charts.tsx` | Returned schedule Gantt, returned queue timeline, packet detail |
| `components/Metrics.tsx` | Complete-result aggregate and class metrics |
| `components/Comparison.tsx` | Fair comparison, class charts, per-packet table, observed differences |
| `components/Guide.tsx` | Demo guidance and policy explanations |
| `styles.css` | Custom visual system and desktop/laptop sizing, Tailwind foundation |
| `frontend/e2e/laboratory.spec.ts` | Real-service Edge browser verification |

React 19.3.1, TypeScript 5.9.3, Vite 7.3.7, Tailwind 4.3.3, Vitest 3.2.7 and Playwright 1.64.1
were installed locally under `frontend/node_modules`. `package-lock.json` records exact dependency
resolution. The Node runtime is 22.16.0; the backend remains in its separate Python `.venv`.

## Integration and state semantics

All three algorithms are submitted in a single `/api/simulate` request using the same validated packet
list and aging interval. Choosing a policy selects one returned result; it never runs an algorithm in
JavaScript. Initial page load fetches health/scenarios and calculates the balanced workload, paused.
Editing packets, loading a scenario or changing the interval clears all prior results. Inputs are disabled
during a request, stale requests are aborted on replacement/unmount, and failures offer Retry. Scenario
restoration is an explicit button. Traffic type and priority remain independent fields.

Draft numeric fields remain strings while editing. Blank values never become zero. Decimal-only input
supports up to six fractional places, a 1,000,000 ms maximum and positive duration/aging interval;
scientific notation is rejected in the editor with a clear message. IDs must be unique/nonblank and at
most 128 characters. The backend still validates every submission. Its modules were not modified.

Playback sorts returned events by timestamp then sequence and replays through the requested position.
Arrival adds a packet to waiting; selection highlights it; transmission_start removes it from waiting
and makes it active; completion transfers it to delivered. A selected packet is still waiting until its
transmission starts. Queue cards display arrival order, not a locally predicted next-service order.

- **Start / Resume / Pause:** controls playback of the already calculated result.
- **Replay:** restarts a completed run. **Reset:** returns before the first event, including events at t=0.
- **Next event:** processes exactly one backend sequence entry, exposing selection/start at identical times.
- **Seek:** pauses and rebuilds state through all events at or before the selected time; backward seeking
  does not retain future completions. Click a Gantt packet to seek to its start and inspect it.
- **Speed:** 0.5×, 1×, 2×, 5×. At 1×, one simulated millisecond plays per wall-clock second.

The progress bar interpolates time only within the active packet's returned start/completion interval.
It does not calculate priority or choose a packet. Queue occupancy, packet timings and full-schedule
metrics always come from backend results. Charts/metrics describe the entire calculated run even when
playback is paused. Original/effective priority are shown separately and labeled “at selection.”

Times are ms, throughput packets/ms, utilization fraction ×100 for display, absent class metrics N/A.
Values are formatted for readability, with six-place timing in packet details and scientific notation
for very small positive ratios. Response equals waiting in this non-preemptive model. Priority-class
analysis always groups by original priority.

## Verification

Executed on 2026-10-25:

- `npm.cmd test`: **22 passed, 0 failed** (event replay/sequence, backward seeks, no mutation,
  queue/active separation, editor validation, exact timing and metric formatting).
- `npm.cmd run build`: strict TypeScript checking and production build successful.
- `npm.cmd run test:e2e`: **13 passed, 0 failed**, using Edge and actual Flask/Vite servers.
- `.venv\Scripts\python.exe -m pytest -q`: **118 passed, 0 failed**.
- Backend, backend tests, PRD, API contract and original demonstration document remain unchanged from
  `6af3b3a` (verified with Git diff).
- Screens inspected at 1920×1080 and 1366×768. No horizontal overflow; playback transport fits the
  laptop viewport. Browser verification detected no JavaScript/console errors on the working path.
- Independent review found no blocking correctness/contract defects. Its minor dead-keyboard-stop
  finding was fixed by rendering comparison timeline segments as static graphics.

Browser coverage includes all five scenarios against all three literal expected schedules, measured
burst/aging observations, editor CRUD, invalid-input prevention, playback/speed/seeking/reset,
same-time stepping, offline recovery, missing class averages, utilization percentage conversion,
original/effective priority and policy-switch reset. The offline test deliberately intercepts responses
to simulate failure; scenario/scheduling tests use real API responses. An initial redundant offline
validation warning was fixed before the final suite passed.

## Suggested 3–5 minute demonstration

1. **0:00–0:45:** Balanced traffic is ready on startup. Start FCFS, pause around t=3, inspect B/C/D in
   waiting while A transmits, then seek the timeline. Show that active A is excluded from waiting.
2. **0:45–1:45:** Load High-priority traffic burst and Run experiment. Open Compare policies.
   Urgent mean waiting changes 5→2 ms; low-priority waiting changes 1.5→3 ms. Point out unchanged
   0.5 packets/ms throughput and 100% utilization.
3. **1:45–3:00:** Load Aging benefit and run. Compare L starting at 16 ms under Strict Priority and
   10 ms under Aging. Replay Aging and seek to 10 ms: L is original P3 but selected at effective P1.
4. **3:00–4:00:** Load Idle output link and run. Inspect initial/interior idle segments and utilization.
   Load Simultaneous arrivals, use Next event to expose deterministic same-time ordering.
5. **4:00–5:00:** Change one duration or aging interval, point out old results are cleared, rerun and
   compare. Explain the educational single-link model and that aging reduces starvation risk rather
   than guaranteeing bounded waiting for arbitrary traffic patterns.

## Remaining scope / limitations

No known blocking integration defect. The app is desktop-first (minimum layout width 1200 px), keeps
workloads/results only in memory and requires both local servers. It is not a real-time network monitor.
Large workloads may produce narrow Gantt segments; the scrollable packet comparison table retains their
timings. Browser testing targets Edge on Windows; other browsers were not certified. Production build
verification does not imply deployment. Academic report preparation and any further features remain
separate work. Existing backend checkpoints are preserved; no remote or push is used.
