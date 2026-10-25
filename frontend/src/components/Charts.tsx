import type { Result, ScheduleRow } from "../types";
import { exact, fmt } from "../format";

export function Gantt({
  result,
  time,
  onSelect,
  onSeek,
  compact = false,
}: {
  result: Result;
  time?: number;
  onSelect?: (id: string) => void;
  onSeek?: (time: number) => void;
  compact?: boolean;
}) {
  const end = result.metrics.makespan;
  const interactive = Boolean(onSelect || onSeek);
  const Segment = interactive ? "button" : "div";
  return (
    <div
      className={`gantt ${compact ? "compact" : ""}`}
      aria-label={`${result.algorithm} transmission timeline`}
    >
      <div className="gantt-track">
        {result.idle_intervals.map((idle) => (
          <div
            key={idle.start_time}
            className="idle-segment"
            style={{
              left: `${(idle.start_time / end) * 100}%`,
              width: `${(idle.duration / end) * 100}%`,
            }}
            title={`Idle ${exact(idle.start_time)}–${exact(idle.end_time)} ms`}
          >
            {idle.duration / end > 0.08 && "IDLE"}
          </div>
        ))}
        {result.schedule.map((row) => (
          <Segment
            key={row.packet_id}
            role={interactive ? undefined : "img"}
            className={`gantt-segment p${row.original_priority}`}
            style={{
              left: `${(row.start_time / end) * 100}%`,
              width: `${(row.duration / end) * 100}%`,
            }}
            title={`${row.packet_id} · ${exact(row.start_time)}–${exact(row.completion_time)} ms · waiting ${exact(row.waiting_time)} ms`}
            aria-label={`${row.packet_id}: ${exact(row.start_time)} to ${exact(row.completion_time)} ms`}
            onClick={
              interactive
                ? () => {
                    onSelect?.(row.packet_id);
                    onSeek?.(row.start_time);
                  }
                : undefined
            }
          >
            {row.duration / end > 0.035 && <span>{row.packet_id}</span>}
          </Segment>
        ))}
        {time !== undefined && (
          <div className="playhead" style={{ left: `${(time / end) * 100}%` }}>
            <i />
          </div>
        )}
      </div>
      <div className="time-axis">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <span key={fraction}>
            {fmt(end * fraction)}
            {fraction === 1 && " ms"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QueueChart({ result, time }: { result: Result; time: number }) {
  const width = 800,
    height = 64,
    end = result.metrics.makespan;
  const max = Math.max(1, ...result.queue_timeline.map((p) => p.queue_length));
  let path = `M 0 ${height}`;
  for (const point of result.queue_timeline)
    path += ` H ${(point.time / end) * width} V ${height - (point.queue_length / max) * (height - 10)}`;
  path += ` H ${width}`;
  return (
    <div className="queue-chart">
      <div className="chart-label">
        <span>Waiting queue</span>
        <span className="mono">0–{max} packets</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 1}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Waiting queue occupancy over ${exact(end)} milliseconds. Maximum ${max} packets.`}
      >
        <path d={`${path} V ${height} H 0 Z`} className="queue-fill" />
        <path d={path} className="queue-line" />
        <line
          x1={(time / end) * width}
          x2={(time / end) * width}
          y1="0"
          y2={height}
          className="queue-cursor"
        />
      </svg>
    </div>
  );
}

export function PacketDetail({
  row,
  aging,
}: {
  row: ScheduleRow | undefined;
  aging: boolean;
}) {
  if (!row) return null;
  return (
    <div className="packet-detail" data-testid="packet-detail">
      <div className="detail-identity">
        <span className={`packet-tag p${row.original_priority}`}>
          {row.packet_id}
        </span>
        <div>
          <strong>{row.traffic_type}</strong>
          <span>
            Original P{row.original_priority}
            {aging
              ? ` → effective P${row.effective_priority} at selection`
              : ` · position ${row.scheduling_position}`}
          </span>
        </div>
      </div>
      <div>
        <span>Arrival</span>
        <b>
          {exact(row.arrival_time)} <small>ms</small>
        </b>
      </div>
      <div>
        <span>Start → finish</span>
        <b>
          {exact(row.start_time)} → {exact(row.completion_time)}{" "}
          <small>ms</small>
        </b>
      </div>
      <div>
        <span>Waiting</span>
        <b>
          {exact(row.waiting_time)} <small>ms</small>
        </b>
      </div>
      <div>
        <span>Turnaround</span>
        <b>
          {exact(row.turnaround_time)} <small>ms</small>
        </b>
      </div>
    </div>
  );
}
