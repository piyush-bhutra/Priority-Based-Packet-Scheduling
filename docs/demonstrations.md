# Verified scheduling demonstrations

Verification date: 2026-10-25 (Asia/Calcutta). Five workloads were run through the live Flask API with
all three policies. The exact expected orders are asserted by pytest and the live verifier.
Machine-readable observed results, starts and metrics are in `verification.json`.

| Scenario | FCFS order | Priority order | Aging order (5 ms) |
|---|---|---|---|
| Balanced | A B C D E | A C E B D | A C E B D |
| Burst | A B U1 U2 U3 | A U1 U2 U3 B | A U1 U2 U3 B |
| Aging benefit | A L H1 H2 H3 | A H1 H2 H3 L | A L H1 H2 H3 |
| Idle | A B C | A B C | A B C |
| Ties | L H1 H2 M1 M2 | H1 H2 M1 M2 L | H1 H2 M1 M2 L |

## Priority tradeoff

In the burst workload A occupies the link at t=0–4. B is low priority and arrives at t=1; U1, U2 and U3
are high priority and arrive at t=2,3,4, each needing 1 ms. B needs 3 ms.

FCFS starts B at 4 and U1/U2/U3 at 7/8/9. Strict Priority starts U1/U2/U3 at 4/5/6 and B at 7.
Urgent average waiting improves **5 -> 2 ms**; low-priority average waiting increases **1.5 -> 3 ms**.
All policies complete at 10 ms: throughput **0.5 packets/ms**, utilization **1.0**. The measured benefit
is the distribution of waiting time; throughput does not increase in this example.

## Aging benefit

A (high) transmits from 0 to 10. L (low) arrives at 0, needs 1 ms, and waits alongside high-priority
H1/H2/H3 arriving at 1/2/3, each needing 2 ms. Strict Priority serves those three before L, starting
L at **16 ms**. With interval 5, at t=10 L has effective priority `max(1, 3-floor(10/5))=1`.
Its earlier arrival wins the tie and L starts at **10 ms**, six milliseconds earlier.
L's original priority remains 3. All policies finish at 17 ms. Aging does not interrupt A.

## Idle and ties

The idle workload has intervals **[0,2)** and **[3,6)**; packet starts are **2,6,8 ms**, final completion
is **9 ms**. Busy time is 4 ms, idle time 5 ms, throughput 3/9 packets/ms, utilization 4/9.

In the ties workload all arrivals occur at t=0. Equal-priority high packets H1 and H2 retain their input
order, as do M1/M2. FCFS begins L because it appears first; Priority and Aging begin H1. Equal arrival
times do not cause duplicate transmission or overlapping service.

## Independent manual calculation

Input: A=(arrival 0, duration 4, priority 3), B=(1,2,3), C=(2,1,1).
By hand, A is the only packet at t=0 and cannot be preempted. At t=4, C outranks B; then B runs last.

| Packet | Start | Completion | Waiting | Turnaround | Response |
|---|---:|---:|---:|---:|---:|
| A | 0 | 4 | 0 | 4 | 0 |
| C | 4 | 5 | 2 | 3 | 2 |
| B | 5 | 7 | 4 | 6 | 4 |

Thus mean waiting/response = 6/3 = **2 ms**; mean turnaround = **13/3 ms**; maximum waiting = **4 ms**;
makespan = **7 ms**; busy = **7 ms**; idle = **0 ms**; throughput = **3/7 packets/ms**;
utilization = **1**. These literal expected values match both the engine test and live backend output.

For a 3–5 minute demonstration: load balanced and compare FCFS/Priority; show burst class averages;
load aging-benefit to show L's earlier start; finish with idle/tie correctness and the equal-throughput
observation. Actual visualization remains part of the authorized future frontend milestone.
