export default function CTA() {
  return (
    <section className="text-center py-30 px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,176,65,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 30% 20%, rgba(255,0,102,0.04) 0%, transparent 60%)
        `
      }} />
      <div className="relative z-1 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-10 border border-gold/25 rounded-full text-[11px] font-semibold tracking-widest uppercase text-gold-light bg-gold/6 reveal">
          Open Source
        </div>
        <h2 className="text-[clamp(36px,5vw,64px)] font-extrabold tracking-tight leading-[1.05] mb-4 reveal reveal-delay-1">
          Ready to see through<br />your infrastructure?
        </h2>
        <p className="max-w-[480px] text-[17px] leading-relaxed text-white/60 mb-10 reveal reveal-delay-2">
          PythiaEye turns raw metrics into clear answers. No alert fatigue, no missed incidents — just the oracle watching over your stack.
        </p>
        <div className="reveal reveal-delay-3">
          <a href="#" className="btn-primary">
            Deploy with Docker Compose
            <span className="arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
