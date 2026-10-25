# Priority-Based Packet Scheduling in Computer Networks

BITE305L — Computer Networks, VIT Vellore. A local educational discrete-event simulator of one
router output link. Backend milestones 1–3 are implemented. Frontend development requires explicit
Phase 4 authorization.

## Windows setup

Open PowerShell in `D:\CN Project\Packet-Scheduling`. Use Python 3.11+ and a project-local `.venv`.
The existing environment uses Python 3.12.14, Flask 3.1.3 and pytest 9.0.2. Backend packages are
installed only in `.venv`; global Python packages are not used. Activation is optional because all
commands below explicitly select the environment's executable.

With an installed Python and pip, create a new environment on a fresh checkout:

```powershell
py -3.12 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock
```

On this workstation the launcher has no registered Python. The existing environment was created from
the Codex bundled Python, with `uv` installing packages into that environment because the bundled
interpreter's `ensurepip` could not bootstrap pip. To recreate using the same installed tools:

```powershell
$basePython = 'C:\Users\Piyush Bhutra\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
uv --cache-dir .uv-cache venv --python $basePython .venv
uv --cache-dir .uv-cache pip install --python .venv\Scripts\python.exe -r backend\requirements.lock
```

The `uv` procedure was verified on this workstation. `backend/requirements.txt` records the two direct
dependencies; `backend/requirements.lock` pins all 13 resolved packages. `.venv` and local caches are
ignored by Git. Recreate the environment after moving this repository to another machine.

## Run the API

```powershell
& .\.venv\Scripts\python.exe -m flask --app backend.app:create_app run --host 127.0.0.1 --port 5000
```

Alternatively, run `& .\.venv\Scripts\python.exe -m backend.app`. Keep the server terminal open;
stop it with Ctrl+C. Debug mode is off. The Flask development server is sufficient for this local demo.

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
$scenario = (Invoke-RestMethod http://127.0.0.1:5000/api/scenarios).scenarios |
    Where-Object id -eq 'burst'
$payload = @{
    packets = $scenario.packets
    algorithms = @('fcfs', 'priority', 'aging')
    aging_interval = 5
} | ConvertTo-Json -Depth 10
Invoke-RestMethod http://127.0.0.1:5000/api/simulate -Method Post `
    -ContentType 'application/json' -Body $payload
```

## Test and verify

```powershell
& .\.venv\Scripts\python.exe -m pytest -q
& .\.venv\Scripts\python.exe scripts\verify_backend.py
uv --cache-dir .uv-cache pip check --python .venv\Scripts\python.exe
```

The live verifier starts a temporary Flask process on a free loopback port, exercises every endpoint,
checks five scenarios against all three policies, compares a manually calculated schedule, writes
`docs/verification.json`, and stops its process. It needs permission to connect to local sockets.
The Codex sandbox required elevated socket access for that check. Ordinary local PowerShell does not
use that sandbox. Latest verification: **118 passed, 0 failed**, plus successful live HTTP checks.

## Modules and API

- `backend/models.py`, `validation.py`, `errors.py`: immutable packets, numeric bounds and request validation.
- `backend/scheduling/`: independent FCFS, Priority and Aging selectors; shared event engine and metrics.
- `backend/scenarios.py`: five fresh predefined workloads.
- `backend/app.py`: Flask app factory and consistent JSON API/errors.
- `tests/`: model, engine, metrics, event, scenario and API tests.
- `scripts/verify_backend.py`: reproducible live demonstration and manual calculation.

| Endpoint | Behavior |
|---|---|
| `GET /api/health` | Service status and version |
| `GET /api/scenarios` | Scenario names, descriptions, packet definitions and aging interval |
| `POST /api/simulate` | One or several policies on the same validated workload |

See [API contract](docs/api.md), [architecture and semantics](docs/architecture.md),
[verified demonstrations](docs/demonstrations.md), [project state](PROJECT_STATE.md), and [PRD](PRD.md).

## Limits

This simulates scheduling, not real network traffic or measured QoS. It models one non-preemptive output
link with an unbounded waiting queue, no loss, no routing, no protocol overhead and no real bandwidth.
Requests support 1–500 packets, three priorities, at most six fractional decimal places and input
times up to 1,000,000 ms. Empty workloads are explicitly rejected. Throughput is packets/ms;
utilization is a fraction from 0 to 1, measured from t=0. Aging reduces starvation risk without a general
bounded-wait guarantee. No frontend, database, cloud service or extra scheduling policy is included.
