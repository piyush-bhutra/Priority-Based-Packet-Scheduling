from copy import deepcopy
from dataclasses import FrozenInstanceError
from decimal import Decimal, localcontext

import pytest

from backend.models import Packet
from backend.validation import ValidationError, validate_workload


def packet(**changes):
    return dict(id='A', traffic_type='Custom', priority=2, arrival_time=0, duration=1, **changes)


def test_original_input_is_preserved_and_position_assigned():
    raw = [packet()]
    before = deepcopy(raw)
    result = validate_workload(raw)
    assert raw == before
    assert result[0].input_index == 0
    with pytest.raises(FrozenInstanceError):
        result[0].priority = 1


@pytest.mark.parametrize('field,value', [
    ('id', ''), ('id', '  '), ('id', 12), ('priority', 0), ('priority', 4),
    ('priority', True), ('priority', 1.0), ('arrival_time', -1),
    ('arrival_time', float('nan')), ('arrival_time', float('inf')),
    ('arrival_time', True), ('arrival_time', '2'), ('duration', 0),
    ('duration', -1), ('duration', None), ('duration', float('-inf')),
    ('duration', 1000001), ('arrival_time', 0.0000001),
    ('traffic_type', 'Unknown'), ('input_index', 7), ('extra', 1),
])
def test_rejects_invalid_packet_fields(field, value):
    raw = packet()
    raw[field] = value
    with pytest.raises(ValidationError) as error:
        validate_workload([raw])
    assert field in str(error.value)


@pytest.mark.parametrize('raw', [[], None, {}, 'packets', [None], [packet(), packet()],
                                      [dict(id=str(i), traffic_type='Custom', priority=1,
                                            arrival_time=0, duration=1) for i in range(501)]])
def test_rejects_invalid_workloads(raw):
    with pytest.raises(ValidationError):
        validate_workload(raw)


@pytest.mark.parametrize('field', ['id', 'traffic_type', 'priority', 'arrival_time', 'duration'])
def test_missing_fields_report_path(field):
    raw = packet()
    del raw[field]
    with pytest.raises(ValidationError, match=field):
        validate_workload([raw])


def test_priority_override_and_decimal_inputs():
    raw = packet()
    raw.update(traffic_type='Video Call', priority=3, duration=0.1, input_index=0)
    p = validate_workload([raw])[0]
    assert p.priority == 3
    assert str(p.duration) == '0.1'


def test_direct_model_construction_validates_values():
    with pytest.raises(ValidationError):
        Packet('X', 'Custom', 2, 0, -1, 0)


def test_precision_validation_is_independent_of_decimal_context():
    with localcontext() as context:
        context.prec = 2
        with pytest.raises(ValidationError, match='duration'):
            Packet('X', 'Custom', 2, 0, Decimal('1.0000001'), 0)
