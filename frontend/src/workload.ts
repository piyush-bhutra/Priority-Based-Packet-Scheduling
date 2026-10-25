import { TRAFFIC, type DraftPacket, type Packet } from "./types";

function timeError(value: string, positive: boolean) {
  if (!/^(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(value))
    return "Use a decimal number with up to 6 fractional places.";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric > 1_000_000)
    return "Maximum is 1,000,000 ms.";
  if (positive && numeric === 0) return "Must be greater than 0 ms.";
  return null;
}
export function validateDraft(
  packets: DraftPacket[],
  interval: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!packets.length || packets.length > 500)
    errors.packets = "Provide 1–500 packets.";
  const ids = new Set<string>();
  packets.forEach((packet, index) => {
    if (!packet.id.trim() || packet.id.length > 128)
      errors[`${index}.id`] = "Use a nonblank ID of up to 128 characters.";
    else if (ids.has(packet.id))
      errors[`${index}.id`] = "Packet IDs must be unique.";
    ids.add(packet.id);
    if (![1, 2, 3].includes(packet.priority))
      errors[`${index}.priority`] = "Choose priority 1, 2 or 3.";
    if (!TRAFFIC.includes(packet.traffic_type))
      errors[`${index}.traffic_type`] = "Choose a supported traffic type.";
    for (const field of ["arrival_time", "duration"] as const) {
      const error = timeError(packet[field], field === "duration");
      if (error) errors[`${index}.${field}`] = error;
    }
  });
  const error = timeError(interval, true);
  if (error) errors.aging_interval = error;
  return errors;
}
export function toPackets(packets: DraftPacket[]): Packet[] {
  return packets.map(
    ({ id, traffic_type, priority, arrival_time, duration }) => ({
      id,
      traffic_type,
      priority,
      arrival_time: Number(arrival_time),
      duration: Number(duration),
    }),
  );
}
export function toDraft(packets: Packet[]): DraftPacket[] {
  return packets.map((packet) => ({
    ...packet,
    key: crypto.randomUUID(),
    arrival_time: String(packet.arrival_time),
    duration: String(packet.duration),
  }));
}
