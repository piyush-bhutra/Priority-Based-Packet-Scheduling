import { ArrowRight } from "lucide-react";
export function Guide({ onScenario }: { onScenario: (id: string) => void }) {
  return (
    <div className="guide">
      <div className="view-heading">
        <div>
          <span className="eyebrow">FIELD NOTES / BITE305L</span>
          <h2>One output link. A question of priority.</h2>
          <p>
            When several packets are ready, the scheduling policy decides which
            packet goes next.
          </p>
        </div>
        <span className="pill">3–5 minute demonstration</span>
      </div>
      <div className="guide-policies">
        {[
          [
            "01",
            "FCFS",
            "Arrival order wins.",
            "The earliest arrival is selected. Equal arrivals keep their original input order; urgency has no effect.",
          ],
          [
            "02",
            "Strict Priority",
            "Urgency wins.",
            "Priority 1 goes before 2 and 3 among waiting packets. Ties use arrival time, then input order. Lower priorities may wait longer.",
          ],
          [
            "03",
            "Priority + Aging",
            "Waiting earns priority.",
            "A waiting packet improves one priority level per aging interval, down to priority 1. Effective priority is evaluated only at the next selection.",
          ],
        ].map(([n, name, title, text]) => (
          <section className="panel" key={name}>
            <span className="eyebrow">
              {n} / {name}
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <section className="panel demo-guide">
        <div>
          <span className="eyebrow">THE DEMONSTRATION</span>
          <h3>Make the tradeoff visible.</h3>
          <p>
            Every policy is non-preemptive: once a transmission starts, it
            finishes. All charts and numbers come from the same calculated
            schedule.
          </p>
        </div>
        <ol>
          <li>
            <b>Establish the baseline.</b>
            <p>
              Load balanced traffic. Start FCFS playback, pause, and inspect the
              queue. Switch to Strict Priority and replay.
            </p>
            <button
              className="text-button"
              onClick={() => onScenario("balanced")}
            >
              Load balanced traffic <ArrowRight size={14} />
            </button>
          </li>
          <li>
            <b>Show who benefits.</b>
            <p>
              Load the high-priority burst. Open Compare policies and inspect
              mean waiting by priority class. Check whether throughput changes.
            </p>
            <button className="text-button" onClick={() => onScenario("burst")}>
              Load priority burst <ArrowRight size={14} />
            </button>
          </li>
          <li>
            <b>Give waiting packets a chance.</b>
            <p>
              Load Aging benefit. Compare L's start time under Priority and
              Aging. Inspect original and effective priority separately.
            </p>
            <button
              className="text-button"
              onClick={() => onScenario("aging-benefit")}
            >
              Load aging benefit <ArrowRight size={14} />
            </button>
          </li>
          <li>
            <b>Check the boundaries.</b>
            <p>
              Use Idle output link and Simultaneous arrivals to show idle time,
              non-preemption and deterministic tie-breaking. Next event exposes
              same-time events one by one.
            </p>
          </li>
        </ol>
      </section>
      <div className="guide-footnote">
        <strong>Model boundaries</strong>
        <p>
          An educational single-link, discrete-event simulator. No real packet
          transmission, loss, routing or bandwidth measurement. Aging reduces
          starvation risk; it does not guarantee bounded waiting for all traffic
          patterns. Response time equals waiting time in this non-preemptive
          model.
        </p>
      </div>
    </div>
  );
}
