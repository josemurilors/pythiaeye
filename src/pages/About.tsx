const values = [
  { title: 'Zero Alert Fatigue', desc: '95% confidence threshold means you only hear about incidents that matter. Your attention is valuable — we protect it.', icon: '🎯' },
  { title: 'Radical Simplicity', desc: 'Single-server deployment. Zero Kubernetes. One curl command per agent. Infrastructure monitoring should not require a team to run.', icon: '⚡' },
  { title: 'Privacy First', desc: 'Local LLM inference by default. Your metrics never leave your network. The Groq fallback is opt-in and rate-limited.', icon: '🔒' },
  { title: 'Open Source', desc: '100% open source under MIT license. No dark patterns, no vendor lock-in, no hidden pricing. Your data belongs to you.', icon: '🌍' },
]

const timeline = [
  { year: '2025 Q4', title: 'Project Inception', desc: 'Architecture design, tech stack selection, MVP specification.' },
  { year: '2026 Q1', title: 'Core Engine', desc: 'Z-Score MAD implementation, PostgreSQL schema, FastAPI webhook.' },
  { year: '2026 Q2', title: 'LLM Integration', desc: 'Ollama bridge, Groq fallback, Pydantic output parsing, playbook safety.' },
  { year: '2026 Q3', title: 'Observability Stack', desc: 'VictoriaMetrics, Loki, Grafana dashboards, Docker Compose orchestration.' },
  { year: '2026 Q4', title: 'Production Ready', desc: 'Terraform IaC, agent installer, CI/CD, load testing, documentation.' },
]

export default function About() {
  return (
    <div className="pt-24">
      {/* ─── Hero About ─── */}
      <section className="py-25 px-6 text-center relative z-2">
        <div className="max-w-[800px] mx-auto">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 border border-gold/25 rounded-full text-[11px] font-semibold tracking-widest uppercase text-gold-light bg-gold/6 reveal">
            About PythiaEye
          </div>
          <h1 className="text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.04] tracking-tighter mb-6 bg-gradient-to-br from-white/40 to-gold-light bg-clip-text text-transparent reveal reveal-delay-1">
            The Oracle for<br />your Infrastructure
          </h1>
          <p className="text-lg leading-relaxed text-white/60 max-w-[640px] mx-auto reveal reveal-delay-2">
            PythiaEye is an AI-augmented infrastructure monitoring pipeline designed for small fleets (2-10 VPS).
            Named after the Oracle of Delphi, it brings clarity to your operations — detecting anomalies with
            statistical rigor and diagnosing them with local LLM intelligence.
          </p>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="py-25 px-6 bg-black-2">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-4 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60">Mission</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-[1.1] mb-6">
              Eliminate alert fatigue<br />for small teams
            </h2>
            <p className="text-base text-white/60 leading-relaxed mb-4">
              Most monitoring tools are built for enterprises with dedicated SRE teams. They generate noise,
              require complex setups, and cost a fortune. PythiaEye flips that model.
            </p>
            <p className="text-base text-white/60 leading-relaxed mb-4">
              We combine robust statistics (Z-Score MAD) with local LLM inference to deliver alerts that
              are accurate, contextual, and actionable. No false alarms. No config hell. No data leaving your network.
            </p>
            <p className="text-base text-white/60 leading-relaxed">
              Built for the solo developer running 5 VPS. For the small team that cannot afford a PagerDuty license.
              For anyone who believes infrastructure monitoring should be simple, private, and open.
            </p>
          </div>
          <div className="relative reveal reveal-delay-1">
            <div className="p-1 rounded-2xl bg-gradient-to-br from-gold/20 to-transparent">
              <div className="rounded-[calc(24px-4px)] bg-surface p-8 border border-white/5">
                <div className="text-4xl font-extrabold text-gold mb-2">3,600</div>
                <div className="text-white/60 text-sm mb-6">potential alerts avoided per day per VPS<br />with 95% confidence threshold</div>
                <div className="space-y-4">
                  {[
                    { label: 'False positive reduction', value: '99.7%', color: '#00DCB4' },
                    { label: 'Mean detection time', value: '&lt;5s', color: '#F5B041' },
                    { label: 'LLM enrichment rate', value: '~4s', color: '#A064FF' },
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-none">
                      <span className="text-white/60 text-sm">{stat.label}</span>
                      <span className="text-lg font-bold" style={{ color: stat.color }} dangerouslySetInnerHTML={{ __html: stat.value }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="py-25 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-15">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Technology</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">Built with modern,<br />open infrastructure</h2>
            <p className="max-w-[560px] text-base leading-relaxed text-white/60 reveal reveal-delay-2">Every component is carefully chosen for reliability, performance, and simplicity.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 reveal reveal-delay-1">
            {[
              { name: 'FastAPI', role: 'Backend API', color: 'text-[#009485]', bg: 'bg-[#009485]/10' },
              { name: 'PostgreSQL', role: 'Database', color: 'text-[#336791]', bg: 'bg-[#336791]/10' },
              { name: 'VictoriaMetrics', role: 'Metrics', color: 'text-[#64C8FF]', bg: 'bg-[#64C8FF]/10' },
              { name: 'Loki', role: 'Logs', color: 'text-[#F05A28]', bg: 'bg-[#F05A28]/10' },
              { name: 'Ollama', role: 'Local LLM', color: 'text-[#A064FF]', bg: 'bg-[#A064FF]/10' },
              { name: 'Grafana', role: 'Dashboards', color: 'text-[#F46800]', bg: 'bg-[#F46800]/10' },
            ].map((tech, i) => (
              <div key={i} className="p-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent">
                <div className="rounded-[calc(20px-4px)] bg-surface p-5 border border-white/5 text-center">
                  <div className={`text-sm font-bold mb-1 ${tech.color}`}>{tech.name}</div>
                  <div className="text-xs text-white/40">{tech.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-25 px-6 bg-black-2">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-15">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Principles</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">What we believe in</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <div key={i} className={`p-1 rounded-2xl bg-gradient-to-br from-white/10 to-transparent reveal ${i > 0 ? `reveal-delay-${Math.min(i, 3)}` : ''}`}>
                <div className="rounded-[calc(24px-4px)] bg-surface p-8 border border-white/5 h-full">
                  <div className="text-3xl mb-4">{v.icon}</div>
                  <h3 className="text-lg font-bold mb-3">{v.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roadmap ─── */}
      <section className="py-25 px-6">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-col items-center text-center mb-15">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Roadmap</div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">What's coming</h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5 hidden md:block" />
            <div className="space-y-0">
              {timeline.map((item, i) => (
                <div key={i} className={`grid md:grid-cols-[80px_1fr] gap-6 py-6 border-b border-white/5 last:border-none reveal ${i > 0 ? `reveal-delay-${Math.min(i, 4)}` : ''}`}>
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gold border-2 border-black mt-1.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wider text-gold uppercase">{item.year}</span>
                    <h3 className="text-lg font-bold mt-1 mb-1">{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center py-25 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,176,65,0.08) 0%, transparent 70%)`
        }} />
        <div className="relative z-1 max-w-[600px] mx-auto">
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.05] mb-4 reveal">
            Join the mission
          </h2>
          <p className="text-base text-white/60 mb-8 reveal reveal-delay-1">
            PythiaEye is open source and community-driven. Star us on GitHub, contribute code, or just follow along.
          </p>
          <div className="flex gap-4 justify-center flex-wrap reveal reveal-delay-2">
            <a href="#" className="btn-primary">
              Star on GitHub
              <span className="arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            </a>
            <a href="/" className="btn-secondary">Back to Home</a>
          </div>
        </div>
      </section>
    </div>
  )
}
