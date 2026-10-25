def _packets(specs):
    return [dict(id=ident, traffic_type=traffic, priority=priority, arrival_time=arrival, duration=duration)
            for ident, traffic, priority, arrival, duration in specs]


def get_scenarios():
    """Build fresh JSON-ready data so callers cannot change later demonstrations."""
    definitions = [
        ('balanced', 'Balanced mixed traffic',
         'Mixed arrivals demonstrate how urgent traffic moves ahead of waiting low-priority packets.',
         [('A', 'File Download', 3, 0, 4), ('B', 'Web', 2, 1, 2), ('C', 'Gaming', 1, 2, 1),
          ('D', 'Email', 3, 3, 2), ('E', 'Video Call', 1, 5, 1)]),
        ('burst', 'High-priority traffic burst',
         'Urgent traffic waits less under Priority, while queued low-priority traffic waits longer.',
         [('A', 'File Download', 3, 0, 4), ('B', 'Email', 3, 1, 3), ('U1', 'Gaming', 1, 2, 1),
          ('U2', 'Video Call', 1, 3, 1), ('U3', 'Gaming', 1, 4, 1)]),
        ('aging-benefit', 'Aging benefit',
         'L waits through A and reaches effective priority 1 at t=10; earlier arrival wins the tie.',
         [('A', 'Video Call', 1, 0, 10), ('L', 'File Download', 3, 0, 1), ('H1', 'Gaming', 1, 1, 2),
          ('H2', 'Video Call', 1, 2, 2), ('H3', 'Gaming', 1, 3, 2)]),
        ('idle', 'Idle output link',
         'An initial idle interval and a later gap verify arrival constraints and utilization from t=0.',
         [('A', 'Web', 2, 2, 1), ('B', 'Gaming', 1, 6, 2), ('C', 'Email', 3, 6, 1)]),
        ('ties', 'Simultaneous arrivals and priority ties',
         'Input order breaks equal-arrival/equal-priority ties; FCFS ignores priority.',
         [('L', 'Email', 3, 0, 2), ('H1', 'Gaming', 1, 0, 1), ('H2', 'Video Call', 1, 0, 1),
          ('M1', 'Web', 2, 0, 1), ('M2', 'Custom', 2, 0, 1)]),
    ]
    return [dict(id=ident, name=name, description=description, aging_interval=5, packets=_packets(specs))
            for ident, name, description, specs in definitions]
