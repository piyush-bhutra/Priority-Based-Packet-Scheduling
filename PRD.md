# Product Requirements Document (PRD)

# Priority-Based Packet Scheduling in Computer Networks

**Course:** BITE305L — Computer Networks  
**Institution:** Vellore Institute of Technology  
**Project Type:** Interactive Network Packet Scheduling Simulator  
**Version:** 1.0  
**Status:** Approved for development  
**Development Environment:** Windows, local Codex workspace

---

## 1. Executive Summary

The project is an interactive, locally hosted web application that simulates how a router schedules packets waiting for transmission on a shared output link.

The system compares three scheduling approaches:

1. First-Come-First-Served (FCFS)
2. Non-Preemptive Priority Scheduling
3. Non-Preemptive Priority Scheduling with Aging

Users can provide packet workloads, select algorithms, execute simulations, observe packet transmission order, and compare their performance using quantitative metrics and graphical visualizations.

The simulation engine must calculate results independently of the user interface. All schedules, animations and metrics must originate from the same validated simulation output.

The project is an educational discrete-event simulator, not a real packet sniffer, physical router, or network emulator.

## 2. Problem Statement

Network routers handle packets from different applications that have different communication requirements.

For example:

- Video calls and gaming require low delay.
- Web browsing requires reasonable responsiveness.
- Email and file downloads can generally tolerate higher delay.

When packets arrive faster than a router's output link can transmit them, packets must wait in a queue.

FCFS processes packets in arrival order without considering their urgency.

Priority Scheduling gives preferential service to higher-priority waiting packets but can significantly delay low-priority packets under sustained high-priority traffic.

Aging attempts to reduce excessive waiting by gradually improving a packet's effective priority.

**Problem:** Design and implement an interactive simulator that demonstrates these scheduling behaviours and compares their effects on packet waiting time, turnaround time, response time, throughput, link utilization and priority-class performance.

## 3. Objectives

The project must:

1. Model packets arriving at a single router output queue.
2. Implement FCFS scheduling.
3. Implement non-preemptive Priority Scheduling.
4. Implement Priority Scheduling with configurable Aging.
5. Support manually entered and predefined packet workloads.
6. Calculate the execution schedule deterministically.
7. Generate a detailed timeline of packet arrivals, waiting, transmission and completion.
8. Calculate accurate per-packet and aggregate performance metrics.
9. Compare algorithms using identical inputs.
10. Visualize scheduling decisions in an interactive web application.
11. Demonstrate the benefits and limitations of prioritizing network traffic.
12. Validate implementation correctness through automated tests.

## 4. Scope

### 4.1 Included

- Single-router, single-output-link simulation
- One non-preemptive transmission at a time
- Three scheduling algorithms
- Three priority levels
- User-configurable packets
- Configurable aging interval
- Deterministic scheduling
- Predefined workloads
- Event timeline
- Simulation playback
- Comparative performance analysis
- Gantt charts and statistics
- Automated backend testing
- Local execution through a web browser

### 4.2 Excluded

- Physical router configuration
- Cisco Packet Tracer integration
- Real packet transmission or capture
- Multi-router routing protocols
- Machine-learning scheduling
- Real QoS hardware implementation
- Cloud hosting
- Authentication or user accounts
- Database storage
- Network congestion-control protocols
- Real-world bandwidth or latency measurements

These exclusions keep the project focused on packet-scheduling concepts relevant to Computer Networks.

## 5. Packet Model

Each simulated packet must contain:

| Property | Type | Description |
|---|---|---|
| id | String | Unique packet identifier |
| traffic_type | String | Video Call, Gaming, Web, Email, File Download or Custom |
| priority | Integer | 1 = High, 2 = Medium, 3 = Low |
| arrival_time | Number | Time the packet enters the system, in ms |
| duration | Number | Time needed to transmit the packet, in ms |
| input_index | Integer | Original input position for deterministic tie-breaking |

### Validation Requirements

- Packet IDs must be unique and non-empty.
- Arrival time must be finite and non-negative.
- Transmission duration must be finite and strictly positive.
- Priority must be 1, 2 or 3.
- Inputs must have reasonable numeric and collection-size limits.
- Invalid requests must return clear, actionable error messages.
- Input validation must reject NaN, infinity and malformed numeric values.
- The original packet definitions must not be modified by a simulation.

Traffic-type presets may suggest a priority, but users must be able to override the suggestion.

## 6. Simulation Model

### 6.1 Single Output Link

The router has one output link.

Only one packet may transmit at a time.

A packet cannot begin transmission before its arrival time.

Once transmission begins, it runs to completion without preemption.

### 6.2 Simulation Clock

The backend uses deterministic virtual time.

Simulation time advances between meaningful events such as:

- Packet arrival
- Output link becoming idle
- Packet selection
- Transmission start
- Transmission completion

The backend must not use real waiting or sleep functions to calculate the schedule.

### 6.3 Idle Periods

If the output link becomes available and no packets have arrived, the router remains idle until the next arrival.

Idle intervals must be recorded.

### 6.4 Determinism

The same input data and configuration must produce the same schedule and metrics.

Floating-point handling must be documented and consistent.

## 7. Scheduling Algorithms

### 7.1 FCFS

FCFS selects the waiting packet with the earliest arrival time.

When two packets have identical arrival times, their original input order determines transmission order.

Priority values have no effect.

### 7.2 Non-Preemptive Priority Scheduling

At each decision point:

1. Identify packets that have arrived and are waiting.
2. Select the packet with the highest priority (smallest priority number).
3. For equal priorities, select the earliest arrival.
4. For identical arrivals, select the earliest input index.
5. Transmit the selected packet to completion.

Packets arriving during a transmission must wait until that transmission finishes.

### 7.3 Priority Scheduling with Aging

Aging must reduce the risk of prolonged waiting for lower-priority packets.

For a waiting packet p at scheduling time t:

`effective_priority = max(1, original_priority - floor((t - arrival_time) / aging_interval))`

Where:

- Priority 1 is the highest.
- The aging interval is a configurable positive number in simulated milliseconds.
- A packet cannot improve beyond priority 1.
- Aging is evaluated only when selecting the next packet.
- Effective priority is recalculated for waiting packets at each selection point.
- Equal effective priorities are resolved by original arrival time and input order.
- Active transmissions are never interrupted.

Aging must not permanently modify the packet's original priority.

Default aging interval: **5 ms**.

The application must explain that aging reduces starvation risk but does not guarantee bounded waiting in all possible traffic patterns.

## 8. Scheduling Output

Each simulation must return an ordered schedule with:

- Packet ID
- Traffic class
- Original priority
- Effective priority at selection
- Arrival time
- Transmission duration
- Start time
- Completion time
- Waiting time
- Turnaround time
- Response time
- Scheduling position

It must also return:

- Idle intervals
- Timestamped simulation events
- Queue occupancy changes
- Aggregate metrics
- Per-priority-class metrics

Events and metrics must be internally consistent.

## 9. Performance Metrics

### 9.1 Per-Packet Metrics

**Waiting Time**

`waiting = start_time - arrival_time`

**Completion Time**

`completion = start_time + duration`

**Turnaround Time**

`turnaround = completion - arrival_time`

**Response Time**

`response = first_transmission_start - arrival_time`

Under the non-preemptive model, response time equals waiting time.

### 9.2 Aggregate Metrics

Calculate:

- Average waiting time
- Average turnaround time
- Average response time
- Maximum waiting time
- Total simulation duration (makespan)
- Throughput
- Link utilization
- Idle time
- Number of completed packets
- Per-priority average waiting time
- Per-priority maximum waiting time
- Per-priority completion count

Throughput is completed packet count divided by the simulation interval from t = 0 to the final completion.

Link utilization is total busy time divided by that same interval.

Zero-duration or empty-result edge cases must be handled explicitly.

### 9.3 Queue Occupancy

Record how many packets are waiting over time.

Exclude the packet currently transmitting from the waiting-queue count.

Ensure that simultaneous events have a deterministic processing order.

### 9.4 Interpretation

The application must not assume that Priority Scheduling improves throughput.

For identical workloads with the same link transmission requirements, work-conserving scheduling policies may have identical makespan and utilization while distributing delay differently.

The simulator must report the actual computed results instead of hard-coded conclusions.

## 10. Experimental Scenarios

Provide at least these predefined scenarios.

### Scenario A — Balanced Mixed Traffic

Packets with different arrival times, priorities and durations.

Purpose: Demonstrate basic FCFS and Priority differences.

### Scenario B — High-Priority Burst

Several high-priority packets arrive while lower-priority packets are waiting.

Purpose: Demonstrate preferential treatment of urgent traffic.

### Scenario C — Aging Benefit

A workload intentionally constructed so that one or more lower-priority packets receive earlier service under Aging than under Strict Priority.

Purpose: Demonstrate improved service opportunities for long-waiting packets.

### Scenario D — Idle Link

Packets arrive after an initial idle period.

Purpose: Verify that no packet transmits before arrival.

### Scenario E — Equal Arrival and Priority

Packets share arrival times and priorities.

Purpose: Verify deterministic tie-breaking.

The scenarios must be verified against expected results.

## 11. Backend Architecture

### 11.1 Technology

- Python 3.11+
- Flask
- pytest

### 11.2 Recommended Structure

```text
Packet-Scheduling/
├── PRD.md
├── README.md
├── PROJECT_STATE.md
├── .gitignore
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── models.py
│   ├── validation.py
│   ├── scenarios.py
│   └── scheduling/
│       ├── __init__.py
│       ├── engine.py
│       ├── fcfs.py
│       ├── priority.py
│       ├── aging.py
│       └── metrics.py
├── tests/
│   ├── test_fcfs.py
│   ├── test_priority.py
│   ├── test_aging.py
│   ├── test_metrics.py
│   ├── test_scenarios.py
│   └── test_api.py
├── frontend/
└── docs/
```

Modules may be reorganized when justified, but separation between scheduling logic, validation, metrics and API must be maintained.

### 11.3 API

**GET /api/health**

Returns service availability and basic version information.

**GET /api/scenarios**

Returns the predefined scenarios and their packet definitions.

**POST /api/simulate**

Accepts a packet workload and scheduling configuration.

Returns calculated schedules, events and metrics.

Support running one or multiple policies on the same workload.

The API must provide clear validation errors and must not silently alter invalid input.

## 12. Testing Requirements

Use pytest.

Required tests:

1. FCFS arrival ordering.
2. FCFS tie handling.
3. Priority selection.
4. Priority tie handling.
5. Non-preemption when urgent packets arrive during transmission.
6. Aging changes effective priority correctly.
7. Aging improves service in the intended demonstration scenario.
8. Idle intervals are handled.
9. No packet begins before arrival.
10. No packet transmits twice.
11. No transmissions overlap.
12. Completion and turnaround calculations are correct.
13. Queue events are consistent.
14. Throughput calculations are correct.
15. Utilization calculations are correct.
16. Identical workloads produce identical outputs.
17. Invalid packet identifiers are rejected.
18. Invalid priorities are rejected.
19. Invalid numeric values are rejected.
20. Empty workloads are handled explicitly.
21. API endpoints return correct responses.
22. Multiple algorithm results remain independent.

At least 20 meaningful automated tests are expected for the backend MVP.

The test count is a development target, not evidence of completion until the tests have actually been executed.

## 13. Frontend Requirements

The frontend will be implemented after backend verification.

### Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts or lightweight SVG visualizations

### Visual Direction

Create an original, professional network-analysis dashboard.

Prefer a restrained dark interface with strong readability, carefully selected accent colours and smooth but purposeful animations.

Avoid copying the reference project's layout or source code.

### Required Areas

**Packet Configuration**

- Editable packet table
- Add and remove packets
- Traffic-type presets
- Priority selection
- Arrival and duration inputs
- Scenario loading
- Input validation feedback

**Simulation Workspace**

- Waiting packet queue
- Router output link
- Current transmitting packet
- Completed packet list
- Simulation clock
- Start, Pause, Resume and Reset
- Playback speed control
- Selected algorithm
- Aging interval configuration

**Results Dashboard**

- Packet execution order
- Gantt chart
- Waiting-time comparison
- Turnaround-time comparison
- Per-priority analysis
- Utilization and throughput
- Explanatory observations

**Algorithm Comparison**

- Execute multiple policies on identical input.
- Compare result summaries.
- Show differences in transmission order.
- Clearly identify which classes benefit and which experience additional waiting.

All visualizations must be derived from backend output.

Frontend playback must not recalculate scheduling decisions.

## 14. Demonstration Requirements

The application must support this short demonstration:

1. Load a mixed-traffic scenario.
2. Run FCFS.
3. Display the transmission order and waiting times.
4. Run Strict Priority using the identical workload.
5. Explain how urgent packets move ahead of lower-priority waiting packets.
6. Enable Aging.
7. Show its effect on a lower-priority packet.
8. Compare waiting times and performance metrics.
9. Demonstrate that throughput does not automatically improve simply because packets are prioritized.

The demonstration should be understandable in approximately 3–5 minutes.

## 15. Documentation

Required project documentation:

**PRD.md** — Project requirements and acceptance criteria.

**README.md** — Setup, installation, execution and testing.

**PROJECT_STATE.md** — Current implementation status, verified results and known issues.

**docs/** — Architecture, algorithm explanations and verified experimental observations.

The final academic report will follow the professor's official BITE305L template.

The report must describe the actual implementation and observed outputs rather than adopting the reference project's numerical results.

## 16. Git Workflow

Initialize a new local Git repository inside the Packet-Scheduling project directory.

Requirements:

- Do not initialize Git in the parent CN Project directory.
- Preserve any existing projects and files.
- Use a `.gitignore` for virtual environments, caches, generated files and dependencies.
- Make checkpoint commits after verified milestones.
- Check Git status before modifying existing files.
- Never push to a remote without explicit authorization.
- Do not merge or delete branches automatically.
- Use the user's existing local Git identity if configured; do not invent one.
- Do not add AI co-author attribution to commits.

Suggested checkpoints:

1. Project initialization
2. Verified scheduling engine
3. Working API and test suite
4. Functional frontend
5. Final integration

## 17. Development Milestones

### Milestone 1 — Initialization

- Workspace inspection
- Local Git repository
- PRD and documentation
- Python environment
- Backend scaffolding

### Milestone 2 — Scheduling Engine

- Packet model
- Validation
- FCFS
- Priority
- Aging
- Event timeline
- Metrics

### Milestone 3 — Backend Verification

- Predefined scenarios
- Flask endpoints
- Automated tests
- Example simulation reports
- Correctness review

### Milestone 4 — Frontend

- Original interface
- Packet editor
- Simulation playback
- Charts
- Comparison dashboard

### Milestone 5 — Integration

- Connect frontend to API
- Validate all workflows
- Fix bugs
- Final demonstration scenarios
- Documentation and checkpoint

## 18. Acceptance Criteria

The project is ready for presentation when:

- All three algorithms work correctly.
- Every accepted packet appears exactly once in its schedule.
- Events and metrics are internally consistent.
- Aging produces the intended difference in a verified test case.
- Predefined scenarios load correctly.
- Invalid inputs produce clear errors.
- Backend automated tests pass.
- The frontend uses actual backend results.
- Animations agree with calculated schedules.
- Gantt charts and statistics show correct values.
- The project runs locally without cloud dependencies.
- The live demo completes without runtime errors.
- README instructions have been tested.

**Development principle: Correct simulation first, reliable integration second, visual polish third.**
