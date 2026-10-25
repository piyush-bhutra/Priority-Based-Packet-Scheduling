import { describe, expect, it } from "vitest";
import { replay } from "./playback";
import type { SimulationEvent } from "./types";

const events: SimulationEvent[] = [
  { sequence: 0, type: "arrival", time: 0, packet_id: "A", queue_length: 1 },
  {
    sequence: 1,
    type: "selection",
    time: 0,
    packet_id: "A",
    queue_length: 1,
    effective_priority: 3,
  },
  {
    sequence: 2,
    type: "transmission_start",
    time: 0,
    packet_id: "A",
    queue_length: 0,
  },
  { sequence: 3, type: "arrival", time: 1, packet_id: "B", queue_length: 1 },
  { sequence: 4, type: "completion", time: 2, packet_id: "A", queue_length: 1 },
  { sequence: 5, type: "arrival", time: 2, packet_id: "C", queue_length: 2 },
  {
    sequence: 6,
    type: "selection",
    time: 2,
    packet_id: "C",
    queue_length: 2,
    effective_priority: 1,
  },
  {
    sequence: 7,
    type: "transmission_start",
    time: 2,
    packet_id: "C",
    queue_length: 1,
  },
  { sequence: 8, type: "completion", time: 3, packet_id: "C", queue_length: 1 },
];
describe("backend event playback", () => {
  it("reset shows no processed events, even arrivals at zero", () => {
    expect(replay(events, 0, -1)).toMatchObject({
      waiting: [],
      completed: [],
      active: null,
      last: null,
    });
  });
  it("excludes the active packet from the waiting queue", () => {
    expect(replay(events, 1.5)).toMatchObject({
      waiting: ["B"],
      active: "A",
      completed: [],
    });
  });
  it("uses sequence to expose selection before same-time transmission", () => {
    expect(replay([...events].reverse(), 2, 6)).toMatchObject({
      waiting: ["B", "C"],
      active: null,
      selected: "C",
      completed: ["A"],
    });
  });
  it("applies all events at a sought timestamp in sequence order", () => {
    expect(replay(events, 2)).toMatchObject({
      waiting: ["B"],
      active: "C",
      selected: null,
      completed: ["A"],
    });
  });
  it("backwards seeking reconstructs state without future events", () => {
    replay(events, 3);
    expect(replay(events, 0.5)).toMatchObject({
      waiting: [],
      active: "A",
      completed: [],
    });
  });
  it("does not mutate backend events", () => {
    const before = JSON.stringify(events);
    replay(events, 3);
    expect(JSON.stringify(events)).toBe(before);
  });
  it("records an idle event with no active or waiting packet", () => {
    const idle: SimulationEvent = {
      sequence: 0,
      time: 0,
      type: "idle_start",
      packet_id: null,
      queue_length: 0,
    };
    expect(replay([idle], 1)).toMatchObject({
      active: null,
      waiting: [],
      last: idle,
    });
  });
});
