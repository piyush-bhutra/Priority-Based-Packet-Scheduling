import { describe, expect, it } from "vitest";
import { validateDraft, toPackets, toDraft } from "./workload";
import type { DraftPacket } from "./types";
const valid: DraftPacket = {
  key: "key",
  id: "A",
  traffic_type: "Custom",
  priority: 3,
  arrival_time: "0",
  duration: "1",
};
describe("packet editor validation", () => {
  it.each([
    "",
    "-1",
    "NaN",
    "Infinity",
    "1000001",
    "0.0000001",
    "1.00000000000000001",
    "1e3",
  ])("rejects invalid duration %s before number conversion", (value) => {
    expect(validateDraft([{ ...valid, duration: value }], "5")).not.toEqual({});
  });
  it("rejects zero duration and aging, but accepts zero arrival", () => {
    expect(validateDraft([valid], "5")).toEqual({});
    expect(validateDraft([{ ...valid, duration: "0" }], "0")).toHaveProperty(
      "aging_interval",
    );
  });
  it("rejects duplicate and blank IDs", () => {
    expect(validateDraft([valid, { ...valid, key: "b" }], "5")).toHaveProperty(
      "1.id",
    );
    expect(validateDraft([{ ...valid, id: " " }], "5")).toHaveProperty("0.id");
  });
  it("rejects an empty workload and >500 packets", () => {
    expect(validateDraft([], "5")).toHaveProperty("packets");
    expect(
      validateDraft(
        Array.from({ length: 501 }, (_, i) => ({ ...valid, id: `${i}` })),
        "5",
      ),
    ).toHaveProperty("packets");
  });
  it("preserves original packet order and removes frontend-only keys", () => {
    const packets = [
      {
        id: "A",
        priority: 3 as const,
        traffic_type: "Custom",
        arrival_time: 0.5,
        duration: 0.1,
      },
    ];
    expect(toPackets(toDraft(packets))).toEqual(packets);
  });
});
