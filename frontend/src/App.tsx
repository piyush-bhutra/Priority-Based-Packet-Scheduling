import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { getHealth, getScenarios, simulate } from "./api";
import {
  LABELS,
  POLICIES,
  type DraftPacket,
  type Policy,
  type Results,
  type Scenario,
} from "./types";
import { toDraft, toPackets, validateDraft } from "./workload";
import { usePlayback } from "./usePlayback";
import { PacketEditor } from "./components/PacketEditor";
import { Simulator } from "./components/Simulator";
import { Metrics } from "./components/Metrics";
import { Comparison } from "./components/Comparison";
import { Guide } from "./components/Guide";

type Tab = "simulator" | "compare" | "guide";
export default function App() {
  const [tab, setTab] = useState<Tab>("simulator");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioId, setScenarioId] = useState("");
  const [packets, setPackets] = useState<DraftPacket[]>([]);
  const [interval, setInterval] = useState("5");
  const [policy, setPolicy] = useState<Policy>("fcfs");
  const [results, setResults] = useState<Results | null>(null);
  const [modified, setModified] = useState(false);
  const [busy, setBusy] = useState(true);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const result = results?.[policy];
  const playback = usePlayback(result);
  const errors = validateDraft(packets, interval);
  const valid = Object.keys(errors).length === 0;

  const initialize = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    try {
      const [health, data] = await Promise.all([
        getHealth(request.signal),
        getScenarios(request.signal),
      ]);
      if (!data.scenarios.length)
        throw new Error("No scenarios returned by the simulation service.");
      setOnline(health.status === "ok");
      const first = data.scenarios[0];
      setScenarios(data.scenarios);
      setScenarioId(first.id);
      setPackets(toDraft(first.packets));
      setInterval(String(first.aging_interval));
      setModified(false);
      const response = await simulate(
        first.packets,
        first.aging_interval,
        request.signal,
      );
      setResults(response.results);
      setSelected(first.packets[0]?.id ?? null);
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to load the lab.",
        );
        setOnline(false);
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    void initialize();
    return () => controller.current?.abort();
  }, [initialize]);
  const invalidate = () => {
    playback.reset();
    setResults(null);
    setSelected(null);
    setError("");
  };
  const loadScenario = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario || busy) return;
    invalidate();
    setScenarioId(id);
    setPackets(toDraft(scenario.packets));
    setInterval(String(scenario.aging_interval));
    setModified(false);
    setTab("simulator");
  };
  const edit = (next: DraftPacket[]) => {
    invalidate();
    setPackets(next);
    setModified(true);
  };
  const run = async () => {
    if (!valid || busy) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    playback.reset();
    setResults(null);
    try {
      const response = await simulate(
        toPackets(packets),
        Number(interval),
        request.signal,
      );
      setResults(response.results);
      setSelected(packets[0]?.id ?? null);
      setOnline(true);
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(
          failure instanceof Error ? failure.message : "Simulation failed.",
        );
        setOnline(false);
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  };
  const navigate = (next: Tab) => {
    if (playback.playing) playback.toggle();
    setTab(next);
  };
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to laboratory
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          <span>
            PACKET<span className="brand-light"> / LAB</span>
          </span>
        </div>
        <nav aria-label="Workspace">
          {(
            [
              { id: "simulator", label: "Simulator", Icon: Activity },
              {
                id: "compare",
                label: "Compare policies",
                Icon: ChartNoAxesCombined,
              },
              { id: "guide", label: "Lab notes", Icon: BookOpen },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={15} />
              {label}
              {id === "compare" && <span className="nav-count">03</span>}
            </button>
          ))}
        </nav>
        <div className="service-status">
          <span className={`status-dot ${online ? "live" : ""}`} />
          {busy ? "Computing…" : online ? "Engine connected" : "Engine offline"}
          <span className="local-badge">LOCAL</span>
        </div>
      </header>
      <main id="main">
        <div className="page-intro">
          <div>
            <div className="eyebrow">NETWORK SYSTEMS / EXPERIMENT 01</div>
            <h1>
              Priority-Based Packet Scheduling<span> in Computer Networks</span>
            </h1>
            <p>
              One shared link. Three scheduling policies. See where the delay
              goes.
            </p>
          </div>
          <div className="course-label">
            BITE305L<span>Computer Networks</span>
            <small>VIT Vellore</small>
          </div>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            <TriangleAlert size={18} />
            <div>
              <strong>The experiment couldn’t run.</strong>
              <p>{error}</p>
            </div>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void (scenarios.length ? run() : initialize())}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}
        {tab === "simulator" && (
          <div className="lab-layout">
            <PacketEditor
              scenarios={scenarios}
              scenarioId={scenarioId}
              packets={packets}
              modified={modified}
              busy={busy || !scenarios.length}
              errors={busy || !scenarios.length ? {} : errors}
              onScenario={loadScenario}
              onChange={edit}
            />
            <div className="lab-main">
              <section className="policy-bar panel">
                <div className="policy-choice">
                  <span className="field-label">Scheduling policy</span>
                  <div
                    className="segmented"
                    role="group"
                    aria-label="Scheduling policy"
                  >
                    {POLICIES.map((p) => (
                      <button
                        key={p}
                        aria-pressed={policy === p}
                        className={policy === p ? "active" : ""}
                        onClick={() => {
                          playback.reset();
                          setPolicy(p);
                        }}
                      >
                        {LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="interval-field">
                  <span className="field-label">
                    Aging interval <span>ms</span>
                  </span>
                  <input
                    aria-label="Aging interval"
                    inputMode="decimal"
                    value={interval}
                    disabled={busy}
                    aria-invalid={!!errors.aging_interval}
                    title={errors.aging_interval}
                    onChange={(e) => {
                      invalidate();
                      setInterval(e.target.value);
                      setModified(true);
                    }}
                  />
                </label>
                <button
                  className="primary run-button"
                  disabled={busy || !valid}
                  onClick={() => void run()}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <FlaskConical size={16} />
                  )}
                  {busy ? "Calculating" : "Run experiment"}
                  <ArrowUpRight size={14} />
                </button>
                <div className="policy-caption">
                  {policy === "fcfs"
                    ? "First come, first served. Original input order breaks arrival ties."
                    : policy === "priority"
                      ? "Highest priority first. Equal priorities use arrival time, then input order."
                      : "Waiting improves effective priority at selection. No active transmission is interrupted."}
                  <span>
                    {errors.aging_interval ??
                      (results
                        ? "All three policies ready to compare"
                        : "Run to calculate all three policies")}
                  </span>
                </div>
              </section>
              <Simulator
                result={result}
                playback={playback}
                selected={selected}
                onSelect={setSelected}
              />
              <Metrics result={result} />
            </div>
          </div>
        )}
        {tab === "compare" && (
          <Comparison
            results={results}
            onReplay={(p) => {
              playback.reset();
              setPolicy(p);
              setTab("simulator");
            }}
          />
        )}
        {tab === "guide" && <Guide onScenario={loadScenario} />}
      </main>
      <footer>
        <span>
          <span className="brand-mini">P/L</span> A discrete-event scheduling
          laboratory
        </span>
        <span>Simulated time · Single output link · Non-preemptive</span>
        <span>BITE305L / VIT Vellore</span>
      </footer>
    </div>
  );
}
