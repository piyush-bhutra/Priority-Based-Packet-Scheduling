import { fmt } from "../format";
import { PRIORITIES, type Priority, type Result } from "../types";

export function Metrics({ result }: { result: Result | undefined }) {
  const m = result?.metrics;
  const values = [
    ["Mean waiting", m?.average_waiting_time, "ms"],
    ["Mean turnaround", m?.average_turnaround_time, "ms"],
    ["Throughput", m?.throughput, "packets/ms"],
    ["Link utilization", m ? m.link_utilization * 100 : undefined, "%"],
  ] as const;
  return (
    <section className="metrics-panel panel">
      <div className="section-heading">
        <span className="eyebrow">04 / MEASURED OUTCOME</span>
        <span className="muted text-xs">Full schedule · from t = 0</span>
      </div>
      <div className="metric-grid">
        {values.map(([label, value, unit]) => (
          <div key={label} className="metric">
            <span>{label}</span>
            <div>
              <strong>{value === undefined ? "—" : fmt(value, 3)}</strong>
              <small>{unit}</small>
            </div>
          </div>
        ))}
      </div>
      {m && (
        <div className="secondary-metrics">
          <span>
            Max wait <b>{fmt(m.max_waiting_time)} ms</b>
          </span>
          <span>
            Response <b>{fmt(m.average_response_time)} ms</b>
          </span>
          <span>
            Makespan <b>{fmt(m.makespan)} ms</b>
          </span>
          <span>
            Idle <b>{fmt(m.idle_time)} ms</b>
          </span>
        </div>
      )}
      {result && (
        <div className="class-summary">
          {([1, 2, 3] as Priority[]).map((p) => (
            <div key={p}>
              <span>
                <i className={`dot p${p}`} />
                {PRIORITIES[p]} priority
              </span>
              <strong>
                {fmt(result.per_priority[p].average_waiting_time)}
                {result.per_priority[p].average_waiting_time !== null && (
                  <small> ms mean wait</small>
                )}
              </strong>
              <span className="muted">
                {result.per_priority[p].completion_count} completed · max{" "}
                {fmt(result.per_priority[p].max_waiting_time)}
                {result.per_priority[p].max_waiting_time !== null && " ms"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
