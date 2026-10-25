import { expect, it } from "vitest";
import { fmt, exact } from "./format";

it("shows missing class metrics as N/A, preserving real zero", () => {
  expect(fmt(null)).toBe("N/A");
  expect(fmt(0)).toBe("0");
});
it("retains six-place input timing in packet inspection", () => {
  expect(exact(0.000001)).toBe("0.000001");
  expect(exact(12.123456)).toBe("12.123456");
});
it("keeps very small positive throughput distinguishable from zero", () => {
  expect(fmt(0.0000005)).toBe("5.00e-7");
});
