import { POLICIES, type Packet, type Results, type Scenario } from "./types";

async function request<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method: body ? "POST" : "GET",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      "Cannot reach the simulation service. Start Flask on port 5000, then retry.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null)
    throw new Error(
      data?.error?.message ??
        "Simulation service unavailable. Check Flask on port 5000 and retry.",
    );
  return data as T;
}
export const getHealth = (signal: AbortSignal) =>
  request<{ status: string; version: string }>("health", signal);
export const getScenarios = (signal: AbortSignal) =>
  request<{ scenarios: Scenario[] }>("scenarios", signal);
export const simulate = (
  packets: Packet[],
  interval: number,
  signal: AbortSignal,
) =>
  request<{ results: Results }>("simulate", signal, {
    packets,
    algorithms: POLICIES,
    aging_interval: interval,
  });
