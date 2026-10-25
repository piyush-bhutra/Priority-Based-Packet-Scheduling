export type Policy = "fcfs" | "priority" | "aging";
export type Priority = 1 | 2 | 3;
export interface Packet {
  id: string;
  traffic_type: string;
  priority: Priority;
  arrival_time: number;
  duration: number;
}
export interface DraftPacket {
  key: string;
  id: string;
  traffic_type: string;
  priority: Priority;
  arrival_time: string;
  duration: string;
}
export interface Scenario {
  id: string;
  name: string;
  description: string;
  aging_interval: number;
  packets: Packet[];
}
export interface ScheduleRow {
  packet_id: string;
  traffic_type: string;
  original_priority: Priority;
  effective_priority: Priority;
  input_index: number;
  arrival_time: number;
  duration: number;
  start_time: number;
  completion_time: number;
  waiting_time: number;
  turnaround_time: number;
  response_time: number;
  scheduling_position: number;
}
export interface SimulationEvent {
  sequence: number;
  type:
    | "arrival"
    | "selection"
    | "transmission_start"
    | "completion"
    | "idle_start"
    | "idle_end";
  time: number;
  packet_id: string | null;
  queue_length: number;
  effective_priority?: Priority;
}
export interface ClassMetrics {
  completion_count: number;
  average_waiting_time: number | null;
  max_waiting_time: number | null;
}
export interface Metrics {
  completed_packets: number;
  makespan: number;
  busy_time: number;
  idle_time: number;
  throughput: number;
  link_utilization: number;
  max_waiting_time: number;
  average_waiting_time: number;
  average_turnaround_time: number;
  average_response_time: number;
}
export interface Result {
  algorithm: Policy;
  aging_interval: number | null;
  schedule: ScheduleRow[];
  events: SimulationEvent[];
  idle_intervals: { start_time: number; end_time: number; duration: number }[];
  queue_timeline: {
    time: number;
    queue_length: number;
    event_sequence: number | null;
  }[];
  metrics: Metrics;
  per_priority: Record<Priority, ClassMetrics>;
}
export type Results = Record<Policy, Result>;
export const POLICIES: Policy[] = ["fcfs", "priority", "aging"];
export const LABELS: Record<Policy, string> = {
  fcfs: "FCFS",
  priority: "Strict Priority",
  aging: "Priority + Aging",
};
export const PRIORITIES: Record<Priority, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};
export const TRAFFIC = [
  "Video Call",
  "Gaming",
  "Web",
  "Email",
  "File Download",
  "Custom",
];
