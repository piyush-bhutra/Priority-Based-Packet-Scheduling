import { ArrowRight, ArrowUpRight } from "lucide-react";
import { fmt } from "../format";
import {
  LABELS,
  POLICIES,
  PRIORITIES,
  type Policy,
  type Priority,
  type Results,
} from "../types";
import { Gantt } from "./Charts";
import { useState } from "react";

export function Comparison({
  results,
  onReplay,
}: {
  results: Results | null;
  onReplay: (policy: Policy) => void;
}) {
  const [metric, setMetric] = useState<"waiting_time" | "turnaround_time">(
    "waiting_time",
  );
  if (!results)
    return (
      <section className="panel empty-comparison">
        <h2>A fair comparison starts with one workload.</h2>
        <p>
          Run the experiment in the Simulator. All three policies will use the
          same packet definitions.
        </p>
      </section>
    );
  const { fcfs, priority, aging } = results;
  const highBase = fcfs.per_priority[1].average_waiting_time;
  const highPriority = priority.per_priority[1].average_waiting_time;
  const lowBase = fcfs.per_priority[3].average_waiting_time;
  const lowPriority = priority.per_priority[3].average_waiting_time;
  const agingBenefit = aging.schedule
    .map((row) => ({
      row,
      strict: priority.schedule.find((p) => p.packet_id === row.packet_id)!,
    }))
    .filter(
      ({ row, strict }) =>
        row.original_priority > 1 && row.start_time < strict.start_time,
    )
    .sort(
      (a, b) =>
        b.strict.start_time -
        b.row.start_time -
        (a.strict.start_time - a.row.start_time),
    )[0];
  const equalThroughput = POLICIES.every(
    (p) =>
      Math.abs(results[p].metrics.throughput - fcfs.metrics.throughput) < 1e-12,
  );
  const barMax = Math.max(
    1,
    ...POLICIES.flatMap((p) =>
      ([1, 2, 3] as Priority[]).map(
        (c) => results[p].per_priority[c].average_waiting_time ?? 0,
      ),
    ),
  );
  const packetOrder = [...fcfs.schedule].sort(
    (a, b) => a.input_index - b.input_index,
  );
  return (
    <div className="comparison-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">SAME WORKLOAD / THREE PERSPECTIVES</span>
          <h2>Who gets there sooner?</h2>
        </div>
        <span className="pill">
          {fcfs.schedule.length} identical packets · aging{" "}
          {fmt(aging.aging_interval)} ms
        </span>
      </div>
      <div className="comparison-cards">
        {POLICIES.map((p, index) => (
          <section
            className="panel comparison-card"
            key={p}
            data-testid={`comparison-${p}`}
          >
            <div className="section-heading">
              <span className="mono muted">0{index + 1}</span>
              <button className="text-button" onClick={() => onReplay(p)}>
                Replay policy <ArrowUpRight size={14} />
              </button>
            </div>
            <h3>{LABELS[p]}</h3>
            <div className="comparison-number">
              {fmt(results[p].metrics.average_waiting_time)}
              <span>ms mean waiting</span>
            </div>
            <Gantt result={results[p]} compact />
            <p className="order-label">Transmission order</p>
            <div className="order-list" data-testid={`order-${p}`}>
              {results[p].schedule.map((r, i) => (
                <span key={r.packet_id}>
                  {i > 0 && <ArrowRight size={11} />}
                  <b className={`p${r.original_priority}`} title={r.packet_id}>
                    {r.packet_id}
                  </b>
                </span>
              ))}
            </div>
            <div className="compare-small">
              <span>
                Turnaround{" "}
                <b>{fmt(results[p].metrics.average_turnaround_time)} ms</b>
              </span>
              <span>
                Throughput <b>{fmt(results[p].metrics.throughput, 3)} pkt/ms</b>
              </span>
              <span>
                Utilization{" "}
                <b>{fmt(results[p].metrics.link_utilization * 100)}%</b>
              </span>
              <span>
                Makespan <b>{fmt(results[p].metrics.makespan)} ms</b>
              </span>
            </div>
          </section>
        ))}
      </div>
      <div className="comparison-lower">
        <section className="panel class-chart">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DELAY DISTRIBUTION</span>
              <h3>Waiting, by original priority.</h3>
            </div>
            <span className="mono muted">mean / ms</span>
          </div>
          {([1, 2, 3] as Priority[]).map((c) => (
            <div className="class-bars" key={c}>
              <div className="class-name">
                <i className={`dot p${c}`} />
                {PRIORITIES[c]} priority
              </div>
              {POLICIES.map((p) => {
                const value = results[p].per_priority[c].average_waiting_time;
                return (
                  <div className="bar-row" key={p}>
                    <span>{LABELS[p]}</span>
                    <div className="bar-track">
                      <i
                        style={{ width: `${((value ?? 0) / barMax) * 100}%` }}
                      />
                    </div>
                    <b>{fmt(value)}</b>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
        <section className="panel observations">
          <span className="eyebrow">READING THE EXPERIMENT</span>
          <h3>
            Different order.
            <br />
            Different tradeoffs.
          </h3>
          <div>
            <span className="observation-index">01</span>
            <p>
              High-priority mean waiting:{" "}
              <strong>
                {fmt(highBase)}
                {highBase !== null && " ms"} <ArrowRight size={12} />{" "}
                {fmt(highPriority)}
                {highPriority !== null && " ms"}
              </strong>
              <small>
                FCFS → Strict Priority. Low-priority waiting changes from{" "}
                {fmt(lowBase)}
                {lowBase !== null && " ms"} to {fmt(lowPriority)}
                {lowPriority !== null && " ms"}.
              </small>
            </p>
          </div>
          <div>
            <span className="observation-index">02</span>
            <p>
              {agingBenefit ? (
                <>
                  <strong>
                    {agingBenefit.row.packet_id} starts{" "}
                    {fmt(
                      agingBenefit.strict.start_time -
                        agingBenefit.row.start_time,
                    )}{" "}
                    ms earlier with Aging.
                  </strong>
                  <small>
                    Start {fmt(agingBenefit.strict.start_time)} →{" "}
                    {fmt(agingBenefit.row.start_time)} ms. Original P
                    {agingBenefit.row.original_priority}, effective P
                    {agingBenefit.row.effective_priority} at selection.
                  </small>
                </>
              ) : (
                <>
                  <strong>
                    No earlier service from aging in this workload.
                  </strong>
                  <small>
                    Try the Aging benefit scenario, or change the interval and
                    rerun.
                  </small>
                </>
              )}
            </p>
          </div>
          <div>
            <span className="observation-index">03</span>
            <p>
              <strong>
                {equalThroughput
                  ? "Throughput is unchanged across policies."
                  : "Throughput differs in these results."}
              </strong>
              <small>
                {equalThroughput
                  ? `All three report ${fmt(fcfs.metrics.throughput, 3)} packets/ms. Priority changes delay distribution; it does not automatically increase capacity.`
                  : "Compare the measured throughput and makespan above."}
              </small>
            </p>
          </div>
        </section>
      </div>
      <section className="panel packet-results">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PACKET-BY-PACKET</span>
            <h3>Follow the delay.</h3>
          </div>
          <select
            aria-label="Comparison metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="waiting_time">Waiting time</option>
            <option value="turnaround_time">Turnaround time</option>
          </select>
        </div>
        <div className="result-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Packet</th>
                <th>Original priority</th>
                {POLICIES.map((p) => (
                  <th key={p}>{LABELS[p]} (ms)</th>
                ))}
                <th>Aging effective priority</th>
              </tr>
            </thead>
            <tbody>
              {packetOrder.map((row) => (
                <tr key={row.packet_id}>
                  <td>
                    <span className={`packet-tag p${row.original_priority}`}>
                      {row.packet_id}
                    </span>
                  </td>
                  <td>
                    P{row.original_priority} ·{" "}
                    {PRIORITIES[row.original_priority]}
                  </td>
                  {POLICIES.map((p) => {
                    const value = results[p].schedule.find(
                      (r) => r.packet_id === row.packet_id,
                    )![metric];
                    return (
                      <td
                        key={p}
                        className={
                          p !== "fcfs"
                            ? value < row[metric]
                              ? "better"
                              : value > row[metric]
                                ? "worse"
                                : ""
                            : ""
                        }
                      >
                        {fmt(value)}
                      </td>
                    );
                  })}
                  <td>
                    P
                    {
                      aging.schedule.find((r) => r.packet_id === row.packet_id)!
                        .effective_priority
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          Green = less delay than FCFS · amber = more delay. Effective priority
          is recorded at selection, not recalculated during playback.
        </p>
      </section>
    </div>
  );
}
