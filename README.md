# PythiaEye 🔮

**The Oracle for your Infrastructure**

---

## 🇺🇸 English

### What is it

PythiaEye is an AI-augmented infrastructure monitoring pipeline. It detects server anomalies via robust statistics (Z-Score MAD), enriches them with LLM diagnosis (Ollama → Groq fallback), and notifies Slack only when confidence > 95%.

### Architecture (Design Review — May 2026)

The following decisions were converged after a critical review of the PostgreSQL schema and async worker design:

| Decision | Rationale |
|----------|-----------|
| **`alert_queue` without partitioning** | 2-10 VPS → volume too low for partition overhead. Simple table + partial index suffices. |
| **`fingerprint`-based dedup** | `(vps_id, fingerprint) WHERE status IN ('pending','processing')` — allows re-insertion after alert completes (same fingerprint tomorrow = new incident). |
| **`confidence_score NUMERIC(5,2)`** | Preserves decimal precision (95.7% vs 95.0%). INT would truncate and cause false notifications at threshold boundary. |
| **`retry_count` + `next_retry_at`** | Worker retries with exponential backoff (5min, 10min, 15min). Alert survives Ollama timeout instead of dying as `failed`. |
| **`mitigation_playbooks` table** | LLM never generates raw shell commands. Returns `playbook_id` (FK) + sanitized args. Prevents command injection. |
| **`incident_logs` with `ON DELETE SET NULL`** | Housekeeping deletes old alerts but preserves audit trail. Diagnosis survives cleanup. |
| **Two indexes** | `idx_alert_queue_dedup_active` (unique partial for inserts) + `idx_alert_queue_worker_lookup` (composite for `FOR UPDATE SKIP LOCKED` sort by confidence). |

### Current status

- ✅ PostgreSQL schema finalized (4 tables)
- ✅ Async worker retry/backoff designed
- ✅ Playbook safety model defined
- ❌ No code written yet — pure specification

### Commit convention

All commits are in English.

---

## 🇧🇷 Português

### O que é

PythiaEye é um pipeline de monitoramento de infraestrutura com aumento por IA. Detecta anomalias via estatística robusta (Z-Score MAD), enriquece com diagnóstico de LLM (Ollama → fallback Groq) e notifica no Slack apenas quando a confiança > 95%.

### Arquitetura (Revisão de Design — Maio 2026)

As seguintes decisões foram convergidas após revisão crítica do schema PostgreSQL e do design do worker assíncrono:

| Decisão | Justificativa |
|---------|---------------|
| **`alert_queue` sem particionamento** | 2-10 VPSs → volume baixo. Tabela simples + índice parcial resolve. |
| **Dedup por `fingerprint`** | `(vps_id, fingerprint) WHERE status IN ('pending','processing')` — permite re-inserir o mesmo alerta amanhã (já completou, índice ignora). |
| **`confidence_score NUMERIC(5,2)`** | Preserva precisão decimal (95.7% vs 95.0%). INT truncaria e causaria notificações falsas no limiar. |
| **`retry_count` + `next_retry_at`** | Worker retenta com backoff exponencial (5min, 10min, 15min). Alerta sobrevive a timeout do Ollama. |
| **Tabela `mitigation_playbooks`** | LLM nunca gera comandos shell brutos. Retorna `playbook_id` (FK) + args sanitizados. Previne command injection. |
| **`incident_logs` com `ON DELETE SET NULL`** | Housekeeping deleta alertas velhos mas preserva auditoria. Diagnóstico sobrevive ao cleanup. |
| **Dois índices** | `idx_alert_queue_dedup_active` (unique partial para inserts) + `idx_alert_queue_worker_lookup` (composto para `FOR UPDATE SKIP LOCKED` ordenado por confiança). |

### Estado atual

- ✅ Schema PostgreSQL finalizado (4 tabelas)
- ✅ Retry/backoff do worker assíncrono projetado
- ✅ Modelo de segurança por playbooks definido
- ❌ Nenhum código escrito ainda — apenas especificação

### Convenção de commits

Todos os commits são em inglês.

---

## Files

| File | Description |
|------|-------------|
| [`doc.md`](doc.md) | Blueprint de arquitetura original (português) — gitignored |
| [`SPEC.md`](SPEC.md) | Technical specification — 24 tasks, 12 invariants, validation checklist — gitignored |
