import { useState } from 'react'

const features = [
  {
    icon: <><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></>,
    color: '#F5B041',
    title: 'Z-Score MAD Engine',
    desc: 'Median-based anomaly detection that works on as little as 12 data points. Maps Z-scores [3.5, 10] to confidence [0%, 100%] with zero false positives at the threshold.',
    detail: 'Uses np.median + MAD with min_window=12. The z_to_confidence() formula maps Z=3.5→0%, Z=6.75→50%, Z≥10→100%. Pure NumPy — no Prophet or seasonal decomposition needed.',
  },
  {
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M2 12a10 10 0 0 1 10-10" /><path d="M12 22a10 10 0 0 1-10-10" /><path d="M22 12a10 10 0 0 1-10 10" /><circle cx="12" cy="12" r="4" /></>,
    color: '#FF0066',
    title: 'LLM Diagnosis',
    desc: 'Local Ollama inference with automatic Groq API fallback. Structured Pydantic output, playbook-safe mitigation suggestions — never raw shell commands.',
    detail: 'Timeout configurable via OLLAMA_TIMEOUT (default 60s). Retries with exponential backoff at 5/10/15min. Healthcheck via GET /api/tags — zero inference, lightweight.',
  },
  {
    icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
    color: '#64C8FF',
    title: 'Full Observability',
    desc: 'VictoriaMetrics + Loki + Grafana stack. Every metric, log, and alert is queryable through a unified dashboard with Prometheus-format metrics export.',
    detail: 'Netdata streams 5 metric families per VPS (cpu, mem, disk, net, containers). Promtail pushes logs to Loki. All routes HTTPS via Nginx reverse proxy.',
  },
  {
    icon: <><path d="M20 7h-4a2 2 0 0 1-2-2V1" /><path d="M4 7V4a2 2 0 0 1 2-2h7l7 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M12 15v4" /><path d="M9 12l3 3 3-3" /></>,
    color: '#00DCB4',
    title: 'Silent Mode',
    desc: 'First 7 days are pure learning. The system builds baselines, detects anomalies, and records everything — but never notifies until confidence exceeds 95%.',
    detail: 'Initial 6h builds rough MAD baseline with uncertainty decay curve. All alerts recorded with silent=true flag. Zero push notifications during learning period.',
  },
  {
    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    color: '#F5B041',
    title: 'Intelligent Backpressure',
    desc: 'Auto-scales to traffic. At 500+ queued alerts, low-confidence items are dropped. At 1000+, LLM enrichment bypasses entirely. Your infrastructure stays responsive.',
    detail: 'Queue >500 discards <70% confidence alerts. Queue >1000 bypasses LLM, sends raw stat alert. Queue >2000 applies 30min TTL. Worker concurrency capped at 5.',
  },
  {
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    color: '#A064FF',
    title: 'Playbook Safety',
    desc: 'LLM never generates raw commands. Returns playbook IDs with sanitized arguments. Command injection is structurally impossible — every action is audited and logged.',
    detail: 'Mitigation playbooks stored in dedicated table with allowed_arguments whitelist. LLM output parsed via Pydantic → regex → generic fallback chain. Full audit trail in incident_logs.',
  },
]

export default function Features() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <section className="py-25 px-6" id="features">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-15">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Core Capabilities</div>
          <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">Precision monitoring,<br />zero noise</h2>
          <p className="max-w-[560px] text-base leading-relaxed text-white/60 reveal reveal-delay-2">Robust statistics filter the signal from the noise. Every alert is enriched by LLM context before you ever hear about it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className={`group relative p-2 rounded-2xl bg-gradient-to-br from-white/10 to-transparent cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:from-gold/12 hover:to-transparent ${expanded === i ? 'from-gold/12 to-transparent' : ''} reveal ${i > 0 ? `reveal-delay-${Math.min(i, 5)}` : ''}`}
            >
              <div className={`p-8 rounded-[calc(24px-8px)] bg-surface border border-white/5 h-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden group-hover:border-gold/15 ${expanded === i ? '!border-gold shadow-[0_0_60px_rgba(245,176,65,0.06)]' : ''}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-lg border border-white/10 bg-surface-2 transition-all duration-300 group-hover:border-gold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{f.desc}</p>
                <div className={`mt-4 pt-4 border-t border-white/5 text-[13px] leading-relaxed text-white/40 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${expanded === i ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {f.detail}
                </div>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-gold opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                  Click for details →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
