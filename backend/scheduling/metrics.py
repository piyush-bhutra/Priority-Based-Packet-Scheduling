from decimal import Decimal


def calculate(schedule, idle_intervals):
    """Metrics retain decimal precision until the response boundary."""
    count = len(schedule)
    makespan = schedule[-1]['completion_time']
    busy = sum((row['duration'] for row in schedule), Decimal(0))
    idle = sum((row['duration'] for row in idle_intervals), Decimal(0))
    metrics = {
        'completed_packets': count,
        'makespan': makespan,
        'busy_time': busy,
        'idle_time': idle,
        'throughput': Decimal(count) / makespan,
        'link_utilization': busy / makespan,
        'max_waiting_time': max(row['waiting_time'] for row in schedule),
    }
    for name in ('waiting_time', 'turnaround_time', 'response_time'):
        metrics[f'average_{name}'] = sum(row[name] for row in schedule) / count
    per_priority = {}
    for priority in (1, 2, 3):
        waits = [row['waiting_time'] for row in schedule if row['original_priority'] == priority]
        per_priority[str(priority)] = {
            'completion_count': len(waits),
            'average_waiting_time': sum(waits) / len(waits) if waits else None,
            'max_waiting_time': max(waits) if waits else None,
        }
    return metrics, per_priority
