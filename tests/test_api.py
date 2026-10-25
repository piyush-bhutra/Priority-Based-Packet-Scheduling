from copy import deepcopy

import pytest

from backend.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    return app.test_client()


def body():
    return dict(packets=[dict(id='A', traffic_type='Custom', priority=3, arrival_time=0, duration=4),
                         dict(id='B', traffic_type='Custom', priority=3, arrival_time=1, duration=2),
                         dict(id='C', traffic_type='Gaming', priority=1, arrival_time=2, duration=1)],
                algorithms=['fcfs', 'priority', 'aging'])


def test_health(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'
    assert response.json['version'] == '1.0.0'


def test_scenarios_endpoint(client):
    response = client.get('/api/scenarios')
    assert response.status_code == 200
    assert len(response.json['scenarios']) == 5
    for scenario in response.json['scenarios']:
        assert client.post('/api/simulate', json=dict(packets=scenario['packets'],
                           algorithms=['fcfs', 'priority', 'aging'], aging_interval=scenario['aging_interval'])).status_code == 200


def test_multi_algorithm_results_are_independent_and_deterministic(client):
    payload = body()
    before = deepcopy(payload)
    response = client.post('/api/simulate', json=payload)
    assert response.status_code == 200
    assert response.content_type == 'application/json'
    assert response.json == client.post('/api/simulate', json=payload).json
    assert payload == before
    results = response.json['results']
    assert [r['packet_id'] for r in results['fcfs']['schedule']] == ['A', 'B', 'C']
    assert [r['packet_id'] for r in results['priority']['schedule']] == ['A', 'C', 'B']
    for policy, expected in results.items():
        single = dict(payload, algorithms=[policy])
        assert client.post('/api/simulate', json=single).json['results'][policy] == expected
    results['fcfs']['schedule'][0]['start_time'] = 99
    assert results['priority']['schedule'][0]['start_time'] == 0


@pytest.mark.parametrize('field,value', [('packets', []), ('packets', None), ('algorithms', []),
    ('algorithms', ['bad']), ('algorithms', ['fcfs', 'fcfs']), ('algorithms', 'fcfs'),
    ('algorithms', [True]), ('algorithms', [{}]), ('aging_interval', 0),
    ('aging_interval', True), ('aging_interval', '5'), ('aging_interval', float('nan')),
    ('aging_interval', float('inf')), ('extra', 1)])
def test_invalid_requests_return_actionable_json_errors(client, field, value):
    payload = body()
    payload[field] = value
    response = client.post('/api/simulate', json=payload)
    assert response.status_code == 400
    assert response.json['error']['code'] == 'validation_error'
    assert field in response.json['error']['message']


@pytest.mark.parametrize('payload', [None, [], 'hello', {}, {'packets': []}])
def test_invalid_top_level_shapes(client, payload):
    response = client.post('/api/simulate', json=payload, content_type='application/json')
    assert response.status_code == 400
    assert response.is_json


def test_malformed_json_and_wrong_media_type(client):
    malformed = client.post('/api/simulate', data='{', content_type='application/json')
    assert malformed.status_code == 400
    assert malformed.json['error']['code'] == 'invalid_json'
    wrong_type = client.post('/api/simulate', data='hello', content_type='text/plain')
    assert wrong_type.status_code == 415
    assert wrong_type.json['error']['code'] == 'unsupported_media_type'


def test_unknown_route_and_method_use_consistent_json_errors(client):
    assert client.get('/api/missing').status_code == 404
    assert client.get('/api/missing').is_json
    assert client.get('/api/simulate').status_code == 405
    assert client.get('/api/simulate').is_json


def test_request_size_limit(client):
    response = client.post('/api/simulate', data=' ' * (1024 * 1024 + 1), content_type='application/json')
    assert response.status_code == 413
    assert response.json['error']['code'] == 'request_too_large'


def test_packet_validation_reaches_api(client):
    payload = body()
    payload['packets'][1]['id'] = 'A'
    response = client.post('/api/simulate', json=payload)
    assert response.status_code == 400
    assert 'packets[1].id' in response.json['error']['message']


@pytest.mark.parametrize('token', ['1000000.00000000001', '1.00000000000000001', '0.00000010000000001'])
def test_raw_json_numbers_are_validated_before_binary_rounding(client, token):
    raw = ('{"packets":[{"id":"A","traffic_type":"Custom","priority":1,'
           '"arrival_time":0,"duration":' + token + '}],"algorithms":["fcfs"]}')
    response = client.post('/api/simulate', data=raw, content_type='application/json')
    assert response.status_code == 400
    assert 'duration' in response.json['error']['message']


def test_deeply_nested_json_returns_client_error(client):
    response = client.post('/api/simulate', data='[' * 5000 + '0' + ']' * 5000,
                           content_type='application/json')
    assert response.status_code == 400
    assert response.json['error']['code'] == 'invalid_json'
