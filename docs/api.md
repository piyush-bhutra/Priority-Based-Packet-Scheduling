# API v1.0.0

All responses are JSON. Local base URL: `http://127.0.0.1:5000`. Times use simulated milliseconds.

## Health and scenarios

`GET /api/health` returns 200 with `{"status":"ok","version":"1.0.0"}`.

`GET /api/scenarios` returns 200 with `{ "scenarios": [...] }`. Every scenario contains `id`, `name`,
`description`, `aging_interval` and `packets`. IDs are `balanced`, `burst`, `aging-benefit`, `idle`, `ties`.
Packet definitions use the same schema as simulation requests; `input_index` is derived on submission.

## Simulate

`POST /api/simulate` requires `Content-Type: application/json`. Example:

```json
{
  "packets": [
    {"id":"A","traffic_type":"File Download","priority":3,"arrival_time":0,"duration":4},
    {"id":"B","traffic_type":"Email","priority":3,"arrival_time":1,"duration":2},
    {"id":"C","traffic_type":"Gaming","priority":1,"arrival_time":2,"duration":1}
  ],
  "algorithms": ["fcfs", "priority", "aging"],
  "aging_interval": 5
}
```

Use a one-element `algorithms` list for a single run; the response envelope remains the same. Algorithms
must be unique supported names, one to three entries. `aging_interval` is optional, defaults to 5 ms,
and if provided must be valid even when aging is not selected. Other top-level fields are rejected.

Workloads contain 1–500 objects. All five example packet fields are required; unknown fields are rejected.
IDs are unique nonblank strings of at most 128 characters. Priority is integer 1, 2 or 3; it can override
traffic-type suggestions. Traffic types are exactly `Video Call`, `Gaming`, `Web`, `Email`, `File Download`,
`Custom`. Arrival is nonnegative; duration is positive; each time <=1,000,000 ms with up to six fractional
places. Strings, booleans, NaN and infinities are rejected as numeric values. Optional integer
`input_index` must match the packet's actual zero-based list position. The server never reorders the input
definitions or permanently changes a packet's priority.

## Result schema

A successful response is 200 with `{ "results": { "fcfs": {...}, "priority": {...}, "aging": {...} } }`,
containing only the selected algorithms. Algorithm keys identify results; JSON object key order is not
part of the contract. Each result contains:

| Field | Contents |
|---|---|
| `algorithm` | `fcfs`, `priority` or `aging` |
| `aging_interval` | Configured ms for aging; null for other policies |
| `schedule` | Rows in transmission order |
| `idle_intervals` | `{start_time, end_time, duration}` rows |
| `events` | `{sequence, type, time, packet_id, queue_length}`; selection/start add `effective_priority` |
| `queue_timeline` | `{time, queue_length, event_sequence}` changes; initial sequence is null |
| `metrics` | Aggregate values listed below |
| `per_priority` | Keys `"1"`, `"2"`, `"3"` based on original priorities |

A schedule row contains `packet_id`, `traffic_type`, `original_priority`, `effective_priority`,
`input_index`, `arrival_time`, `duration`, `start_time`, `completion_time`, `waiting_time`,
`turnaround_time`, `response_time`, and `scheduling_position`. All time fields are numeric, position
is one-based, and effective priority is the value actually used at selection.

Event types: `arrival`, `selection`, `transmission_start`, `completion`, `idle_start`, `idle_end`.
Idle events use null `packet_id`. Sequence breaks timestamp ties. Counts exclude the active transmission.
See architecture notes for completion/arrival/start ordering at a shared timestamp.

Metrics: `completed_packets`, `makespan`, `busy_time`, `idle_time`, `throughput`, `link_utilization`,
`max_waiting_time`, `average_waiting_time`, `average_turnaround_time`, `average_response_time`.
Throughput uses packets/ms and utilization is a fraction, not a percent. Both denominators begin at t=0.
Each priority summary has `completion_count`, `average_waiting_time`, `max_waiting_time`; average and
maximum are null for a class with no completed packets.

## Errors

Errors use `{ "error": { "code": "validation_error", "message": "packets[1].id: duplicate ..." } }`.

| HTTP status | Code | Meaning |
|---|---|---|
| 400 | `validation_error` | Invalid shape, field, bounds, algorithm or empty workload |
| 400 | `invalid_json` | Malformed JSON, unsupported nesting or numeric representation |
| 404 | `not_found` | Unknown URL |
| 405 | `method_not_allowed` | Wrong HTTP method; Allow header preserved |
| 413 | `request_too_large` | Body exceeds 1 MiB |
| 415 | `unsupported_media_type` | JSON content type required |
| 500 | `internal_error` | Unexpected server failure; details stay in server logs |

Frontend integration should display the message for invalid inputs, preserve packet list order, and
render backend schedules/events directly. Playback should pause or seek through existing output;
it should never recalculate policy choices or present hard-coded comparative metrics.
