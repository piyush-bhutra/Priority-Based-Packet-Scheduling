from backend.errors import ValidationError
from backend.models import MAX_PACKETS, Packet, number

ALGORITHMS = ('fcfs', 'priority', 'aging')
REQUIRED_FIELDS = {'id', 'traffic_type', 'priority', 'arrival_time', 'duration'}


def validate_workload(raw):
    if not isinstance(raw, list) or not 1 <= len(raw) <= MAX_PACKETS:
        raise ValidationError('packets: expected a list containing 1 to 500 packets')
    packets, seen = [], set()
    for index, item in enumerate(raw):
        path = f'packets[{index}]'
        if not isinstance(item, dict):
            raise ValidationError(f'{path}: expected an object')
        missing = REQUIRED_FIELDS - item.keys()
        extra = item.keys() - REQUIRED_FIELDS - {'input_index'}
        if missing or extra:
            raise ValidationError(f'{path}: missing fields {sorted(missing)}; unknown fields {sorted(extra)}')
        if 'input_index' in item and (type(item['input_index']) is not int or item['input_index'] != index):
            raise ValidationError(f'{path}.input_index: must match original input position {index}')
        try:
            packet = Packet(**{key: item[key] for key in REQUIRED_FIELDS}, input_index=index)
        except ValidationError as error:
            raise ValidationError(f'{path}.{error}') from error
        if packet.id in seen:
            raise ValidationError(f'{path}.id: duplicate packet identifier {packet.id!r}')
        seen.add(packet.id)
        packets.append(packet)
    return tuple(packets)


def validate_request(data):
    if not isinstance(data, dict):
        raise ValidationError('body: expected a JSON object')
    extra = data.keys() - {'packets', 'algorithms', 'aging_interval'}
    if extra:
        raise ValidationError(f'body: unknown fields {sorted(extra)}')
    packets = validate_workload(data.get('packets'))
    algorithms = data.get('algorithms')
    if not isinstance(algorithms, list) or not 1 <= len(algorithms) <= 3:
        raise ValidationError('algorithms: provide 1 to 3 unique names: fcfs, priority, aging')
    if any(not isinstance(a, str) or a not in ALGORITHMS for a in algorithms):
        raise ValidationError('algorithms: supported names are fcfs, priority, aging')
    if len(set(algorithms)) != len(algorithms):
        raise ValidationError('algorithms: duplicate selections are not allowed')
    interval = number(data.get('aging_interval', 5), 'aging_interval', positive=True)
    return packets, tuple(algorithms), interval
