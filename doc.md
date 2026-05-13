# PythiaEye — Intelligent Alert Diagnosis

## Stack Completo

### Servidor Central (máquina local — Docker)

| Componente | Imagem | Função |
|---|---|---|
| VictoriaMetrics | `victoriametrics/victoria-metrics:latest` | Métricas centralizadas (10x menos RAM que Prometheus, compressão superior, remote write nativo) |
| Loki | `grafana/loki:latest` | Logs centralizados |
| Grafana | `grafana/grafana:latest` | Dashboard + alertas |
| Alertmanager | `prom/alertmanager:latest` | Roteamento de alertas |
| Nginx + Certbot | `nginx:latest` + `certbot/certbot` | Reverse proxy com SSL/TLS para todas as rotas (Grafana, Loki, API) |
| FastAPI + Análise | **Custom Python** | Anomalias + ponte com LLM |
| Ollama | `ollama/ollama:latest` | LLM local (grátis, fallback primário) |
| PostgreSQL | `postgres:16-alpine` | Baseline histórica + metadados + silent mode |

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
                              │  │  ├── baselines por métrica/VPS  │ │
                              │  │  ├── alertas silent mode        │ │
                              │  │  ├── feedback do usuário        │ │
                              │  │  └── runbooks de mitigação      │ │
                              │  └────────────────────────────────┘ │
                              └──────────────────────────────────────┘
```

Fluxo dos dados:
- Métricas: Netdata + PingExporter → VictoriaMetrics (scrape)
- Logs: Promtail → Loki
- Alertas: VictoriaMetrics → Alertmanager → Python API
- Análise: Python → Ollama (try, timeout 5s) → Groq fallback (catch) → Slack

---

## Filosofia de Alertas — Conservador nas Notificações, Verboso na Análise

Um sistema que "pega tudo" cria fadiga de alertas. Em ambientes de equipe enxuta (como administração pública), 50 notificações/dia viram ruído de fundo em uma semana.

**Regra de ouro:**
- **Dashboard**: verboso — mostre tudo (métricas cruas, sazonalidade, resíduos, topologia)
- **Notificações**: conservadoras — só notifique quando a confiança for >95%

A métrica de sucesso do produto não é "quantos alertas detectamos", mas sim **Taxa de Relevância**:
```
Relevância = AlertasConfirmados / AlertasNotificados
```
Se o sistema avisar que o servidor vai cair e ele cair → cliente fiel. Se avisar 10x e nada acontecer → autoridade perdida.

---

## Confidence Score — O Modelo Probabilístico

Em vez de decidir entre "alerta" ou "silêncio", o sistema atribui uma pontuação de confiança contínua (0-100%) à anomalia.

### Fórmula

```
Confiança(%) = min(100, max(0,
    (Anomalia_atual - Média_sazonal) / (DesvioPadrão × FatorDeRisco)
)) × 100
```

Onde:
- `Anomalia_atual` = valor observado da métrica
- `Média_sazonal` = média esperada para aquela hora/dia (da baseline seasonal decompose)
- `DesvioPadrão` = stddev histórico para aquele período
- `FatorDeRisco` = peso configurável por métrica (ex: CPU=1.5, MEM=1.0, DISK=0.8)

### Três Faixas de Ação

| Confiança | Classificação | Ação | Canal |
|---|---|---|---|
| >95% | **Crítico** | Notificação push com som + diagnóstico LLM | Slack/Discord + SMS (se configurado) |
| 70-90% | **Preditivo** | Aparece no feed "Sugestões de Otimização" do dashboard | Dashboard apenas |
| <70% | **Silencioso** | Registra no banco para alimentar modelo | Nenhum |

### Implementação no Código

```python
def calcular_confianca(metrica_atual, baseline, metric_config):
    desvio = abs(metrica_atual - baseline['media_sazonal'])
    score = desvio / (baseline['stddev'] * metric_config['fator_risco'])
    confianca = min(100, max(0, score * 100))

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
  ├── Já tem 3+ ciclos de baseline? → Notifica push + LLM + Slack
  └── Menos de 3 ciclos? → Registra no banco (SILENCIOSO)

Confiança 70-90% (PREDITIVO)
  ├── Aparece no feed "Sugestões de Otimização" do dashboard
  └── NUNCA notifica push

Confiança < 70% (SILENCIOSO)
  └── Apenas registra no PostgreSQL para calibrar modelo futuro
```

21. **Entregável**: alertas silenciam em horários sabidamente altos (ex: quarta 14h). Falsos positivos <5%. Zero falso positivo crítico (Confiança >95%) após Grace Period.

### Fase 4 — LLM Bridge (Dia 15-17)

22. Subir Ollama + baixar modelo: `ollama pull mistral:7b` (~4.1GB)
23. Implementar `python/llm_bridge.py` com fallback:

```python
async def diagnosticar(alerta):
    try:
        result = await call_ollama(prompt, timeout=5.0)
        return result
    except (TimeoutError, ConnectionError):
        try:
            result = await call_groq(prompt, model="mixtral-8x7b-32768")
            return result
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

Responda EXATAMENTE neste formato:
CAUSA_PROVAVEL: <1 linha>
COMANDO_MITIGACAO: <comando shell que resolve>
GRAVIDADE: <baixa/media/alta>
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
| Holt-Winters para CPU | CPU tem sazonalidade clara (hora do dia, dia da semana) + tendência. HW captura ambos. |
| EWMA para latência | Latência varia rápido; EWMA dá peso exponencial a observações recentes, reagindo rápido a mudanças sem ser ruidoso. |
| Média Móvel para memória/disco | Métricas monotônicas (crescem, não oscilam). Média móvel detecta deriva. |
| Seasonal Decompose para conexões TCP | Conexões seguem padrão sazonal forte. Decompose separa padrão de anomalia. |

### Cold Start

- Sem dados históricos? Silent Mode por 7 dias.
- Baseline é calculada com `statsmodels.tsa.seasonal_decompose` com `period=24h` e `period=168h` (semanal).
- Após 7 dias: relatório de calibração com top-N anomalias para feedback humano.
- Feedback ajusta os coeficientes dos modelos (bayesian update simples no PostgreSQL).

### Fórmulas dos Thresholds

#### Threshold por Métrica (gatilho da anomalia)

```
CPU:  P95(30min) > media_historica_P95 + 0.5 * stddev_historico_P95
MEM:  |mem_atual - mem_5min_atras| / mem_5min_atras > 0.05  (5%/h)
DISK: |disk_atual - disk_24h_atras| / disk_24h_atras > 0.10  (10%/dia)
LAT:  lat_atual > 3 * median(lat_ultimas_24h)
TCP:  residuo_decompose > 4 * stddev(residuo)
```

#### Confidence Score (pós-anomalia, decide a ação)

```
desvio = |metrica_atual - media_sazonal|
confianca = min(100, desvio / (stddev_sazonal × fator_risco) × 100)

Ação:
  confianca >= 95 → CRÍTICO  → notifica
  confianca >= 70 → PREDITIVO → dashboard
  confianca < 70  → SILENCIOSO → banco
```

#### Grace Period (segurança contra cold start)

```
Se n_ciclos_anteriores < 3:
    notificacao = False  # ainda aprendendo o padrão
    nivel = SILENCIOSO   # registra mas não incomoda
```

---

## Segurança

| Camada | Implementação |
|---|---|
| Transporte | Nginx termina SSL/TLS (Let's Encrypt). Todas as rotas em HTTPS. |
| Autenticação | Grafana com autenticação integrada. Loki e API protegidos por proxy basic auth. |
| Rate Limit | Nginx limita 100 req/min por IP no /api. |
| Isolamento | Rede Docker interna (bridge). Nginx é única porta exposta (443). |
| Logs sanitizados | LLM bridge remove IPs, tokens, dados de cliente antes de enviar ao Ollama/Groq. |

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
