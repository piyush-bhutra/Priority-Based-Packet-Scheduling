def select(waiting, time, interval):
    """Earliest arrival, then original input order; ignore priority."""
    packet = min(waiting, key=lambda p: (p.arrival_time, p.input_index))
    return packet, packet.priority
