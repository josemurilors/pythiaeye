const steps = [
  { num: 1, title: 'Anomaly Detection', desc: 'Netdata streams 5 metric families per VPS. The Z-Score MAD engine computes median-based deviations. Z-scores below 3.5 are ignored — only genuine anomalies proceed.' },
  { num: 2, title: 'Queue & Dedup', desc: 'Alertmanager posts to the webhook. PostgreSQL inserts with fingerprint-based dedup — same issue in the same window updates rather than duplicates. Priority sorted by confidence.' },
  { num: 3, title: 'LLM Enrichment', desc: 'Worker pool (max 5 concurrent) fetches the alert, queries Loki for recent ERROR logs, and sends structured context to Ollama. If Ollama times out, retries with backoff before failing over to Groq.' },
  { num: 4, title: 'Diagnosis & Safety', desc: 'LLM response is validated through Pydantic, then regex, then generic fallback. Confidence must exceed 95% for any notification. Playbook IDs replace raw commands — zero shell injection risk.' },
  { num: 5, title: 'Notification & Audit', desc: 'Slack webhook delivers the diagnosis with cause, severity, and suggested playbook. Every action is logged to incident_logs. Daily housekeeping purges alerts older than 7 days.' },
]

export default function Pipeline() {
  return (
    <section className="py-25 px-6" id="how-it-works">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center text-center mb-15">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Pipeline</div>
          <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">From anomaly to diagnosis<br />in under 30 seconds</h2>
          <p className="max-w-[560px] text-base leading-relaxed text-white/60 reveal reveal-delay-2">Every incident flows through five stages — detection, enrichment, diagnosis, notification, and housekeeping.</p>
        </div>

        <div className="flex flex-col mt-15">
          {steps.map((step, i) => (
            <div key={i} className={`grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr] gap-6 py-8 border-b border-white/5 last:border-none reveal ${i > 0 ? `reveal-delay-${Math.min(i, 5)}` : ''}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-extrabold bg-gradient-to-br from-gold-dark to-gold text-black flex-shrink-0">
                {step.num}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1.5">{step.title}</h3>
                <p className="text-[15px] text-white/60 leading-relaxed max-w-[500px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
