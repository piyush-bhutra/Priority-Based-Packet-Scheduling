import pytest

from backend.scenarios import get_scenarios
from backend.scheduling.engine import simulate
from backend.validation import validate_workload

EXPECTED = {
    'balanced': {'fcfs': ['A', 'B', 'C', 'D', 'E'], 'priority': ['A', 'C', 'E', 'B', 'D'],
                 'aging': ['A', 'C', 'E', 'B', 'D']},
    'burst': {'fcfs': ['A', 'B', 'U1', 'U2', 'U3'], 'priority': ['A', 'U1', 'U2', 'U3', 'B'],
              'aging': ['A', 'U1', 'U2', 'U3', 'B']},
    'aging-benefit': {'fcfs': ['A', 'L', 'H1', 'H2', 'H3'],
                      'priority': ['A', 'H1', 'H2', 'H3', 'L'], 'aging': ['A', 'L', 'H1', 'H2', 'H3']},
    'idle': {'fcfs': ['A', 'B', 'C'], 'priority': ['A', 'B', 'C'], 'aging': ['A', 'B', 'C']},
    'ties': {'fcfs': ['L', 'H1', 'H2', 'M1', 'M2'], 'priority': ['H1', 'H2', 'M1', 'M2', 'L'],
             'aging': ['H1', 'H2', 'M1', 'M2', 'L']},
}


@pytest.mark.parametrize('scenario_id', EXPECTED)
@pytest.mark.parametrize('algorithm', ['fcfs', 'priority', 'aging'])
def test_all_predefined_schedules(scenario_id, algorithm):
    scenario = next(s for s in get_scenarios() if s['id'] == scenario_id)
    result = simulate(validate_workload(scenario['packets']), algorithm, scenario['aging_interval'])
    assert [r['packet_id'] for r in result['schedule']] == EXPECTED[scenario_id][algorithm]
    assert scenario['name'] and scenario['description']


def results_for(ident):
    scenario = next(s for s in get_scenarios() if s['id'] == ident)
    return {a: simulate(validate_workload(scenario['packets']), a, scenario['aging_interval'])
            for a in ['fcfs', 'priority', 'aging']}


def test_burst_improves_urgent_wait_and_increases_low_priority_wait():
    results = results_for('burst')
    fcfs, priority = results['fcfs'], results['priority']
    assert fcfs['per_priority']['1']['average_waiting_time'] == 5
    assert priority['per_priority']['1']['average_waiting_time'] == 2
    assert fcfs['per_priority']['3']['average_waiting_time'] == 1.5
    assert priority['per_priority']['3']['average_waiting_time'] == 3
    for r in results.values():
        assert r['metrics']['makespan'] == 10
        assert r['metrics']['throughput'] == 0.5
        assert r['metrics']['link_utilization'] == 1


def test_aging_gives_low_packet_earlier_service():
    results = results_for('aging-benefit')
    low = {a: next(r for r in output['schedule'] if r['packet_id'] == 'L')
           for a, output in results.items()}
    assert low['priority']['start_time'] == 16
    assert low['aging']['start_time'] == 10
    assert low['aging']['effective_priority'] == 1
    assert low['aging']['original_priority'] == 3


def test_scenarios_are_fresh_copies():
    first = get_scenarios()
    first[0]['packets'][0]['priority'] = 1
    assert get_scenarios()[0]['packets'][0]['priority'] == 3
