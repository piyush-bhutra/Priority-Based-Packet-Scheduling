def effective_priority(packet, time, interval):
    return max(1, packet.priority - int((time - packet.arrival_time) // interval))


def select(waiting, time, interval):
    """Recompute effective priorities at each decision; never mutate packets."""
    packet = min(waiting, key=lambda p: (
        effective_priority(p, time, interval), p.arrival_time, p.input_index))
    return packet, effective_priority(packet, time, interval)
