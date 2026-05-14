# PythiaEye 🔮

**The Oracle for your Infrastructure** — *Em desenvolvimento.*

> ⚠️ **Aviso:** Este software ainda não existe. O que está neste repositório é a **especificação técnica** e o **blueprint de arquitetura**. Nenhuma linha de código foi escrita ainda. Pull requests, issues e discussões são bem-vindos — mas não há nada para rodar no momento.

---

## O que será

PythiaEye será um pipeline de detecção de anomalias em servidores com diagnóstico por IA. A ideia é resolver um problema real em times enxutos: fadiga de alertas.

**Como pretende funcionar:**
- Coleta métricas de N VPSs via Netdata e logs via Promtail
- Detecta anomalias com Z-Score robusto (MAD, não Prophet nem statsmodels)
- Envia para uma LLM local (Ollama) que gera diagnóstico e comando de mitigação
- Notifica no Slack **apenas quando a confiança > 95%**
- Fila transactional no PostgreSQL — sem Redis, sem overhead

## Estado atual

O repositório contém dois documentos:

| Arquivo | O que é |
|---------|---------|
| [`SPEC.md`](SPEC.md) | Especificação técnica completa — 24 tarefas, 13 invariantes, 13 checks, schema final |
| [`doc.md`](doc.md) | Blueprint de arquitetura revisado (4 tabelas, retry backoff, playbooks seguros) |

Nada foi implementado. O código em Python, Docker Compose, Terraform, scripts de agente, dashboards — tudo está por fazer.

O design do schema PostgreSQL foi finalizado após revisão crítica:
- `alert_queue` c/ dedup por fingerprint + retry backoff
- `metric_baselines` para sazonalidade (dia + hora)
- `mitigation_playbooks` — ações homologadas (sem shell injection)
- `incident_logs` — auditoria com `ON DELETE SET NULL`

## Para contribuir

- Leia o [`SPEC.md`](SPEC.md) para entender o escopo
- Veja as tasks em §T — todas estão como `.` (todo)
- Abra uma issue ou PR para discutir antes de implementar

---

*Nada de concreto ainda. Só especulação de engenharia.*
