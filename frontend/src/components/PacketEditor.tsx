import { Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  PRIORITIES,
  TRAFFIC,
  type DraftPacket,
  type Priority,
  type Scenario,
} from "../types";

interface Props {
  scenarios: Scenario[];
  scenarioId: string;
  packets: DraftPacket[];
  modified: boolean;
  busy: boolean;
  errors: Record<string, string>;
  onScenario: (id: string) => void;
  onChange: (packets: DraftPacket[]) => void;
}
export function PacketEditor({
  scenarios,
  scenarioId,
  packets,
  modified,
  busy,
  errors,
  onScenario,
  onChange,
}: Props) {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  const change = (index: number, patch: Partial<DraftPacket>) =>
    onChange(packets.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const add = () => {
    let next = packets.length + 1;
    while (packets.some((p) => p.id === `P${next}`)) next++;
    onChange([
      ...packets,
      {
        key: crypto.randomUUID(),
        id: `P${next}`,
        traffic_type: "Custom",
        priority: 2,
        arrival_time: "0",
        duration: "1",
      },
    ]);
  };
  return (
    <aside className="workload panel">
      <div className="section-heading">
        <span className="eyebrow">01 / WORKLOAD</span>
        <span className="mono muted">
          {packets.length.toString().padStart(2, "0")} packets
        </span>
      </div>
      <fieldset disabled={busy}>
        <label className="field-label" htmlFor="scenario">
          Experiment scenario
        </label>
        <select
          id="scenario"
          value={scenarioId}
          onChange={(e) => onScenario(e.target.value)}
        >
          {!scenarios.length && <option value="">Loading scenarios…</option>}
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="scenario-description">
          {scenario?.description ??
            "Connect to the backend to load the five laboratory workloads."}
        </p>
        <div className="editor-meta">
          <span className={modified ? "modified" : "muted"}>
            {modified ? "Edited workload" : "Predefined workload"}
          </span>
          <button
            className="text-button"
            onClick={() => onScenario(scenarioId)}
            disabled={!scenario || !modified}
          >
            <RotateCcw size={12} /> Restore
          </button>
        </div>
        <div className="packet-editor-scroll">
          <table className="editor-table">
            <thead>
              <tr>
                <th>Packet / traffic</th>
                <th>Priority</th>
                <th>
                  Arrival<span>ms</span>
                </th>
                <th>
                  Transmit<span>ms</span>
                </th>
                <th>
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {packets.map((packet, index) => (
                <tr key={packet.key} data-testid="packet-editor-row">
                  <td>
                    <input
                      aria-label={`Packet ${index + 1} ID`}
                      className="id-input"
                      value={packet.id}
                      maxLength={128}
                      aria-invalid={!!errors[`${index}.id`]}
                      title={errors[`${index}.id`]}
                      onChange={(e) => change(index, { id: e.target.value })}
                    />
                    <select
                      aria-label={`Packet ${index + 1} traffic type`}
                      className="traffic-select"
                      value={packet.traffic_type}
                      onChange={(e) =>
                        change(index, { traffic_type: e.target.value })
                      }
                    >
                      {TRAFFIC.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`priority-input p${packet.priority}`}
                      aria-label={`Packet ${index + 1} priority`}
                      value={packet.priority}
                      onChange={(e) =>
                        change(index, {
                          priority: Number(e.target.value) as Priority,
                        })
                      }
                    >
                      {([1, 2, 3] as Priority[]).map((p) => (
                        <option key={p} value={p} title={PRIORITIES[p]}>
                          P{p}
                        </option>
                      ))}
                    </select>
                  </td>
                  {(["arrival_time", "duration"] as const).map((field) => (
                    <td key={field}>
                      <input
                        inputMode="decimal"
                        aria-label={`Packet ${index + 1} ${field === "arrival_time" ? "arrival" : "duration"}`}
                        value={packet[field]}
                        aria-invalid={!!errors[`${index}.${field}`]}
                        title={errors[`${index}.${field}`]}
                        onChange={(e) =>
                          change(index, { [field]: e.target.value })
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="icon-button remove"
                      aria-label={`Remove packet ${index + 1}`}
                      onClick={() =>
                        onChange(packets.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Object.entries(errors).filter(([key]) => key !== "aging_interval")
          .length > 0 && (
          <div className="field-errors" role="alert">
            {Object.entries(errors)
              .filter(([key]) => key !== "aging_interval")
              .slice(0, 3)
              .map(([key, value]) => (
                <p key={key}>
                  {key === "packets"
                    ? ""
                    : `Row ${Number(key.split(".")[0]) + 1}: `}
                  {value}
                </p>
              ))}
          </div>
        )}
        <button
          className="add-packet"
          onClick={add}
          disabled={packets.length >= 500}
        >
          <Plus size={15} /> Add packet{" "}
          <span className="mono">{packets.length}/500</span>
        </button>
      </fieldset>
      <div className="legend">
        <span>
          <i className="dot p1" />1 High
        </span>
        <span>
          <i className="dot p2" />2 Medium
        </span>
        <span>
          <i className="dot p3" />3 Low
        </span>
      </div>
      <div className="editor-note">
        <span className="eyebrow">ONE LINK. THREE POLICIES.</span>
        <p>
          Keep the workload fixed. Change who goes first. Observe who waits.
        </p>
        <span className="muted">
          Arrival and transmission times are in simulated milliseconds.
        </span>
      </div>
    </aside>
  );
}
