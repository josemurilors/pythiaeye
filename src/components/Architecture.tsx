const archItems = [
  { tag: 'API', tagClass: 'tag-api', name: 'FastAPI + Worker Pool', desc: 'Async webhook ingestion, PostgreSQL-backed queue, asyncio.Semaphore(5) for LLM concurrency.', detail: 'POST /webhook/alerts → 202', color: '#F5B041' },
  { tag: 'Database', tagClass: 'tag-db', name: 'PostgreSQL 16', desc: 'Alert queue with fingerprint dedup, metric baselines, playbook registry, and full incident audit trail.', detail: 'Partial UNIQUE index · 4 tables', color: '#FF0066' },
  { tag: 'LLM', tagClass: 'tag-llm', name: 'Ollama → Groq', desc: 'Local inference with auto-failover. Configurable timeout (default 60s), lightweight healthcheck via /api/tags.', detail: 'Zero inference healthcheck', color: '#A064FF' },
  { tag: 'Metrics', tagClass: 'tag-metrics', name: 'VictoriaMetrics', desc: 'Scrapes Netdata + PingExporter from every VPS. Prometheus-format health endpoint.', detail: '5 metric families per VPS', color: '#64C8FF' },
  { tag: 'Logs', tagClass: 'tag-metrics', name: 'Loki + Promtail', desc: 'Centralized log aggregation. LogProcessor extracts OOM/timeout/5xx patterns for LLM context enrichment.', detail: 'Last 5min ERROR level', color: '#64C8FF' },
  { tag: 'Agent', tagClass: 'tag-agent', name: 'Netdata + Promtail', desc: 'Per-VPS agent bundle. Streams CPU, memory, disk, network, and containers only.', detail: 'Install via curl script', color: '#00DCB4' },
]

export default function Architecture() {
  return (
    <section className="py-25 px-6 bg-black-2" id="architecture">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center text-center mb-15">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">System Architecture</div>
          <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">Designed for 8-16GB<br />single-server deployment</h2>
          <p className="max-w-[560px] text-base leading-relaxed text-white/60 reveal reveal-delay-2">Everything runs in Docker Compose on one central server. Zero Kubernetes, zero orchestration overhead.</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {archItems.map((item, i) => (
            <div key={i} className={`p-1.5 rounded-xl bg-gradient-to-br from-white/10 to-transparent cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] hover:from-gold/10 hover:to-transparent reveal ${i > 0 ? `reveal-delay-${Math.min(i, 5)}` : ''}`}>
              <div className="p-6 rounded-[calc(20px-6px)] bg-surface border border-white/5 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gold/15">
                <span className={`inline-block px-2.5 py-0.75 rounded-md text-[10px] font-bold tracking-wider uppercase mb-3 ${item.tagClass}`}>{item.tag}</span>
                <div className="text-[15px] font-bold mb-1.5">{item.name}</div>
                <div className="text-[13px] text-white/60 leading-relaxed">{item.desc}</div>
                <div className="text-xs text-white/40 mt-2.5 font-mono">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
