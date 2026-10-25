from dataclasses import dataclass
from decimal import Decimal

from backend.errors import ValidationError

TRAFFIC_TYPES = ('Video Call', 'Gaming', 'Web', 'Email', 'File Download', 'Custom')
MAX_PACKETS = 500
MAX_TIME = Decimal('1000000')


def number(value, field, *, positive=False):
    """Validate simulated milliseconds without binary-float arithmetic."""
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValidationError(f'{field}: expected a finite number')
    result = Decimal(str(value))
    if not result.is_finite() or result < 0 or result > MAX_TIME:
        raise ValidationError(f'{field}: must be finite and between 0 and 1000000 ms')
    if positive and result == 0:
        raise ValidationError(f'{field}: must be greater than zero')
    _, digits, exponent = result.as_tuple()
    trailing_zeros = 0
    for digit in reversed(digits):
        if digit != 0:
            break
        trailing_zeros += 1
    if result != 0 and exponent + trailing_zeros < -6:
        raise ValidationError(f'{field}: at most six fractional decimal places are supported')
    return result


@dataclass(frozen=True)
class Packet:
    id: str
    traffic_type: str
    priority: int
    arrival_time: Decimal
    duration: Decimal
    input_index: int

    def __post_init__(self):
        if not isinstance(self.id, str) or not self.id.strip() or len(self.id) > 128:
            raise ValidationError('id: expected a non-empty string of at most 128 characters')
        if self.traffic_type not in TRAFFIC_TYPES:
            raise ValidationError(f'traffic_type: expected one of {TRAFFIC_TYPES}')
        if type(self.priority) is not int or self.priority not in (1, 2, 3):
            raise ValidationError('priority: expected integer 1, 2 or 3')
        if type(self.input_index) is not int or not 0 <= self.input_index < MAX_PACKETS:
            raise ValidationError('input_index: expected an original position between 0 and 499')
        object.__setattr__(self, 'arrival_time', number(self.arrival_time, 'arrival_time'))
        object.__setattr__(self, 'duration', number(self.duration, 'duration', positive=True))
