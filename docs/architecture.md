# Backend architecture and simulation semantics

## Data flow and responsibilities

`Flask request -> exact JSON decoder -> validation -> immutable Packet tuple -> policy/engine -> metrics -> JSON numbers`

Packet validation and request validation are separate from the engine. All policies consume the same
original packet tuple. A frozen dataclass preserves original priority and input index. The API validates
the workload once, then invokes a fresh simulation per selected algorithm. Scenario values are rebuilt
per call; modifying a returned workload cannot change later calls.

Each policy is independently implemented in its own module. FCFS selects by `(arrival_time, input_index)`;
Priority selects by `(priority, arrival_time, input_index)`; Aging selects by `(effective_priority,
arrival_time, input_index)` with `max(1, original_priority - floor(wait / interval))`. A single shared
engine enforces arrivals, non-preemption, time progression and events. No reference project code was used.

The small shared engine avoids duplicating temporal rules. A generic simulation framework was considered
unnecessary for one link and three policies. Selection scans the waiting list: worst-case O(n²) work
and O(n) output/storage for at most 500 packets. There is no background task or persistent simulation state.

## Clock and numeric decisions

The clock jumps to the next arrival or transmission completion and never sleeps. Internal time values
use Decimal. JSON fractional numeric tokens are decoded directly to Decimal before validation so values
cannot be rounded into the permitted range by binary decoding. Integral numeric fields are strict:
priorities and input indices must be integers, not booleans or fractional numeric tokens.

Times must be finite, nonnegative, <=1,000,000 ms and exact multiples of 0.000001 ms. Duration and aging
interval must be strictly positive. Trailing decimal zeros are accepted. Validate precision by Decimal
digits/exponent rather than ambient arithmetic. The engine uses its own precision-40 context; scheduling
does not depend on the caller's Decimal precision. The minimum accepted duration ensures a positive
makespan for every valid workload.

Responses serialize integral values as JSON integers and other values as JSON numbers. Nonterminating
averages/ratios and decimal values may incur normal binary/JSON display rounding at serialization;
selection and event equality decisions are completed using Decimal first. Frontends should format
numeric values for display, rather than comparing serialized floats to reconstruct the algorithm.

## Event order and waiting queue

At a shared timestamp process:

1. Completion of the active transmission, if any.
2. All arrivals at that time, in original input order.
3. Selection of the next waiting packet.
4. Transmission start and removal from the waiting queue.

Arrivals strictly inside a transmission are emitted at their actual arrival times and join the queue.
The active packet runs to completion. Idle intervals start at t=0 or the previous completion and end at
the next arrival; zero-length idle intervals are omitted. `idle_end` precedes arrival after a gap.

Events have monotonic timestamps and contiguous zero-based sequence numbers; equal-time events remain
ordered by sequence. Each event contains the post-event waiting count. Selection does not remove the
selected packet; transmission start does. Thus the active packet never contributes to waiting occupancy.
Four packet events (arrival, selection, transmission_start, completion) exist for every accepted packet.
Waiting intervals can be read directly from each row's arrival and start times.

The queue timeline begins with `{time: 0, queue_length: 0, event_sequence: null}`. It then records
every arrival increment and start decrement, including transient same-time changes. It is an ordered
step timeline; for a single point per timestamp use the final entry at that timestamp. A queue playback
can use events for identities and the timeline for counts without running a scheduler in the UI.

## Metrics

Per packet: waiting = start − arrival; completion = start + duration; turnaround = completion − arrival;
response = waiting because execution is non-preemptive. Positions are one-based; indices are zero-based.

Makespan is measured from t=0 to final completion. Busy time is summed durations and idle time is summed
idle intervals, including initial idle time. Throughput = completed packets / makespan in packets/ms.
Link utilization = busy time / makespan as a fraction. Count, average waiting/turnaround/response and
maximum waiting are computed from the schedule. Per-priority summaries always use **original** priority;
an absent class has count 0 and null average/maximum, avoiding invented measurements.

The API explicitly rejects empty workloads (400); zero and nonfinite durations are invalid. Under these
rules neither a zero-denominator nor a zero-duration simulation result is possible.

## Boundaries and limitations

The API is local and stateless, uses a 1 MiB body limit, returns JSON validation/HTTP errors and keeps
debugging disabled. It does not enable permissive CORS. For the React milestone, prefer a Vite `/api`
proxy to this loopback server. No user accounts, database, external network calls or packet capture exist.
Duration is supplied transmission time, not calculated from packet size/bandwidth. There is no queue
capacity, packet dropping, propagation delay or real-world starvation experiment. Finite fixtures
demonstrate preferential delay and aging benefits, not universal performance guarantees.
