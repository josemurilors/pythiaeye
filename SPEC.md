# SPEC.md — PythiaEye: The Oracle for your Infrastructure

## §G — Goal

PythiaEye → detect anomalies via stats, enrich w/ LLM, notify Slack. Zero alert fatigue. Self-monitoring. Oracle for infra.

---

## §C — Constraints

| # | Constraint |
|---|-----------|
| C1 | Server RAM ≤ 16GB (target 8GB, absolute min 4GB w/ external LLM) |
| C2 | VPS count 2-10 hosts |
| C3 | Stack 100% Docker Compose on single central server |
| C4 | LLM fallback chain: Ollama local → Groq API (free tier) |
| C5 | Alert fatigue ! zero — notify only when confidence > 95% |
| C6 | Silent Mode first 7d — system learns before alerting |
| C7 | All routes HTTPS via Nginx reverse proxy |
| C8 | No Redis — PostgreSQL only for queue |
| C9 | No Prophet / statsmodels seasonal_decompose — Z-Score MAD only |
| C10 | Worker pool max 5 concurrent LLM calls |
| C11 | Windows Server VPSs supported (wineventlog via Promtail) |
| C12 | Stateful Terraform — backend remote (S3), never local |

---

## §I — Interfaces

### Exposed

```
api:  POST /webhook/alerts        → 202 {queued,deduplicated}
api:  GET  /health                → 200 {status,queue_size,failures[]}
api:  GET  /metrics               → prometheus text (worker pool, queue depth, llm latency)
gui:  /grafana                    → Grafana UI (auth required)
gui:  /loki                       → Loki API (proxied)
```

### Internal

```
db:   PostgreSQL 16   → alert_queue, metric_baselines, mitigation_playbooks, incident_logs
metrics: VictoriaMetrics → scrape Netdata + PingExporter + health
logs:  Loki           → Promtail push from each VPS
llm:   Ollama (localhost:11434)    → primary, async w/ retry backoff (5/10/15min)
llm:   Groq API (external)        → fallback, rate-limited 3 calls/min
alert: Alertmanager   → POST to /webhook/alerts
notif: Slack webhook  → diagnosis message
```

### Agent-side (per VPS)

```
svc:  Netdata        → metrics to VictoriaMetrics (scrape target)
svc:  Promtail       → logs to Loki (push via Nginx)
svc:  PingExporter   → latency metrics to VictoriaMetrics
cfg:  /etc/netdata/stream.conf → limited to 5 metric families
```

### Terraform

```
infra: DigitalOcean / AWS VPS
  → terraform/main.tf
  → terraform/backend.tf  (S3 remote state)
  → terraform/scripts/setup.sh  (Docker install @boot)
```

---

## §V — Invariants

| ID | Rule |
|----|------|
| V1 | ∀ alert → idempotent via partial UNIQUE index `(vps_id, fingerprint) WHERE status IN ('pending','processing')` |
| V2 | queue depth > 500 → discard alerts w/ confidence < 70% |
| V3 | queue depth > 1000 → bypass LLM, send raw stat alert |
| V4 | worker concurrency ≤ 5 (Semaphore) |
| V5 | Ollama healthcheck = `/api/generate` w/ prompt "hi", timeout 2s, else Groq |
| V6 | min_window=12 for Z-Score MAD (< 1h data → confidence=0) |
| V7 | ∀ completed/failed alerts older than 7d → DELETE (scheduler 02:00 daily) |
| V8 | LLM response ! parse via Pydantic → fallback regex → fallback generic |
| V9 | healthcheck endpoint fails 3x → Alertmanager bypasses Python → direct Slack |
| V10 | Terraform state ! remote (S3) — local state ⊥ |
| V11 | Netdata collector whitelist only: cpu, mem, disk, net, containers |
| V12 | Log enrichment → Loki query last 5min ERROR level → structured summary → LLM prompt |

---

## §T — Tasks

### Notation

Status: `x` done, `~` wip, `.` todo.

### Roadmap — 18 days

| id | status | task | cites | est |
|----|--------|------|-------|-----|
| T1 | . | **Netdata stream.conf** — limit collectors to cpu,mem,disk,net,containers per VPS | C9,V11 | 0.5h |
| T2 | . | **Healthcheck endpoint** — GET /health returns queue depth, worker status, DB ping, Ollama status | V5,V9 | 2h |
| T3 | . | **Docker compose base** — VictoriaMetrics + Loki + Grafana + PostgreSQL + Nginx + Python API | C1,C3,C8 | 4h |
| T4 | . | **PostgreSQL schema** — `alert_queue` c/ fingerprint dedup, `NUMERIC(5,2)` confidence, `mitigation_playbooks`, `incident_logs`, partial indexes | C8,V1,V7 | 2h |
| T5 | . | **Z-Score MAD engine** — np.median + MAD + min_window=12 → confidence 0-100% | C9,V6 | 3h |
| T6 | . | **Alertmanager webhook** — config points to POST /webhook/alerts | I.api | 1h |
| T7 | . | **Agent install.sh** — curl script installs Netdata (stream.conf) + Promtail + PingExporter | I.agent,V11 | 3h |
| T8 | . | **Synthetic baseline** — first 6h → rough MAD baseline + uncertainty decay curve | C6,V6 | 3h |
| T9 | . | **Silent Mode** — 7d learning, records alerts w/ `silent=true`, no push notification | C6 | 3h |
| T10 | . | **PostgreSQL queue enqueue** — FastAPI webhook, idempotent `INSERT ON CONFLICT (vps_id, fingerprint) WHERE pending/processing` | V1,V9 | 2h |
| T11 | . | **Worker pool** — asyncio.Semaphore(5), dequeue via FOR UPDATE SKIP LOCKED | V4 | 4h |
| T12 | . | **Backpressure** — queue >500 discard <70%, >1000 bypass LLM, >2000 TTL 30min | V2,V3 | 2h |
| T13 | . | **Rate limiter** — max 3 LLM calls per 60s window | C4 | 1h |
| T14 | . | **LLM Bridge** — Ollama primary (async, retry 5/10/15min backoff) → Groq fallback, prompt w/ few-shot | V5 | 4h |
| T15 | . | **Pydantic parse** — JSON output validation → regex fallback → generic fallback | V8 | 2h |
| T16 | . | **Ollama inference healthcheck** — /api/generate "hi" every 60s, timeout 2s | V5 | 1h |
| T17 | . | **Log enrichment** — LogProcessor queries Loki last 5min, extracts structured patterns (OOM, timeout, 5xx) | V12 | 3h |
| T18 | . | **Slack notifier** — formats diagnosis, sends webhook | I.notif | 1h |
| T19 | . | **Housekeeping scheduler** — daily DELETE completed/failed alerts >7d, incident_logs >30d | V7 | 1h |
| T20 | . | **Grafana dashboards** — queue depth, worker pool, LLM latency, Ollama status, error rate, DB size | I.gui | 3h |
| T21 | . | **Terraform backend remote** — S3 bucket + DynamoDB lock, backend.tf | V10 | 1h |
| T22 | . | **Terraform resources** — VPS, security groups (443,22), setup.sh | I.infra | 3h |
| T23 | . | **Stress-ng tests** — CPU 4 core, MEM 512MB, simulate incident → verify full pipeline | C2 | 2h |
| T24 | . | **End-to-end smoke test** — inject alert → queue → worker → LLM → Slack, measure <30s | V3,V12 | 2h |

### DAG — task ordering

```
T1,T2   ← Dia 0 (no deps)
T3      ← Dia 1-2 (base infra)
T4,T5   ← Dia 1-2 (dep: T3)
T6      ← Dia 2 (dep: T3)
T7      ← Dia 3-4 (no deps, parallel)
T8,T9   ← Dia 5-7 (dep: T4,T5)
T10     ← Dia 5-7 (dep: T4)
T11     ← Dia 8-12 (dep: T10)
T12,T13 ← Dia 8-12 (dep: T11)
T14     ← Dia 13-15 (dep: T11,T12,T13)
T15,T16 ← Dia 13-15 (dep: T14)
T17     ← Dia 13-15 (dep: T14, needs Loki online)
T18     ← Dia 13-15 (dep: T14)
T19     ← Dia 13-15 (dep: T11)
T20     ← Dia 16-18 (dep: T3)
T21,T22 ← Dia 16-18 (dep: T3)
T23,T24 ← Dia 16-18 (dep: T14,T17,T18)
```

---

## §B — Bug Log

| id | date | cause | fix |
|----|------|-------|-----|
| — | — | — | — |

*(Empty — no bugs recorded yet)*

---

## Appendix A — Key Code Snippets

### Z-Score MAD

```python
def zscore_mad(series, window=24, min_window=12):
    if len(series) < min_window:
        return None
    recent = series[-window:] if len(series) >= window else series
    median = np.median(recent)
    mad = np.median(np.abs(recent - median))
    if mad == 0:
        mad = np.std(recent) / 1.4826
    z = 0.6745 * (series[-1] - median) / mad
    return z if abs(z) > 3.5 else None
```

### Worker Pool c/ Retry Backoff

```python
class WorkerPool:
    def __init__(self, max_concurrent=5, max_retries=3):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.max_retries = max_retries

    async def process(self, alert, fn):
        async with self.semaphore:
            for attempt in range(self.max_retries):
                try:
                    return await fn(alert)
                except (TimeoutError, ConnectionError) as e:
                    if attempt < self.max_retries - 1:
                        wait = 5 * (attempt + 1)  # 5, 10, 15 min
                        await db.execute("""
                            UPDATE alert_queue SET
                                retry_count = retry_count + 1,
                                next_retry_at = NOW() + make_interval(mins => $1),
                                error_message = $2
                            WHERE id = $3
                        """, wait, str(e), alert.id)
                        return None  # re-queued, will be picked up later
                    raise  # exhausted → failed
```

### PostgreSQL Queue Dequeue

```sql
SELECT id, alert_id, vps_id, metric_name, confidence_score
FROM alert_queue
WHERE status = 'pending' AND next_retry_at <= NOW()
ORDER BY confidence_score DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
```

### Schema Final (T4)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE queue_status AS ENUM ('pending','processing','completed','failed');

CREATE TABLE alert_queue (
    id BIGSERIAL PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    vps_id VARCHAR(50) NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status queue_status DEFAULT 'pending',
    confidence_score NUMERIC(5,2) DEFAULT 0.00,
    classification VARCHAR(20),
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Dedup: mesma fingerprint só é única enquanto ativa
CREATE UNIQUE INDEX idx_alert_queue_dedup_active
ON alert_queue (vps_id, fingerprint)
WHERE status IN ('pending', 'processing');

-- Worker: busca pending ordenado por confiança
CREATE INDEX idx_alert_queue_worker_lookup
ON alert_queue (next_retry_at ASC, confidence_score DESC)
WHERE status = 'pending';

CREATE TABLE metric_baselines (
    id SERIAL PRIMARY KEY,
    vps_id VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    day_of_week INT NOT NULL,
    hour_of_day INT NOT NULL,
    media_sazonal DOUBLE PRECISION NOT NULL,
    stddev DOUBLE PRECISION NOT NULL,
    p95 DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_baseline UNIQUE (vps_id, metric_name, day_of_week, hour_of_day)
);

CREATE TABLE mitigation_playbooks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    script_path TEXT NOT NULL,
    allowed_arguments TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_logs (
    id SERIAL PRIMARY KEY,
    alert_queue_id BIGINT REFERENCES alert_queue(id) ON DELETE SET NULL,
    vps_id VARCHAR(50) NOT NULL,
    cause_analysis TEXT NOT NULL,
    suggested_playbook_id INT REFERENCES mitigation_playbooks(id),
    playbook_arguments TEXT[],
    user_feedback BOOLEAN,
    user_comments TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Auto-updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_alert_queue_updated_at
    BEFORE UPDATE ON alert_queue
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### Housekeeping (V7)

```python
async def cleanup_old_alerts():
    async with db.pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM alert_queue
            WHERE created_at < NOW() - INTERVAL '7 days'
              AND status IN ('completed', 'failed')
        """)
        await conn.execute("""
            DELETE FROM incident_logs
            WHERE created_at < NOW() - INTERVAL '30 days'
        """)
```

### Ollama Inference Healthcheck

```python
async def check_ollama():
    payload = {'model': 'mistral:7b', 'prompt': 'hi', 'stream': False, 'options': {'num_predict': 1}}
    async with session.post('http://ollama:11434/api/generate', json=payload, timeout=2) as resp:
        return resp.status == 200
```

### LLM Parse with Playbook Safety

```python
class DiagnosisOutput(BaseModel):
    causa_provavel: str
    playbook_id: int | None       # FK → mitigation_playbooks (não comando raw)
    playbook_args: list[str]      # argumentos sanitizados
    gravidade: str                # baixa|media|alta
    confianca: float
    rationale: str

async def parse_response(text: str) -> DiagnosisOutput:
    try:
        return DiagnosisOutput(**json.loads(clean_json(text)))
    except (json.JSONDecodeError, ValidationError):
        return extract_with_regex(text)
```

### Log Enrichment

```python
class LogProcessor:
    async def get_structured_logs(self, vps_id: str, window="5m"):
        query = f'{{job="promtail", instance="{vps_id}"}} | json | level="ERROR"'
        logs = await self.loki.query_range(query, window)
        return {
            'pattern_oom': sum(1 for l in logs if 'OOM' in l['line']),
            'pattern_timeout': sum(1 for l in logs if 'timeout' in l['line'].lower()),
            'status_5xx': sum(1 for l in logs if 'HTTP 5' in l['line']),
        }
```

---

## Appendix B — Infrastructure

### Docker Compose Services

| Service | Image | Role |
|---------|-------|------|
| victoriametrics | `victoriametrics/victoria-metrics:latest` | metrics store |
| loki | `grafana/loki:latest` | log store |
| grafana | `grafana/grafana:latest` | dashboards + alerting |
| alertmanager | `prom/alertmanager:latest` | alert routing |
| postgres | `postgres:16-alpine` | alert_queue, baselines, playbooks, audit |
| pythia_api | custom `Dockerfile` | FastAPI + worker pool + LLM bridge |
| ollama | `ollama/ollama:latest` | local LLM (optional, 4-8GB RAM penalty) |

### Terraform State

```hcl
terraform {
  backend "s3" {
    bucket         = "sentinel-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### Alertmanager Routing

```yaml
route:
  receiver: webhook
  group_wait: 10s
  group_interval: 30s
  repeat_interval: 5m

receivers:
  - name: webhook
    webhook_configs:
      - url: http://python-api:8000/webhook/alerts
  - name: slack-critical
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_CRITICAL}
```

---

## Appendix C — Validation Checklist

| # | Check | Pass |
|----|-------|------|
| 1 | Queue INSERT idempotent — same fingerprint → ON CONFLICT handled, different day → new row | ☐ |
| 2 | Backpressure: inject 600 alerts → queue drops <70% confidence | ☐ |
| 3 | Worker pool: max 5 concurrent LLM calls (verify via logs) | ☐ |
| 4 | Ollama timeout → retry_count++ → backoff 5/10/15min → re-queued automatically | ☐ |
| 5 | MAD returns None for series < 12 points → confidence=0 | ☐ |
| 6 | Housekeeping DELETE completed/failed alerts >7d, runs 02:00 daily | ☐ |
| 7 | LLM garbage output → Pydantic error → regex fallback → generic fallback | ☐ |
| 8 | Healthcheck fails → Alertmanager bypasses Python → Slack direct | ☐ |
| 9 | Terraform state remote — run `terraform state list` from 2 machines | ☐ |
| 10 | Netdata collector count ≤ 5 per VPS (verify via `/api/v1/info`) | ☐ |
| 11 | Log enrichment extracts OOM/timeout/5xx from Loki → LLM prompt has structured context | ☐ |
| 12 | LLM returns playbook_id (not raw command) → validated against mitigation_playbooks before exec | ☐ |
| 13 | Full E2E: stress-ng → alert → queue → worker → LLM → Slack in <30s | ☐ |
