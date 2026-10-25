from decimal import Decimal, localcontext

from backend.errors import ValidationError
from backend.models import MAX_PACKETS, Packet, number
from backend.scheduling import aging, fcfs, priority
from backend.scheduling.metrics import calculate

SELECTORS = {'fcfs': fcfs.select, 'priority': priority.select, 'aging': aging.select}


def json_numbers(value):
    """Convert exact internal decimals to standard JSON-compatible numbers."""
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, dict):
        return {key: json_numbers(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_numbers(item) for item in value]
    return value


def simulate(packets, algorithm, aging_interval=5):
    """Run one policy on validated immutable packets, in original input order."""
    if not isinstance(algorithm, str) or algorithm not in SELECTORS:
        raise ValidationError('algorithm: supported names are fcfs, priority, aging')
    if not isinstance(packets, (tuple, list)) or not 1 <= len(packets) <= MAX_PACKETS:
        raise ValidationError('packets: expected 1 to 500 validated Packet values')
    if any(not isinstance(p, Packet) or p.input_index != i for i, p in enumerate(packets)):
        raise ValidationError('packets: expected validated packets in original input order')
    if len({p.id for p in packets}) != len(packets):
        raise ValidationError('packets: duplicate packet identifiers')
    interval = number(aging_interval, 'aging_interval', positive=True)
    # Keep arithmetic independent of any caller's Decimal context.
    with localcontext() as context:
        context.prec = 40
        return _run(packets, algorithm, interval)


def _run(packets, algorithm, interval):
    future = sorted(packets, key=lambda p: (p.arrival_time, p.input_index))
    waiting, schedule, events, idle = [], [], [], []
    queue = [dict(time=0, queue_length=0, event_sequence=None)]
    time, next_arrival = Decimal(0), 0

    def emit(kind, timestamp, packet=None, **details):
        event = dict(sequence=len(events), type=kind, time=timestamp,
                     packet_id=packet.id if packet else None, queue_length=len(waiting), **details)
        events.append(event)
        if kind in ('arrival', 'transmission_start'):
            queue.append(dict(time=timestamp, queue_length=len(waiting), event_sequence=event['sequence']))

    def arrive(packet):
        waiting.append(packet)
        emit('arrival', packet.arrival_time, packet)

    while len(schedule) < len(packets):
        if not waiting and next_arrival < len(future) and future[next_arrival].arrival_time > time:
            end = future[next_arrival].arrival_time
            idle.append(dict(start_time=time, end_time=end, duration=end - time))
            emit('idle_start', time)
            emit('idle_end', end)
            time = end
        while next_arrival < len(future) and future[next_arrival].arrival_time <= time:
            arrive(future[next_arrival])
            next_arrival += 1
        packet, effective = SELECTORS[algorithm](waiting, time, interval)
        emit('selection', time, packet, effective_priority=effective)
        waiting.remove(packet)
        emit('transmission_start', time, packet, effective_priority=effective)
        completion = time + packet.duration
        wait = time - packet.arrival_time
        schedule.append(dict(
            packet_id=packet.id, traffic_type=packet.traffic_type, original_priority=packet.priority,
            effective_priority=effective, input_index=packet.input_index, arrival_time=packet.arrival_time,
            duration=packet.duration, start_time=time, completion_time=completion, waiting_time=wait,
            turnaround_time=completion - packet.arrival_time, response_time=wait,
            scheduling_position=len(schedule) + 1))
        # Strictly earlier arrivals occur during transmission. Exact-end arrivals are handled
        # after completion, at the top of the next iteration.
        while next_arrival < len(future) and future[next_arrival].arrival_time < completion:
            arrive(future[next_arrival])
            next_arrival += 1
        time = completion
        emit('completion', time, packet)
    metrics, per_priority = calculate(schedule, idle)
    return json_numbers(dict(algorithm=algorithm, aging_interval=interval if algorithm == 'aging' else None,
                             schedule=schedule, idle_intervals=idle, events=events, queue_timeline=queue,
                             metrics=metrics, per_priority=per_priority))
