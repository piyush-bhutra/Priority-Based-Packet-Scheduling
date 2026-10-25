# Backend MVP implementation plan

Goal: implement PRD milestones 1–3 in the new local repository; Phase 4 requires explicit authorization.
Spec: ../PRD.md (approved requirements).
Stack: Python 3.11+, Flask, pytest; all dependencies and execution use .venv.

## Architecture and decisions

Use immutable validated Packet values, three separate policy selectors, a shared discrete-event engine,
separate metrics, scenario fixtures, and a thin Flask app factory. A separate engine per algorithm
would duplicate timing/event logic; a general simulation framework would exceed this project's scope.
Select the small shared engine with independent policy functions.

Use Decimal arithmetic from decimal input representations; accept at most six fractional decimal places,
times <= 1,000,000 ms, 1–500 packets, and positive duration/aging interval. Return JSON numbers.
Empty workloads return 400 explicitly. Derive input_index from list order; if supplied it must match.
At equal timestamps: completion, arrivals in input order, selection/start. Queue length excludes active packet.
Arrival events increment queue; start events decrement it. Record idle intervals from t=0.
Respond with {results: {algorithm: result}} for both single and multiple policies.
Algorithms: fcfs, priority, aging. Default aging interval: 5 ms.

## Tasks and verification

- [x] Validation: tests first for immutable models, IDs, priorities, bounds, malformed data and workload limits;
  implement backend/models.py and validation.py. Interface validate_workload(raw) -> tuple[Packet, ...].
- [x] Engine: tests first with hand-calculated schedules, ties, non-preemption, fractional aging boundaries,
  idle intervals, metrics, queue replay, conservation and determinism. Implement backend/scheduling/
  selectors, engine.simulate(packets, algorithm, aging_interval=5), metrics.calculate(schedule, idle).
- [x] Scenarios/API: tests first for five literal expected schedules, beneficial tradeoffs, errors and
  comparison independence. Implement scenarios.get_scenarios() and app.create_app().
- [x] Verify entire pytest suite, live Flask HTTP endpoints, all scenario/algorithm combinations and manual
  calculation. Document exact observed results, limitations and frontend contract; create local checkpoint.

Review focus: boolean numeric inputs, sub-microsecond values, arrival exactly at completion, late first
arrival in throughput denominator, mutable returned scenario data. Pin each to automated tests.

Ruling: implement directly in requested new repository without branches/worktrees; the user explicitly
requests this directory and avoidance of unnecessary branching. Original PRD remains unchanged.
Ruling: user authorizes routine design decisions and continuous backend completion; no extra design gate.

## Execution record

Validation tests initially failed 36 cases against unimplemented validation, then passed all 36.
Engine tests initially failed 33 cases against the unimplemented engine, then the full 69 passed.
Scenario/API first run reported 18 failed and 26 setup errors against unimplemented modules;
after implementation the full 113 passed. Independent review reproduced raw numeric token rounding,
decoder recursion and ambient Decimal context defects. Five additional regression cases initially
reported 4 failed/1 passed; the fixes produced 118 passed/0 failed. Follow-up review found no residual
material issues. Live verification matched all 15 scenario/policy schedules and an independent manual
calculation. Recreated environment from requirements.lock also passed all 118 tests.

Ruling: use uv to install solely into .venv because bundled Python's ensurepip bootstrap fails.
Keep the uv cache inside the project to avoid sandbox cache-write restrictions.
Ruling: elevated execution was used for dependency downloads and the loopback verifier after observed
DNS/socket sandbox failures. No external service, remote repository or deployment was configured.
