r"""Live HTTP verification and independent hand-calculated schedule checks.

Run from the repository root with .venv\Scripts\python.exe scripts\verify_backend.py.
Starts a temporary Flask process on a free loopback port and always stops it.
"""
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    'balanced': [['A', 'B', 'C', 'D', 'E'], ['A', 'C', 'E', 'B', 'D'], ['A', 'C', 'E', 'B', 'D']],
    'burst': [['A', 'B', 'U1', 'U2', 'U3'], ['A', 'U1', 'U2', 'U3', 'B'], ['A', 'U1', 'U2', 'U3', 'B']],
    'aging-benefit': [['A', 'L', 'H1', 'H2', 'H3'], ['A', 'H1', 'H2', 'H3', 'L'], ['A', 'L', 'H1', 'H2', 'H3']],
    'idle': [['A', 'B', 'C'], ['A', 'B', 'C'], ['A', 'B', 'C']],
    'ties': [['L', 'H1', 'H2', 'M1', 'M2'], ['H1', 'H2', 'M1', 'M2', 'L'], ['H1', 'H2', 'M1', 'M2', 'L']],
}
ALGORITHMS = ['fcfs', 'priority', 'aging']


def main():
    if sys.prefix == sys.base_prefix:
        raise RuntimeError('Run this script using the project virtual environment.')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'

    def request(path, payload=None):
        data = json.dumps(payload).encode() if payload is not None else None
        req = Request(base + path, data=data, headers={'Content-Type': 'application/json'})
        try:
            with urlopen(req, timeout=10) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    with tempfile.TemporaryFile() as log:
        process = subprocess.Popen(
            [sys.executable, '-m', 'flask', '--app', 'backend.app:create_app', 'run',
             '--host', '127.0.0.1', '--port', str(port), '--no-debugger', '--no-reload'],
            cwd=ROOT, stdout=log, stderr=log,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0)
        try:
            for _ in range(100):
                if process.poll() is not None:
                    log.seek(0)
                    raise RuntimeError(log.read().decode(errors='replace'))
                try:
                    health_status, health = request('/api/health')
                    break
                except (URLError, TimeoutError):
                    time.sleep(0.1)
            else:
                log.seek(0)
                raise RuntimeError('Flask did not become ready. Server log: ' + log.read().decode(errors='replace'))
            assert health_status == 200 and health == {'status': 'ok', 'version': '1.0.0'}
            scenario_status, data = request('/api/scenarios')
            assert scenario_status == 200 and len(data['scenarios']) == 5
            report = dict(python=sys.version.split()[0], virtual_environment=True,
                          health_status=health_status, scenarios_status=scenario_status, scenarios={})
            for scenario in data['scenarios']:
                status, result = request('/api/simulate', dict(packets=scenario['packets'],
                    algorithms=ALGORITHMS, aging_interval=scenario['aging_interval']))
                assert status == 200
                observed = {}
                for algorithm, expected in zip(ALGORITHMS, EXPECTED[scenario['id']]):
                    output = result['results'][algorithm]
                    order = [r['packet_id'] for r in output['schedule']]
                    assert order == expected, (scenario['id'], algorithm, order)
                    observed[algorithm] = dict(order=order, starts=[r['start_time'] for r in output['schedule']],
                        metrics=output['metrics'], per_priority=output['per_priority'])
                report['scenarios'][scenario['id']] = dict(status=status, algorithms=observed)

            # Independent calculation: A(0,4,p3), B(1,2,p3), C(2,1,p1).
            # Priority: A 0–4, C 4–5, B 5–7. Wait 0,2,4; turnaround 4,3,6.
            manual_packets = [dict(id=i, traffic_type='Custom', priority=p, arrival_time=a, duration=d)
                              for i, p, a, d in [('A', 3, 0, 4), ('B', 3, 1, 2), ('C', 1, 2, 1)]]
            status, manual = request('/api/simulate', dict(packets=manual_packets, algorithms=['priority']))
            assert status == 200
            rows = manual['results']['priority']['schedule']
            observed = [[r['packet_id'], r['start_time'], r['completion_time'], r['waiting_time'],
                         r['turnaround_time']] for r in rows]
            expected = [['A', 0, 4, 0, 4], ['C', 4, 5, 2, 3], ['B', 5, 7, 4, 6]]
            assert observed == expected
            report['manual_calculation'] = dict(expected=expected, observed=observed, matched=True)
            error_status, error = request('/api/simulate', dict(packets=[], algorithms=['fcfs']))
            assert error_status == 400 and error['error']['code'] == 'validation_error'
            report['invalid_workload_status'] = error_status
            path = ROOT / 'docs' / 'verification.json'
            path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
            print('Live HTTP verification: health 200; scenarios 200; simulate 200 (5 scenarios x 3 policies); invalid workload 400.')
            print('Independent manual calculation: expected = observed:', observed)
            for ident, scenario in report['scenarios'].items():
                for algorithm, output in scenario['algorithms'].items():
                    print(ident, algorithm, ' -> '.join(output['order']), 'starts', output['starts'])
            print('Saved:', path)
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


if __name__ == '__main__':
    main()
