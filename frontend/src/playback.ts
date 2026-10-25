import type { SimulationEvent } from "./types";
export function replay(
  events: SimulationEvent[],
  time: number,
  sequence = Infinity,
): {
  waiting: string[];
  completed: string[];
  active: string | null;
  selected: string | null;
  last: SimulationEvent | null;
  processed: SimulationEvent[];
} {
  const waiting = new Set<string>();
  const completed: string[] = [];
  let active: string | null = null;
  let selected: string | null = null;
  const processed = [...events]
    .sort((a, b) => a.time - b.time || a.sequence - b.sequence)
    .filter((event) => event.time <= time && event.sequence <= sequence);
  for (const event of processed) {
    const id = event.packet_id;
    if (event.type === "arrival" && id !== null) waiting.add(id);
    if (event.type === "selection") selected = id;
    if (event.type === "transmission_start" && id !== null) {
      waiting.delete(id);
      active = id;
      selected = null;
    }
    if (event.type === "completion" && id !== null) {
      completed.push(id);
      active = null;
    }
  }
  return {
    waiting: [...waiting],
    completed,
    active,
    selected,
    last: processed.at(-1) ?? null,
    processed,
  };
}
