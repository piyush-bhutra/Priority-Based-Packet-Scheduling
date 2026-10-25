def select(waiting, time, interval):
    """Strict non-preemptive priority selection among arrived packets."""
    packet = min(waiting, key=lambda p: (p.priority, p.arrival_time, p.input_index))
    return packet, packet.priority
