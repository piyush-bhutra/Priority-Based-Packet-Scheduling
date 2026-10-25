# Team handoff — Priority-Based Packet Scheduling in Computer Networks

**Course:** BITE305L, VIT Vellore. **Audit date:** 2026-10-25 (Asia/Calcutta).
**Purpose:** prepare the academic report from the implemented, tested system and reproducible evidence.

## Freeze and evidence status

- Backend: `6af3b3a`; frontend: `b1db69e`. Both checkpoints are preserved. Release audit found no
  implementation differences from these checkpoints. The current branch is `master`.
- This handoff, README clarification and PROJECT_STATE update are documentation work only.
- The user reports successful manual acceptance of a custom A–E workload, including interval-dependent
  aging order. Exact custom input rows were not saved in the repository; see the custom experiment note.
- Automated tests and build results below were rerun during this audit. Screenshots are from the
  previously verified frontend milestone, not newly captured custom-workload evidence.
- No remote is configured and no push was performed. Report writing may proceed from the local source;
  private source sharing is distinct from a security-clean software release (see audit findings).

## Objective and Computer Networks relevance

Model contention for a single router output link and show how packet service policy redistributes
queueing delay across traffic priorities. Video calls/gaming motivate urgent traffic; file transfer/email
illustrate delay-tolerant traffic. The scheduler chooses among packets already waiting; it does not
perform routing, TCP congestion control or real hardware QoS. This is an educational discrete-event
simulator, not measured network traffic or operating-system process execution.

## Policies

| Policy | Selection among waiting packets | Tie-breaking |
|---|---|---|
| FCFS | Earliest arrival; priority ignored | Original input order |
| Strict Priority | Lowest priority number (1 high, 2 medium, 3 low) | Arrival time, then input order |
| Priority with Aging | Lowest effective priority at selection | Arrival time, then input order |

`effective = max(1, original - floor((selection_time - arrival_time) / aging_interval))`

Default interval is 5 ms. A smaller interval promotes waiting packets faster. Aging never changes
original priority, never promotes above 1 and never interrupts the active packet. Equal effective
priority does not automatically favor originally high-priority traffic: arrival/input order decides.
All three policies are non-preemptive and work-conserving in this single-link model.

## Packet model and architecture

Packet fields: unique nonblank string `id`, `traffic_type`, integer `priority`, `arrival_time` (ms),
`duration` (ms), and derived zero-based `input_index`. Supported traffic types: Video Call, Gaming,
Web, Email, File Download, Custom. Priority can be overridden independently of traffic type.

Limits: 1–500 packets; times <=1,000,000 ms with six fractional decimal places; arrival >=0;
duration/aging interval >0. Duplicate IDs, nonfinite values and malformed inputs are rejected.

```text
React packet editor -> Vite /api proxy -> Flask JSON validation -> immutable Packet tuple
    -> independent policy selectors + shared Decimal event engine -> metrics -> JSON result
    -> React event playback, Gantt, queue chart, comparisons and packet inspection
```

Backend owns all selections, schedules, timestamps, events and calculated metrics. The same original
workload is independently simulated for each selected policy. Virtual time jumps between events;
backend calculation does not sleep. At a shared timestamp: completion, arrivals in input order,
selection, transmission start. `sequence` preserves that order. The selected packet stays waiting
until transmission_start; the active packet is excluded from waiting occupancy.

Frontend owns editing, requests, playback time and display. It replays backend events; no scheduling
policy is reimplemented in JavaScript. Edits/interval changes clear previous results. One request
calculates all three policies on identical inputs. Seeking backwards rebuilds event state; Next event
can expose separate same-time events. Original/effective priority are displayed separately.

Key source: `backend/models.py`, `validation.py`, `scheduling/`, `scenarios.py`, `app.py`;
`frontend/src/playback.ts`, `usePlayback.ts`, `components/`. API: GET `/api/health`, GET
`/api/scenarios`, POST `/api/simulate`. See [API contract](api.md) and [architecture](architecture.md).

## Metrics and units

Waiting = start − arrival; turnaround = completion − arrival; response = waiting for this
non-preemptive model. Completion = start + duration. Makespan runs from t=0 through final completion.
Throughput = completed packets / makespan (**packets/ms**, not bandwidth). Utilization = busy/makespan;
the API returns a fraction and the UI displays percent. Initial idle time is included. Priority-class
summaries use original priority; absent classes have count 0 and N/A average/maximum.

## Five predefined experiments — verified

Orders below are asserted by backend tests, the live verifier and browser integration tests.
Use default aging interval **5 ms** for this table.

| Scenario | FCFS | Strict Priority | Aging | Main observation |
|---|---|---|---|---|
| Balanced mixed traffic | A B C D E | A C E B D | A C E B D | Urgency changes service after A completes |
| High-priority burst | A B U1 U2 U3 | A U1 U2 U3 B | A U1 U2 U3 B | Urgent packets wait less; low-priority B waits longer |
| Aging benefit | A L H1 H2 H3 | A H1 H2 H3 L | A L H1 H2 H3 | L starts at 10 ms with aging versus 16 ms under strict priority |
| Idle output link | A B C | A B C | A B C | Idle [0,2) and [3,6), starts 2/6/8 ms, final completion 9 ms |
| Simultaneous arrivals/ties | L H1 H2 M1 M2 | H1 H2 M1 M2 L | H1 H2 M1 M2 L | Original input position breaks equal-arrival/priority ties |

Aggregate results (FCFS / Priority / Aging; time values in ms):

| Scenario | Mean waiting | Mean turnaround | Makespan | Throughput (packets/ms) | Utilization |
|---|---|---|---:|---:|---:|
| Balanced | 3 / 2.4 / 2.4 | 5 / 4.4 / 4.4 | 10 | 0.5 | 100% |
| Burst | 3.6 / 2.4 / 2.4 | 5.6 / 4.4 / 4.4 | 10 | 0.5 | 100% |
| Aging benefit | 8.6 / 9.2 / 8.6 | 12 / 12.6 / 12 | 17 | 5/17 ≈ 0.294118 | 100% |
| Idle | 2/3 for all | 2 for all | 9 | 1/3 | 4/9 ≈ 44.444% |
| Ties | 2.8 / 2 / 2 | 4 / 3.2 / 3.2 | 6 | 5/6 | 100% |

In the burst, high-priority mean waiting changes **5 -> 2 ms** while low-priority mean waiting changes
**1.5 -> 3 ms** from FCFS to Priority. It does not improve throughput. In the aging experiment L has
original P3 but effective P1 at t=10. These are workload-specific observations, not universal claims
that a policy is always better. Exact outputs are in [verification.json](verification.json) and
[demonstrations.md](demonstrations.md).

## Custom experiment A–E, interval 3 ms — manual evidence

**User-reported acceptance:** packets A–E produced the expected FCFS, Strict Priority and Aging results;
changing the aging interval changed execution order as expected, including the **3 ms** setting.
The user confirmed frontend integration and manual acceptance testing are complete.

**Reproducibility limitation:** this repository contains neither the custom A–E arrival/duration/priority
table nor its exact order/metric outputs. They cannot be inferred from the packet names or interval.
The predefined balanced scenario also uses A–E, but must not be substituted for the custom experiment.
Exact inputs have been requested. Do not invent a custom schedule, reuse default-5-ms results, or claim
that this audit independently reran the unspecified workload. Before citing custom numerical results
in the report, record its five input rows, policy orders, selection priorities and metric screenshots.

## Verification performed during release audit

| Check | Observed result |
|---|---|
| Backend pytest | 118 passed, 0 failed |
| Frontend Vitest | 22 passed, 0 failed |
| Edge + real Flask/Vite browser tests | 13 passed, 0 failed; all five scenarios/all three orders |
| `npx.cmd tsc --noEmit` | Exit 0 |
| `npm.cmd run build` | TypeScript + production build exit 0 |
| Browser-test server bootstrap | Both stopped servers started successfully by Playwright |
| Backend/frontend checkpoint diffs | No implementation changes |
| Tracked/history hygiene | 60 tracked files and both historical commits scanned; no known credential-pattern matches or unwanted tracked environment/build/cache paths |

The credential check is a bounded pattern/filename audit, not proof that every possible secret is absent.
The maintained screenshots, JSON experiment output and lockfiles are intentional source artifacts.

## Publication findings and boundaries

The current source/history can be shared in a **private academic repository** with these findings disclosed;
the dependency security audit is **not clean**, so do not describe the frozen implementation as security-certified.

- `.gitignore` successfully excludes `.venv`, frontend node_modules/dist, Python/uv/npm caches,
  Playwright results/reports, TypeScript build info, tool metadata and files named `.env`.
  It does **not** cover `.env.local`, other `.env.*` variants, private-key files or an environment named
  `venv`. None are tracked. Use `.venv` and never add credentials. Broader ignore patterns are a
  recommended follow-up; `.gitignore` was left unchanged to honor the documentation-only freeze.
- `npm audit` reports **3 vulnerable development packages: 2 critical, 1 moderate** in Vitest,
  tinypool and @vitest/mocker. These are package counts, not three independent advisories.
  [Tinypool worker-options advisory](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3),
  [run-options advisory](https://github.com/advisories/GHSA-85c8-ppgw-ccpr), and
  [mocker file-read advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
  The audit proposes a major Vitest upgrade; remediation was not applied or verified because dependencies
  are frozen. Do not run `npm audit fix --force` as part of report preparation.
- `npm audit --omit=dev` reports **0 known runtime dependency findings**. That does not certify the Python
  dependency tree or the entire application. Keep local demo/test servers on loopback as configured.

## Report figures and viva preparation

Recommended figures: (1) architecture/data-flow diagram above, (2) router waiting-queue/output-link
model, (3) the same packet table plus three aligned Gantt charts, (4) burst per-priority waiting chart,
(5) aging L's original/effective priority and 16->10 ms start, (6) idle timeline/utilization denominator,
(7) equal-time event trace with sequence numbers, (8) custom A–E/3-ms inputs and comparison after its
exact evidence is recorded. Caption every result with workload, policy, interval and units.

Existing UI captures: [desktop](frontend-desktop.png), [laptop](frontend-laptop.png),
[comparison](frontend-comparison.png). They illustrate the predefined Aging benefit scenario, not
the unspecified custom experiment. Create architecture/report diagrams from the implemented modules.

Viva points: queueing vs transmission vs propagation delay; priority 1 is highest; non-preemption;
deterministic tie-breaking; virtual vs wall-clock time; effective vs original priority; why aging's
interval changes promotion; throughput vs latency; why lower mean delay can hide class unfairness;
why waiting occupancy excludes the active packet; why initial idle time affects utilization;
why finite aging demonstrations do not prove bounded waiting for arbitrary traffic.

Model limits: single router/link, unbounded queue, no losses/routing/packet capture/transport protocols,
no real bandwidth or measured QoS, no persistence/authentication/cloud deployment. Desktop-first only.
UI edits/results reset on refresh. No extra algorithms or ML exist. Academic report/template work is
remaining documentation; none of these excluded features should appear as implemented.

## Team workflow and future private push

Follow [README](../README.md) for clone/setup, the two terminals and tests. Keep both implementation
checkpoints, write the report against this evidence and isolate any later implementation changes from
the freeze. Confirm unresolved custom evidence before including its numerical claims.

When the owner chooses to publish later, create an **empty private** GitHub repository without an
initial README/license/gitignore. Authenticate with Git Credential Manager/browser login; never put
tokens in a remote URL. Replace OWNER/REPOSITORY below; these commands were **not executed** by this audit:

```powershell
Set-Location 'D:\CN Project\Packet-Scheduling'
git remote add origin https://github.com/OWNER/REPOSITORY.git
git remote -v
git push -u origin master
git rev-parse HEAD
git ls-remote origin refs/heads/master
```

Confirm push exit 0 and that the two final commands report the same commit hash. `git remote -v`
alone proves configuration, not a push. Keep branch `master`; no rename/force-push is needed.
Add teammates as collaborators on the private repository. This follows
[GitHub's existing-code instructions](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
