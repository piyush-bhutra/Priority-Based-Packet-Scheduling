from copy import deepcopy

import pytest

from backend.scheduling.engine import simulate
from backend.validation import ValidationError, validate_workload

POLICIES = ['fcfs', 'priority', 'aging']


def workload(*specs):
    return validate_workload([dict(id=i, traffic_type='Custom', priority=p, arrival_time=a, duration=d)
                              for i, p, a, d in specs])


def order(result):
    return [row['packet_id'] for row in result['schedule']]


@pytest.mark.parametrize('policy,expected', [
    ('fcfs', ['A', 'B', 'C']), ('priority', ['A', 'C', 'B']), ('aging', ['A', 'C', 'B'])])
def test_policy_order_and_non_preemption(policy, expected):
    packets = workload(('A', 3, 0, 4), ('B', 3, 1, 2), ('C', 1, 2, 1))
    result = simulate(packets, policy)
    assert order(result) == expected
    assert result['schedule'][0]['completion_time'] == 4


@pytest.mark.parametrize('policy', POLICIES)
def test_equal_priority_ties_use_arrival_then_original_index(policy):
    packets = workload(('Z', 2, 2, 1), ('B', 2, 0, 3), ('A', 2, 2, 1))
    assert order(simulate(packets, policy)) == ['B', 'Z', 'A']


def test_fcfs_ignores_priority_on_equal_arrival():
    packets = workload(('Z', 3, 0, 1), ('A', 1, 0, 1))
    assert order(simulate(packets, 'fcfs')) == ['Z', 'A']


def test_priority_ties_use_arrival_before_input_position():
    packets = workload(('start', 1, 0, 5), ('later', 2, 3, 1), ('earlier', 2, 1, 1))
    assert order(simulate(packets, 'priority')) == ['start', 'earlier', 'later']


@pytest.mark.parametrize('interval,expected', [(5, ['A', 'C', 'B']), (2, ['A', 'B', 'C'])])
def test_aging_promotion_at_exact_boundary(interval, expected):
    packets = workload(('A', 1, 0, 4), ('B', 3, 0, 1), ('C', 1, 3, 1))
    result = simulate(packets, 'aging', interval)
    assert order(result) == expected
    by_id = {row['packet_id']: row for row in result['schedule']}
    assert by_id['B']['effective_priority'] == (2 if interval == 5 else 1)
    assert by_id['B']['original_priority'] == 3


def test_aging_never_promotes_above_one():
    result = simulate(workload(('A', 1, 0, 100), ('B', 3, 0, 1)), 'aging', 1)
    assert result['schedule'][1]['effective_priority'] == 1


def test_fractional_clock_and_aging_do_not_lose_boundary():
    packets = workload(('A', 1, 0, 0.3), ('B', 3, 0.1, 0.1), ('C', 1, 0.2, 0.1))
    result = simulate(packets, 'aging', 0.1)
    assert order(result) == ['A', 'B', 'C']
    assert [r['completion_time'] for r in result['schedule']] == [0.3, 0.4, 0.5]


@pytest.mark.parametrize('policy', POLICIES)
def test_initial_and_interior_idle_intervals(policy):
    result = simulate(workload(('A', 2, 2, 1), ('B', 1, 5, 2)), policy)
    assert result['idle_intervals'] == [{'start_time': 0, 'end_time': 2, 'duration': 2},
                                        {'start_time': 3, 'end_time': 5, 'duration': 2}]
    assert result['metrics']['makespan'] == 7
    assert result['metrics']['idle_time'] == 4
    assert result['metrics']['throughput'] == pytest.approx(2 / 7)
    assert result['metrics']['link_utilization'] == pytest.approx(3 / 7)


def test_metrics_match_independent_manual_schedule():
    result = simulate(workload(('A', 3, 0, 4), ('B', 3, 1, 2), ('C', 1, 2, 1)), 'priority')
    rows = result['schedule']
    assert [r['start_time'] for r in rows] == [0, 4, 5]
    assert [r['waiting_time'] for r in rows] == [0, 2, 4]
    assert [r['turnaround_time'] for r in rows] == [4, 3, 6]
    assert [r['response_time'] for r in rows] == [0, 2, 4]
    assert [r['scheduling_position'] for r in rows] == [1, 2, 3]
    m = result['metrics']
    assert m['average_waiting_time'] == 2
    assert m['average_turnaround_time'] == pytest.approx(13 / 3)
    assert m['average_response_time'] == 2
    assert m['max_waiting_time'] == 4
    assert m['completed_packets'] == 3
    assert m['busy_time'] == m['makespan'] == 7
    assert m['idle_time'] == 0
    assert m['throughput'] == pytest.approx(3 / 7)
    assert m['link_utilization'] == 1
    assert result['per_priority']['1'] == dict(completion_count=1, average_waiting_time=2, max_waiting_time=2)
    assert result['per_priority']['2'] == dict(completion_count=0, average_waiting_time=None, max_waiting_time=None)
    assert result['per_priority']['3'] == dict(completion_count=2, average_waiting_time=2, max_waiting_time=4)


def test_equal_time_completion_precedes_arrivals_and_selection():
    result = simulate(workload(('A', 2, 0, 2), ('B', 1, 2, 1)), 'priority')
    assert [e['type'] for e in result['events'] if e['time'] == 2] == [
        'completion', 'arrival', 'selection', 'transmission_start']


@pytest.mark.parametrize('policy', POLICIES)
def test_event_replay_conserves_packets_and_excludes_active_from_queue(policy):
    result = simulate(workload(('A', 3, 0, 4), ('B', 2, 1, 2), ('C', 1, 1, 1), ('D', 3, 9, 1)), policy)
    waiting, completed, active = set(), set(), None
    previous = -1
    changes = [dict(time=0, queue_length=0, event_sequence=None)]
    for index, event in enumerate(result['events']):
        assert event['sequence'] == index
        assert event['time'] >= previous
        previous = event['time']
        ident = event['packet_id']
        if event['type'] == 'arrival':
            assert ident not in waiting | completed and ident != active
            waiting.add(ident)
        elif event['type'] == 'selection':
            assert active is None and ident in waiting
        elif event['type'] == 'transmission_start':
            assert active is None
            waiting.remove(ident)
            active = ident
        elif event['type'] == 'completion':
            assert active == ident
            active = None
            completed.add(ident)
        elif event['type'].startswith('idle_'):
            assert active is None and not waiting
        else:
            pytest.fail('unknown event type')
        assert event['queue_length'] == len(waiting)
        if event['type'] in ('arrival', 'transmission_start'):
            changes.append(dict(time=event['time'], queue_length=len(waiting), event_sequence=index))
    assert completed == {'A', 'B', 'C', 'D'}
    assert not waiting and active is None
    assert result['queue_timeline'] == changes


@pytest.mark.parametrize('policy', POLICIES)
def test_reproducibility_input_immutability_arrivals_and_no_overlap(policy):
    packets = workload(('Z', 3, 3, 2), ('A', 1, 0, 5), ('C', 2, 1, 1))
    before = deepcopy(packets)
    first = simulate(packets, policy)
    assert first == simulate(packets, policy)
    assert packets == before
    rows = first['schedule']
    assert len({r['packet_id'] for r in rows}) == len(packets)
    for previous, current in zip(rows, rows[1:]):
        assert previous['completion_time'] <= current['start_time']
    for row in rows:
        assert row['start_time'] >= row['arrival_time']
        assert row['completion_time'] == row['start_time'] + row['duration']


@pytest.mark.parametrize('interval', [0, -1, True, '5', float('nan'), float('inf'), 0.0000001])
def test_invalid_aging_interval_is_rejected(interval):
    with pytest.raises(ValidationError):
        simulate(workload(('A', 1, 0, 1)), 'aging', interval)


@pytest.mark.parametrize('packets,policy', [([], 'fcfs'), ([], 'bad'), ([{}], 'fcfs')])
def test_engine_rejects_invalid_direct_calls(packets, policy):
    with pytest.raises(ValidationError):
        simulate(packets, policy)
