import {
  ArrowRight,
  Check,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StepForward,
} from "lucide-react";
import { fmt, exact } from "../format";
import type { Result } from "../types";
import { usePlayback } from "../usePlayback";
import { Gantt, PacketDetail, QueueChart } from "./Charts";

type Playback = ReturnType<typeof usePlayback>;
export function Simulator({
  result,
  playback,
  selected,
  onSelect,
}: {
  result: Result | undefined;
  playback: Playback;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const {
    snapshot,
    time,
    playing,
    speed,
    setSpeed,
    seek,
    toggle,
    reset,
    step,
  } = playback;
  const rows = new Map(result?.schedule.map((r) => [r.packet_id, r]));
  const active = snapshot.active ? rows.get(snapshot.active) : undefined;
  const progress = active
    ? Math.max(0, Math.min(1, (time - active.start_time) / active.duration))
    : 0;
  const end = result?.metrics.makespan ?? 0;
  const arrived =
    snapshot.waiting.length +
    snapshot.completed.length +
    (snapshot.active ? 1 : 0);
  const eventLabel = snapshot.last
    ? snapshot.last.type.replaceAll("_", " ")
    : "Ready to start";
  const packetChip = (id: string, complete = false) => {
    const row = rows.get(id)!;
    return (
      <button
        key={id}
        className={`packet-chip p${row.original_priority} ${selected === id ? "is-selected" : ""} ${snapshot.selected === id ? "is-selecting" : ""}`}
        onClick={() => onSelect(id)}
        title={`${id} · ${row.traffic_type} · original priority ${row.original_priority}`}
      >
        <span className="mono truncate">{id}</span>
        <small>
          {complete ? <Check size={12} /> : `P${row.original_priority}`}
        </small>
      </button>
    );
  };
  return (
    <>
      <section className="simulation panel">
        <div className="simulation-heading">
          <div>
            <span className="eyebrow">02 / THE OUTPUT LINK</span>
            <h2>Every packet has to wait its turn.</h2>
          </div>
          <div className="clock">
            <span className="eyebrow">SIMULATION CLOCK</span>
            <div>
              <span data-testid="clock">{fmt(time, 3)}</span>
              <small>ms</small>
            </div>
          </div>
        </div>
        <div className="network-stage">
          <div className="stage-grid" aria-hidden="true" />
          <div className="queue-zone">
            <div className="zone-heading">
              <span>Waiting queue</span>
              <b data-testid="waiting-count">
                {snapshot.waiting.length.toString().padStart(2, "0")}
              </b>
            </div>
            <div className="queue-packets" data-testid="waiting-packets">
              {snapshot.waiting.length ? (
                snapshot.waiting.map((id) => packetChip(id))
              ) : (
                <span className="empty-queue">
                  {result ? "The queue is clear" : "Run a workload to begin"}
                </span>
              )}
            </div>
            <span className="zone-caption">
              Arrival order · excludes active packet
            </span>
            <div className="arrival-counter">
              <span className="small-ring" />
              <span>
                {result ? result.schedule.length - arrived : "—"} yet to arrive
              </span>
            </div>
          </div>
          <div className={`router-zone ${active ? "busy" : ""}`}>
            <div className="connector connector-in">
              <ArrowRight size={14} />
            </div>
            <div className="router">
              <div className="router-top">
                <span className={`led ${active ? "on" : ""}`} />
                <span>R1</span>
              </div>
              <Cpu size={34} strokeWidth={1} />
              <div className="router-ports">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="router-caption">Single router</span>
            <span className="mono router-status">
              {active
                ? "TRANSMITTING"
                : snapshot.selected
                  ? "SELECTING"
                  : "IDLE"}
            </span>
            <div className="connector connector-out">
              <ArrowRight size={14} />
            </div>
          </div>
          <div className="output-zone">
            <div className="zone-heading">
              <span>On the wire</span>
              <span className="muted">1 link</span>
            </div>
            <div
              className={`transmission ${active ? `p${active.original_priority}` : ""}`}
            >
              {active ? (
                <>
                  <div className="transmission-info">
                    <button
                      onClick={() => onSelect(active.packet_id)}
                      className="active-id"
                      data-testid="active-packet"
                    >
                      {active.packet_id}
                    </button>
                    <span>{active.traffic_type}</span>
                  </div>
                  <div className="transmission-track">
                    <div style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="transmission-footer">
                    <span>{fmt(progress * 100, 0)}%</span>
                    <span>
                      {fmt(active.completion_time - time)} ms remaining
                    </span>
                  </div>
                  {result?.algorithm === "aging" && (
                    <div className="aging-chip">
                      Original P{active.original_priority}
                      <ArrowRight size={10} />
                      Effective P{active.effective_priority}
                    </div>
                  )}
                </>
              ) : (
                <div className="link-idle">
                  <span className="idle-dashes">— — —</span>
                  <span>
                    {time >= end && result
                      ? "All packets delivered"
                      : "No active transmission"}
                  </span>
                </div>
              )}
            </div>
            <div className="delivered-heading">
              <span>Delivered</span>
              <span className="mono" data-testid="completed-count">
                {snapshot.completed.length} / {result?.schedule.length ?? "—"}
              </span>
            </div>
            <div className="delivered-packets" data-testid="completed-packets">
              {snapshot.completed.length ? (
                snapshot.completed.map((id) => packetChip(id, true))
              ) : (
                <span className="muted">Completed packets appear here</span>
              )}
            </div>
          </div>
        </div>
        <div className="event-ribbon">
          <span className={`status-dot ${playing ? "live" : ""}`} />
          <span className="event-title">{eventLabel}</span>
          <span className="mono">
            {snapshot.last
              ? `#${snapshot.last.sequence.toString().padStart(3, "0")}${snapshot.last.packet_id ? ` · ${snapshot.last.packet_id}` : ""}`
              : "—"}
          </span>
          <span className="event-note">
            Non-preemptive · active transmissions finish first
          </span>
        </div>
        <div className="transport">
          <button
            className="primary play-button"
            disabled={!result}
            onClick={toggle}
          >
            {playing ? (
              <Pause size={15} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            {playing
              ? "Pause"
              : time >= end && result
                ? "Replay"
                : snapshot.last
                  ? "Resume"
                  : "Start"}
          </button>
          <button
            className="icon-button"
            aria-label="Reset playback"
            title="Reset playback"
            disabled={!result}
            onClick={reset}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Next event"
            title="Step one event, including simultaneous events"
            disabled={
              !result || snapshot.processed.length === result.events.length
            }
            onClick={step}
          >
            <StepForward size={17} />
          </button>
          <div className="seek-control">
            <input
              type="range"
              aria-label="Simulation time"
              min={0}
              max={end || 1}
              step="any"
              value={time}
              disabled={!result}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <div>
              <span>0 ms</span>
              <span>{fmt(end)} ms</span>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label="Seek to end"
            title="Seek to end"
            disabled={!result}
            onClick={() => seek(end)}
          >
            <SkipForward size={16} />
          </button>
          <label className="speed-control">
            <select
              aria-label="Playback speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {[0.5, 1, 2, 5].map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
            <span>1× = 1 ms/s</span>
          </label>
        </div>
      </section>
      <section className="timeline-panel panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / TRANSMISSION TIMELINE</span>
            <h3>The order makes the difference.</h3>
          </div>
          <span className="muted text-xs">Click a packet to inspect</span>
        </div>
        {result ? (
          <>
            <Gantt
              result={result}
              time={time}
              onSelect={onSelect}
              onSeek={seek}
            />
            <QueueChart result={result} time={time} />
            <PacketDetail
              row={rows.get(selected ?? "")}
              aging={result.algorithm === "aging"}
            />
          </>
        ) : (
          <div className="empty-result">
            Run the experiment to see the calculated schedule, queue occupancy
            and packet timings.
          </div>
        )}
      </section>
      {result && (
        <details className="trace panel">
          <summary>
            <span>
              Event trace{" "}
              <span className="mono muted">
                {snapshot.processed.length} / {result.events.length}
              </span>
            </span>
            <span className="muted">Inspect the backend sequence</span>
          </summary>
          <div className="trace-scroll">
            <table>
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Time (ms)</th>
                  <th>Event</th>
                  <th>Packet</th>
                  <th>Waiting</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.processed.map((e) => (
                  <tr key={e.sequence}>
                    <td>#{e.sequence}</td>
                    <td>{exact(e.time)}</td>
                    <td>{e.type.replaceAll("_", " ")}</td>
                    <td>{e.packet_id ?? "—"}</td>
                    <td>{e.queue_length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!snapshot.processed.length && (
              <p className="muted">Press Start or Next event to begin.</p>
            )}
          </div>
        </details>
      )}
    </>
  );
}
