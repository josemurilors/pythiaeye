# PythiaEye — The Oracle for your Infrastructure

**Intelligent Alert Diagnosis** — AI-powered anomaly detection for lean DevOps teams.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

---

## The Problem

Alert fatigue kills engineering teams. In lean environments (startups, public administration, SMBs), 50 notifications/day become background noise in a week. False positives erode trust. When a real incident hits, nobody believes the alert.

**PythiaEye solves this** — it detects anomalies with statistical rigor, enriches diagnosis with a local LLM, and notifies **only when confidence exceeds 95%**.

---

## How It Works

```
VPS 1                       CENTRAL SERVER
┌──────────────┐           ┌──────────────────────────────────────────┐
│ Netdata      │─metrics──>│ VictoriaMetrics (10x less RAM vs Prom)   │
│ PingExporter │─latency──>│ Loki (logs)                              │
│ Promtail     │─logs─────>│ Grafana (dashboards + alerts)            │
└──────────────┘           │ PostgreSQL 16 (queue + baselines)        │
                           │ FastAPI (anomaly engine + worker pool)   │
VPS 2 (idem) ─────────────>│ Ollama (local LLM, fallback → Groq API) │
                           │ Nginx (SSL reverse proxy, rate limit)    │
VPS 3 (idem) ─────────────>│ Slack / Discord (notifications)          │
                           └──────────────────────────────────────────┘
```

**Data flow:**
1. Metrics → Netdata + PingExporter → VictoriaMetrics
2. Logs → Promtail → Loki
3. Anomalies → VictoriaMetrics → Alertmanager → Python webhook
4. Diagnosis → Ollama (try, 5s timeout) → Groq fallback → Slack

---

## Key Features

### 🔮 Intelligent Alerting
- **Confidence Score (0-100%)** — continuous, not binary. Only notifies when >95%
- **3-tier classification**: Critical (>95% push), Predictive (70-95% dashboard), Silent (<70% learn)
- **Grace Period** — requires 3+ comparison cycles before first notification (no cold-start false positives)

### 🧠 Production-Grade Architecture
- **PostgreSQL transaction queue** — `FOR UPDATE SKIP LOCKED`, no Redis overhead
- **Worker pool** — `asyncio.Semaphore(5)`, concurrent LLM calls with timeout
- **Backpressure** — dynamic discard policies: queue >500 drops <70% confidence, >1000 bypasses LLM
- **Database health** — daily TRUNCATE on partitions older than 7d, auto-create 30d future partitions

### 🤖 LLM Bridge with Resilience
- **Primary**: Ollama local (Mistral 7B, Llama 3.1 8B, or Qwen 2.5 7B)
- **Fallback**: Groq API (free tier, Mixtral 8x7B)
- **Healthcheck**: probes `/api/generate` with a real inference every 60s — deadlock detection, not just process ping
- **Safe parsing**: Pydantic validation → regex fallback → generic fallback (never crashes on malformed LLM output)

### 📊 Observability Built-in
- Self-monitoring healthcheck endpoint (`GET /health`)
- Grafana dashboards for queue depth, worker pool, LLM latency, database size
- Loki log enrichment — structured error patterns (OOM, timeout, 5xx) injected into LLM prompt
- Alertmanager bypass: if PythiaEye pipeline fails, direct Slack alert fires

### 🌟 Silent Mode (7-day Learning)
New deployments get 7 days of silent learning — PythiaEye observes, builds baselines, calibrates thresholds. After 7 days, it generates a calibration report: *"I found these 10 strange behaviors. Which are normal?"* Then it starts alerting with zero false positives.

---

## Stack

### Central Server (Docker Compose)

| Component | Image | Role |
|-----------|-------|------|
| VictoriaMetrics | `victoriametrics/victoria-metrics:latest` | Metrics store (10x less RAM than Prometheus) |
| Loki | `grafana/loki:latest` | Log aggregation |
| Grafana | `grafana/grafana:latest` | Dashboards + alerting |
| Alertmanager | `prom/alertmanager:latest` | Alert routing to webhook |
| Nginx + Certbot | `nginx:latest` | SSL reverse proxy |
| PostgreSQL | `postgres:16-alpine` | Queue + baselines + metadata |
| Ollama | `ollama/ollama:latest` | Local LLM (optional) |
| Python API | Custom FastAPI | Anomaly engine + worker + LLM bridge |

### Per VPS Agent

| Component | Image | Role |
|-----------|-------|------|
| Netdata | `netdata/netdata:latest` | System metrics (limited to 5 collector families) |
| Promtail | `grafana/promtail:latest` | Ship logs to Loki |
| PingExporter | `justwatch/ping_exporter:latest` | Inter-VPS latency |

### External APIs

| Service | Cost | Role |
|---------|------|------|
| Groq API | Free ($0.27/1M tokens) | LLM fallback when Ollama times out |
| Slack / Discord | Free | Notification channel |

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **PostgreSQL queue (not Redis)** | Already in stack, ACID transactions, `FOR UPDATE SKIP LOCKED` — eliminates a SPOF and 150MB RAM overhead |
| **Z-Score MAD (not Prophet/statsmodels)** | O(n), zero dependencies, resistant to outliers. Prophet requires pystan (500MB C++ compiler), statsmodels seasonal_decompose is O(n²) and breaks on missing data |
| **Worker pool with Semaphore** | Single-thread LLM calls bottleneck at 5s each. Semaphore(5) enables parallel processing without OOM |
| **Ollama inference healthcheck** | `/api/tags` only proves the process is alive. `/api/generate` with prompt "hi" detects deadlocks |
| **Database partitioning** | `DELETE` in PostgreSQL doesn't free disk space. Daily `TRUNCATE` on partition drops releases storage to OS |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Python 3.11+
- A server with **8GB+ RAM** (or use external LLM only via Groq)
- 2-10 VPSs to monitor

### 1. Central Server

```bash
git clone https://github.com/josemurilors/pythiaeye.git
cd pythiaeye/central
docker compose up -d
```

### 2. Install Agents on Each VPS

```bash
curl -L https://your-server/install.sh | bash
```

### 3. Configure

Set environment variables in `central/.env`:

```env
GROQ_API_KEY=gsk_your_key
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
POSTGRES_PASSWORD=secure_password
```

### 4. Monitor

Open `https://your-server/grafana` — dashboards auto-populate.

---

## Project Structure

```
pythiaeye/
├── central/
│   └── docker-compose.yml       # Central server orchestration
├── agent/
│   ├── docker-compose.yml       # Per-VPS agent stack
│   └── install.sh               # Single-curl agent installer
├── nginx/
│   ├── default.conf             # Reverse proxy config
│   └── Dockerfile               # Nginx + Certbot
├── python/
│   ├── app.py                   # FastAPI webhook + orchestrator
│   ├── anomaly_detector.py      # Z-Score MAD engine
│   ├── confidence_score.py      # Confidence calculation + Grace Period
│   ├── silent_mode.py           # 7-day learning mode
│   ├── llm_bridge.py            # Ollama → Groq fallback
│   ├── llm_prompt.py            # Prompt builder + Pydantic parser
│   ├── worker_pool.py           # Async Semaphore worker pool
│   ├── alert_queue_pg.py        # PostgreSQL queue (FOR UPDATE SKIP LOCKED)
│   ├── alert_backpressure.py    # Queue backpressure + discard policies
│   ├── ollama_healthcheck.py    # Inference healthcheck w/ prompt "hi"
│   ├── log_processor.py         # Loki log enrichment → structured patterns
│   ├── slack_notifier.py        # Formatted Slack/Discord messages
│   ├── db_housekeeping.py       # Partition TRUNCATE + creation cron
│   └── auto_calibrate.py        # Per-metric model auto-selection
├── terraform/
│   ├── main.tf                  # Provider + VPS resource
│   ├── backend.tf               # S3 remote state
│   ├── variables.tf             # SSH key, region, size
│   ├── security_groups.tf       # Firewall (443, 22)
│   ├── outputs.tf               # Public IP
│   └── scripts/setup.sh         # Docker install @boot
├── tests/
│   ├── stress_cpu.sh            # stress-ng CPU test
│   ├── stress_mem.sh            # stress-ng MEM test
│   └── README.md                # How to simulate incidents
├── victoriametrics/
│   ├── prometheus.yml           # Scrape configs + alert rules
│   └── alerts.yml               # Alerting rules with labels
├── alertmanager/
│   └── config.yml               # Route alerts → webhook
├── grafana/
│   └── dashboards/              # JSON dashboard exports
├── SPEC.md                      # Technical specification
├── doc.md                       # Architecture blueprint
└── README.md                    # This file
```

---

## Roadmap (18 Days)

| Phase | Days | Deliverable |
|-------|------|-------------|
| Dia 0 | 0 | Netdata stream.conf (5 metric families) + healthcheck endpoint |
| Dia 1-2 | 2 | Docker compose (Postgres + Grafana + VMetrics) + Z-Score MAD engine |
| Dia 3-4 | 2 | Agent install script (Netdata + Promtail + PingExporter) |
| Dia 5-7 | 3 | Silent Mode + synthetic baseline + Alertmanager webhook queue |
| Dia 8-12 | 5 | Worker pool + backpressure + rate limiter + dedup |
| Dia 13-15 | 3 | LLM Bridge (Ollama + Groq) + Pydantic parse + log enrichment |
| Dia 16-18 | 3 | Terraform remote backend + stress-ng tests + E2E smoke test |

---

## Validation Checklist

- [ ] Queue INSERT idempotent — duplicate alert_id handled
- [ ] Backpressure: 600 alerts → drops <70% confidence alerts
- [ ] Worker pool: max 5 concurrent LLM calls
- [ ] Ollama degraded → Groq fallback within 3s
- [ ] MAD returns None for <12 data points → confidence=0
- [ ] Partition TRUNCATE runs daily at 02:00, disk stable
- [ ] LLM garbage output → Pydantic → regex → generic fallback
- [ ] Healthcheck fails → Alertmanager bypasses → direct Slack
- [ ] Terraform remote state — works from multiple machines
- [ ] Netdata collector count ≤ 5 per VPS
- [ ] Log enrichment injects OOM/timeout/5xx structure into LLM prompt
- [ ] Full E2E: stress-ng → anomaly → queue → worker → LLM → Slack <30s

---

## Contributing

PRs welcome. See [SPEC.md](SPEC.md) for the full specification and task breakdown.

---

## License

MIT

---

*Oracle for your infrastructure. Not another alerting system.* 🔮
