# Frontend implementation plan

Spec: PRD.md, docs/api.md, docs/demonstrations.md and the Phase 4 authorization.
Baseline: 6af3b3a. Preserve backend/, tests/ and existing checkpoints. Local execution only.

## Visual direction

Build a desktop network laboratory, optimized for 1920x1080 and 1366x768. Charcoal canvas,
quiet ruled panels, mint primary actions, amber high / blue medium / lilac low priority.
Use locally packaged Manrope and IBM Plex Mono. Give the simulation the largest visual area;
avoid ornamental charts, gradients and unrelated statistics. Use motion for transmission progress,
queue entry and state changes; respect reduced-motion preferences.

Simulator: editable workload rail, policy controls, arrival-ordered waiting queue, router/output link,
completed packets, transport/seek controls, Gantt timeline, queue occupancy, metrics and packet details.
Comparison: all three API results from one request, aligned timelines, class waiting bars, per-packet
waiting/turnaround and computed observations. Guide: concise policy descriptions and a 3–5 minute demo.

## Architecture and contracts

React/TypeScript + Vite, Tailwind integration plus bespoke CSS, lightweight SVG charts.
`src/types.ts` models the API. `api.ts` handles errors/timeouts. `playback.ts` replays only returned
events ordered by timestamp and sequence; it contains no scheduling policy. `usePlayback.ts` controls
time and same-timestamp event stepping. Separate components own editor, simulation, charts and results.
All three policies run in one real POST for fair comparison; the active policy selects the visible result.
Snapshots retain submitted packet definitions. Any workload/aging edit invalidates results. Controls lock
during requests; abort on unmount; no stale result may overwrite a changed workload. Blank numeric fields
remain invalid instead of being coerced to zero. N/A for absent classes, utilization *100 only for display.

## Work and checks

1. Scaffold frontend, proxy /api to Flask on 127.0.0.1:5000, install dependencies locally with lockfile.
2. Test event replay, equal-time sequence steps, backwards seek, queue/active separation, numeric input
   validation and computed observations before implementing their modules.
3. Build the complete interface and integration, including offline/error, loading and empty states.
4. Typecheck/production build/unit tests; browser tests against the real Flask API for every scenario,
   all policies, edit/add/delete, pause/resume/reset/seek/speed, invalid inputs and API failures.
5. Inspect screenshots at 1920x1080 and 1366x768; fix layout/accessibility defects and console errors.
6. Run backend regression suite; verify no backend diff vs 6af3b3a; document exact commands/results,
   update PROJECT_STATE.md and create a local frontend checkpoint. No remote/push.

Decisions: use the current requested repository without an extra worktree; no mobile-specific work.
Reuse the explicit authorization to implement the design and routine technical details in this session.

## Completion record

All six work stages completed. Playback/editor tests were first observed failing against unimplemented
modules; final frontend unit suite is 22 passed. All 13 real-service browser tests pass, including
15 scenario/policy combinations and target viewport checks. Strict TypeScript and Vite production build
pass; backend regression suite remains 118 passed with no backend changes. Independent review found no
blocking defects; its optional comparison-timeline keyboard issue was corrected. Screenshots, frontend
architecture, demo instructions and launch commands are recorded in docs/frontend.md and README.md.
