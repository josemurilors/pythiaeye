# PythiaEye — Diagnóstico Inteligente de Alertas

## Stack

### Servidor Central (Docker)

| Componente | Imagem | Função |
|---|---|---|
| VictoriaMetrics | `victoriametrics/victoria-metrics:latest` | Métricas centralizadas (RAM ↓10× vs Prometheus, remote write) |
| Loki | `grafana/loki:latest` | Logs centralizados |
| Grafana | `grafana/grafana:latest` | Dashboard + alertas |
| Alertmanager | `prom/alertmanager:latest` | Roteamento de alertas |
| Nginx + Certbot | `nginx:latest` + `certbot/certbot` | Reverse proxy SSL/TLS (Grafana, Loki, API) |
| FastAPI + Análise | **Custom Python** | Anomalias + ponte LLM |
| Ollama | `ollama/ollama:latest` | LLM local (grátis, fallback primário) |
| PostgreSQL | `postgres:16-alpine` | Baseline + metadados + silent mode |

### Cada VPS (2-3 servidores remotos)

| Componente | Imagem | Função |
|---|---|---|
| Netdata | `netdata/netdata:latest` | Métricas do sistema + Docker (CPU por processo, memória, rede, disco) |
| Promtail | `grafana/promtail:latest` | Envia logs para o Loki central |
| Ping Exporter | `justwatch/ping_exporter:latest` | Monitora latência entre VPSs e servidor central |
| Docker | sistema | Runtime dos agentes |

### APIs Externas (fallback)

| Serviço | Custo | Função |
|---|---|---|
| Groq API | Gratuito ($0.27/1M tokens no mixtral-8x7b) | Fallback rápido se Ollama local timeout |
| Slack / Discord Webhook | Gratuito | Notificação do diagnóstico |

---

## Arquitetura

```
VPS 1                          SERVIDOR CENTRAL
┌──────────────┐              ┌──────────────────────────────────────┐
│ Netdata      │──metrics──>  │ VictoriaMetrics                     │
│ (sistema)    │              │ (scrape + remote write, retenção     │
│ PingExporter │──latency──>  │  configurável por cliente)           │
│ Promtail     │──logs──────> │                                      │
└──────────────┘              │  Loki                                │
                              │                                      │
VPS 2 (idem) ────────────────>│  ┌────────────────────────────────┐ │
                              │  │  Nginx (SSL + auth + rate limit)│ │
VPS 3 (idem) ────────────────>│  │  ├── /grafana                  │ │
                              │  │  ├── /loki                     │ │
                              │  │  ├── /api (FastAPI)            │ │
                              │  │  └── /metrics (VictoriaMetrics)│ │
                              │  └────────────────────────────────┘ │
                              │                                      │
                              │  ┌────────────────────────────────┐ │
                              │  │ Python (FastAPI)                │ │
                              │  │  ├── Silent Mode (primeiros 7d)│ │
                              │  │  ├── Seasonal Decompose         │ │
                              │  │  ├── Confidence Score (0-100%)  │ │
                              │  │  ├── Per-Metric Policies        │ │
                              │  │  │  (CPU=P95, Mem=taxa_var,     │ │
                              │  │  │   Disk=crescimento,           │ │
                              │  │  │   Lat=EWMA, TCP=decompose)    │ │
                              │  │  ├── Grace Period (3 ciclos)    │ │
                              │  │  └── LLM Bridge c/ fallback     │ │
                              │  └────────┬───────────────────────┘ │
                              │           │                          │
                              │  ┌────────┴──────────┐              │
                              │  │ Ollama (Mistral 7B)│              │
                              │  │ timeout: 5s        │──fallback──> │ Groq API
                              │  │ (se timeout/offline)│ (mixtral)   │
                              │  └───────────────────┘              │
                              │                                      │
                              │  ┌────────────────────────────────┐ │
                              │  │ PostgreSQL                      │ │
                              │  │  ├── metric_baselines (sazonal) │ │
                              │  │  ├── alert_queue (c/ fingerpr.) │ │
                              │  │  ├── mitigation_playbooks       │ │
                              │  │  └── incident_logs (auditoria)  │ │
                              │  └────────────────────────────────┘ │
                              └──────────────────────────────────────┘
```

Fluxo dos dados:
- Métricas: Netdata + PingExporter → VictoriaMetrics (scrape)
- Logs: Promtail → Loki
- Alertas: VictoriaMetrics → Alertmanager → Python API
- Análise: Python → Ollama (try, timeout 5s) → Groq fallback (catch) → Slack

---

## Filosofia de Alertas — Notificação Conservadora, Análise Verbosa

Sistema "pega tudo" → fadiga. Equipe enxuta → 50 notifs/dia = ruído em 1 semana.

**Regra:**
- **Dashboard**: verboso — métricas cruas, sazonalidade, resíduos, topologia
- **Notificações**: só se confiança > 95%

**Métrica de sucesso** = Taxa de Relevância:
```
Relevância = AlertasConfirmados / AlertasNotificados
```
Servidor caiu e sistema avisou → confiança. Falso alarme 10× → autoridade perdida.

---

## Confidence Score — Modelo Probabilístico

Sistema atribui confiança contínua (0-100%) à anomalia — não decisão binária alerta/silêncio.

### Fórmula

```
Confiança(%) = min(100, max(0,
    (Anomalia_atual - Média_sazonal) / (DesvioPadrão × FatorDeRisco)
)) × 100
```

Onde:
- `Anomalia_atual` = valor observado
- `Média_sazonal` = média esperada p/ hora/dia (baseline)
- `DesvioPadrão` = stddev histórico p/ período
- `FatorDeRisco` = peso configurável por métrica (ex: CPU=1.5, MEM=1.0, DISK=0.8)

### Três Faixas

| Confiança | Classificação | Ação | Canal |
|---|---|---|---|
| >95% | Crítico | Push + som + diagnóstico LLM | Slack/Discord (+SMS ?) |
| 70-90% | Preditivo | Feed "Sugestões de Otimização" | Dashboard |
| <70% | Silencioso | Registra no banco | Nenhum |

### Implementação no Código

```python
def calcular_confianca(metrica_atual, baseline, metric_config):
    desvio = abs(metrica_atual - baseline['media_sazonal'])
    score = desvio / (baseline['stddev'] * metric_config['fator_risco'])
    confianca = round(min(100, max(0, score * 100)), 2)  # NUMERIC(5,2)

    if confianca >= 95:
        return 'CRITICO', confianca
    elif confianca >= 70:
        return 'PREDITIVO', confianca
    else:
        return 'SILENCIOSO', confianca
```

### Decisor de Notificação

```python
def decidir_notificacao(anomalia, ciclos_anteriores=3):
    """Só notifica se tiver 3+ ciclos anteriores de comparação."""
    if len(ciclos_anteriores) < 3:
        return False  # Grace Period — ainda aprendendo
    if anomalia['confianca'] >= 95:
        return True   # Crítico → notifica
    return False       # Preditivo/Silencioso → só dashboard
```

---

## Código Customizado

| Arquivo | O que faz | ~Linhas |
|---|---|---|
| `central/docker-compose.yml` | Orquestra todos os containers do servidor central | 140 |
| `agent/docker-compose.yml` | Docker Compose para instalar em cada VPS | 50 |
| `agent/install.sh` | Script curl único de instalação nas VPSs | 60 |
| `nginx/default.conf` | Reverse proxy SSL para Grafana, Loki, API | 40 |
| `nginx/Dockerfile` | Nginx com Certbot embutido | 15 |
| `terraform/main.tf` | Provider + servidor central na nuvem (AWS/DigitalOcean) | 80 |
| `terraform/variables.tf` | Chaves SSH, região, tamanho da VPS | 20 |
| `terraform/security_groups.tf` | Firewall: só portas 443 e 22 | 25 |
| `terraform/outputs.tf` | IP público gerado | 10 |
| `terraform/scripts/setup.sh` | Instala Docker + compose no boot | 20 |
| `testes/stress_cpu.sh` | stress-ng --cpu 4 --timeout 120s | 10 |
| `testes/stress_mem.sh` | stress-ng --vm 2 --vm-bytes 512M | 10 |
| `testes/README.md` | Como simular incidente e ver a IA reagir | 30 |
| `python/app.py` | FastAPI: webhook do Alertmanager + orquestrador | 100 |
| `python/seasonal_baseline.py` | Consulta VictoriaMetrics, calcula sazonalidade (statsmodels), salva no PostgreSQL | 120 |
| `python/anomaly_detector.py` | Per-Metric Policies + **Confidence Score** (0-100%): CPU=P95, Mem=taxa_var, Disk=crescimento, Lat=EWMA, TCP=decompose | 140 |
| `python/confidence_score.py` | Cálculo do Confidence Score, decisor de notificação, Grace Period (3 ciclos mínimos) | 60 |
| `python/silent_mode.py` | Modo de aprendizado de 7 dias: registra alertas sem notificar, gera relatório de calibração | 80 |
| `python/llm_bridge.py` | Tenta Ollama (timeout 5s) → fallback Groq → retorna diagnóstico + comando | 90 |
| `python/slack_notifier.py` | Envia diagnóstico formatado para Slack/Discord | 30 |
| `victoriametrics/prometheus.yml` | Config: scrape jobs, regras de alerta | 40 |
| `victoriametrics/alerts.yml` | Regras de alerta com labels para enriquecimento | 35 |
| `alertmanager/config.yml` | Roteamento: alerta → webhook Python | 20 |
| `grafana/dashboards/` | Dashboards JSON exportáveis (CPU, memória, logs, latência, status) | opcional |

**Total estimado: ~1100 linhas de código customizado.**

---

## Passo a Passo

### Fase 1 — Fundação Docker (Dia 1-2)

1. Criar `central/docker-compose.yml` com VictoriaMetrics + Loki + Grafana + PostgreSQL + Nginx
2. Configurar `nginx/default.conf`: rotas /grafana, /loki, /api com SSL
3. Gerar certificados auto-assinados (dev) ou Let's Encrypt (prod)
4. Configurar `victoriametrics/prometheus.yml`: targets Netdata de cada VPS
5. Subir tudo, confirmar que métricas chegam no Grafana
6. **Entregável**: Grafana via HTTPS mostrando CPU/RAM/disco/latência das 3 VPSs

### Fase 2 — Coleta nas VPSs (Dia 3-4)

7. Escrever `agent/install.sh`: curl único que baixa e sobe Netdata + Promtail + PingExporter
8. Configurar Promtail em cada VPS para apontar para Loki central (push via Nginx)
9. **Teste**: rodar `curl -L https://seu-site/install.sh | bash` numa VPS de teste
10. **Entregável**: logs + latência de todas as VPSs aparecendo no Grafana

### Fase 3 — Baseline + Anomalias (Dia 5-14) ⚠️ Crítica

#### 3a — Silent Mode (Dias 1-7 de coleta)

11. Implementar `python/silent_mode.py`:
    - Coleta todas as métricas a cada 5 min
    - Aplica modelos estatísticos provisórios (baseline inicial ingênua)
    - Registra alertas "fantasmas" no PostgreSQL com flag `silent=true`
    - **Não notifica ninguém**

12. Implementar `python/seasonal_baseline.py`:
    - Query no VictoriaMetrics por hora/dia/semana
    - `statsmodels.tsa.seasonal_decompose` (aditivo para CPU/memória, multiplicativo para taxas)
    - Salva baseline no PostgreSQL (média, stddev, P95, P99 por hora/dia/semana/VPS)

#### 3b — Calibração (Dia 8)

13. Implementar `python/anomaly_detector.py` com Per-Metric Policies + Confidence Score:

| Métrica | Modelo | Threshold | FatorRisco | Confiança >95% | Fundamento |
|---|---|---|---|---|---|
| CPU (%) | Holt-Winters (seasonal+trend) | P95 da janela móvel 30min | 1.5 | Desvio > 4.5x stddev | CPU é ruidosa; fator alto evita falso positivo |
| Memória (%) | Média Móvel (15min) | Taxa de variação >5%/h | 1.0 | Variação >5%/h sustentada | Memória estável; fator neutro |
| Disco (%) | Média Móvel (1h) | Taxa de crescimento >10%/dia | 0.8 | Crescimento >8%/dia | Disco crítico; fator baixo pega cedo |
| Latência rede | EWMA (exponencial) | >3x mediana histórica | 1.2 | >4.8x mediana | Pico de latência pode ser roteamento; fator médio |
| Conexões TCP | Seasonal Decompose | Resíduo > 4*stddev | 1.0 | Resíduo > 5*stddev | Sazonal forte; fator neutro |
| I/O disco | Média Móvel (5min) | >2x stddev da janela | 1.3 | >3.3x stddev | I/O burst é comum; fator alto filtra ruído |

14. Gerar relatório de calibração: "Identifiquei estes 10 comportamentos estranhos. Quais são normais?"
15. Usuário marca falsos positivos → modelo ajusta threshold (feedback loop no PostgreSQL)

#### 3c — Grace Period (Dia 9-21)

16. Silent Mode desligado. Thresholds dinâmicos + Confidence Score ativos.
17. **Grace Period**: sistema só notifica após cruzar com **3 ciclos anteriores de mesma natureza** (ex: comparar esta quarta com as 3 quartas anteriores).
18. Se não houver 3 ciclos → anomalia vai para `SILENCIOSO` (alimenta baseline, não notifica).

#### 3d — Ativo (Dia 22+)

19. Grace Period concluído. Sistema notifica normalmente.
20. Decision tree de notificação:

```
Confiança > 95% (CRÍTICO)
  ├── 3+ ciclos baseline? → Notifica push + LLM + Slack
  └── <3 ciclos? → Registra (SILENCIOSO)

Confiança 70-90% (PREDITIVO)
  ├── Feed "Sugestões de Otimização" no dashboard
  └── ! notifica push

Confiança < 70% (SILENCIOSO)
  └── Registra no PostgreSQL → calibra modelo futuro
```

21. **Entregável**: alertas silenciam em horários sabidamente altos (ex: quarta 14h). Falsos positivos <5%. Zero falso positivo crítico (Confiança >95%) após Grace Period.

### Fase 4 — LLM Bridge (Dia 15-17)

22. Subir Ollama + baixar modelo: `ollama pull mistral:7b` (~4.1GB)
23. Implementar `python/llm_bridge.py` com fallback:

```python
async def diagnosticar(alerta):
    for attempt in range(3):
        try:
            return await call_ollama(prompt, timeout=30.0)
        except (TimeoutError, ConnectionError) as e:
            if attempt < 2:
                wait = 5 * (attempt + 1)  # backoff: 5min, 10min
                await reenfileirar(alerta.id, wait, str(e))
                return None
            try:
                return await call_groq(prompt, model="mixtral-8x7b-32768")
            except:
                return {"erro": "LLM indisponivel", "alerta_cru": alerta}
```

24. Prompt template para o LLM:

```
Sistema: Voce e um analista DevOps senior. Analise os logs e metricas abaixo.
Contexto: VPS={{ vps }}, servico={{ servico }}, metrica={{ metrica }}, valor={{ valor }}
Confianca: {{ confianca }}% ({{ classificacao }})
Logs dos ultimos 5 minutos:
{{ logs_erro }}

Responda EXATAMENTE neste formato JSON:
{"causa_provavel": "<1 linha>", "playbook_id": <int>, "playbook_args": ["<arg1>", ...], "gravidade": "<baixa|media|alta>", "confianca": <0.0-1.0>, "rationale": "<breve explicacao>"}
```

25. Implementar `slack_notifier.py`: posta diagnóstico formatado no Slack/Discord
26. **Entregável**: alerta chega no Slack em <10s (Ollama) ou <3s (Groq) com causa + comando

### Fase 5 — IaC + Testes (Dia 18-20)

27. Criar `terraform/` para provisionar VPS do servidor central automaticamente
28. Criar `testes/` com scripts stress-ng para simular incidentes
29. Documentar no `testes/README.md`: passo a passo de "como testar a IA"
30. Testar ciclo completo: stress-ng → anomalia → Grace Period → CRÍTICO → LLM → Slack
31. **Entregável**: `terraform apply` sobe infra completa; stress-ng gera alerta com diagnóstico

---

## Calibração de Modelos

### Decisões de Design

| Decisão | Justificativa |
|---|---|
| Holt-Winters p/ CPU | CPU tem sazonalidade (hora, dia) + tendência. HW captura ambos. |
| EWMA p/ latência | Latência varia rápido; EWMA reage rápido sem ruído. |
| Média Móvel p/ memória/disco | Métricas monotônicas (crescem, não oscilam). MM detecta deriva. |
| Seasonal Decompose p/ conexões TCP | Conexões seguem sazonalidade forte. Decompose separa padrão de anomalia. |

### Cold Start

- Sem dados históricos? Silent Mode 7d.
- Baseline via `statsmodels.tsa.seasonal_decompose` c/ `period=24h` + `period=168h` (semanal).
- 7d depois: relatório de calibração c/ top-N anomalias → feedback humano.
- Feedback ajusta coeficientes (bayesian update simples no PostgreSQL).

### Thresholds

#### Threshold por Métrica (gatilho)

```
CPU:  P95(30min) > media_P95_hist + 0.5 * stddev_P95_hist
MEM:  |atual - 5min_atras| / 5min_atras > 0.05  (5%/h)
DISK: |atual - 24h_atras| / 24h_atras > 0.10  (10%/dia)
LAT:  atual > 3 * median(lat_24h)
TCP:  residuo_decompose > 4 * stddev(residuo)
```

#### Confidence Score (pós-anomalia)

```
desvio = |atual - media_sazonal|
confianca = min(100, desvio / (stddev_sazonal × fator_risco) × 100)

Ação:
  ≥95 → CRÍTICO → notifica
  ≥70 → PREDITIVO → dashboard
  <70 → SILENCIOSO → banco
```

#### Grace Period

```
n_ciclos < 3:
    notificacao = False  # aprendendo
    nivel = SILENCIOSO

---

## Segurança

| Camada | Implementação |
|---|---|
| Transporte | Nginx termina SSL/TLS (Let's Encrypt). ∀ rota HTTPS. |
| Autenticação | Grafana auth integrada. Loki + API protegidos via basic auth. |
| Rate Limit | Nginx → 100 req/min/IP em /api. |
| Isolamento | Docker bridge interna. Nginx = única porta exposta (443). |
| Logs sanitizados | LLM bridge remove IPs, tokens, dados cliente antes de enviar. |
| Execução segura | LLM ! gera comandos shell. Retorna `playbook_id` (FK → `mitigation_playbooks`) + args sanitizados. Validação rígida de args antes de exec. |

---

## IaC (Terraform)

```
terraform/
├── main.tf              - provider (DigitalOcean/AWS) + VPS server
├── variables.tf         - chave SSH, região, tamanho (default: 4GB RAM)
├── security_groups.tf   - só portas 443 (HTTPS) e 22 (SSH admin)
├── outputs.tf           - IP público gerado
└── scripts/
    └── setup.sh         - instala Docker + docker-compose + pull images
```

Uso:
```bash
cd terraform
export DO_PAT="seu_token"
terraform init
terraform apply -var="ssh_key=~/.ssh/id_rsa.pub"
# → VPS pronta com Docker + docker-compose + containers baixando
```

---

## Dependências

### Servidor Central
- Docker + Docker Compose
- Python 3.11+
- Git
- Terraform (para IaC)

### Python (pip)
```
fastapi uvicorn prometheus-api-client pandas statsmodels scikit-learn psycopg2-binary httpx groq
```

### Cada VPS
- Docker + Docker Compose
- curl
- Acesso SSH configurado

### Modelo Ollama (local)
| Modelo | Tamanho | Indicação |
|---|---|---|
| `mistral:7b` | ~4.1GB | Equilibrado, rápido em CPU |
| `llama3.1:8b` | ~4.7GB | Melhor qualidade (se tiver RAM) |
| `qwen2.5:7b` | ~4.0GB | Bom para português |

### APIs Externas
- Groq: `https://console.groq.com/keys` (chave gratuita)
- Slack: `https://api.slack.com/messaging/webhooks`
- Ou Discord: webhook no canal

### Testes
- stress-ng (instalar via apt/pacman nas VPSs de teste)

---

## Estimativa de Horas

| Fase | Horas | Complexidade |
|---|---|---|
| Fase 1 — Fundação Docker + Nginx + SSL | 6h | Média |
| Fase 2 — Agentes VPS (Netdata + Promtail + Ping) | 6h | Média |
| Fase 3 — Silent Mode + Confidence Score + Grace Period | 26h | **Alta** |
| Fase 4 — LLM Bridge c/ fallback | 10h | Média |
| Fase 5 — IaC + Testes de Carga | 10h | Média |
| **Total** | **~58h** | |
