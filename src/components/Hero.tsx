export default function Hero() {
  return (
    <section className="min-h-dvh flex flex-col items-center justify-center px-6 pt-[120px] pb-20 text-center relative z-2">
      <div className="mb-12">
        <svg className="w-[140px] h-[140px]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E74C3C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#E74C3C" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B7950B" />
              <stop offset="50%" stopColor="#F7DC6F" />
              <stop offset="100%" stopColor="#F5B041" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="98" stroke="url(#goldRing)" strokeWidth="0.5" opacity="0.15" />
          <g className="spin-1" style={{ transformOrigin: 'center', animation: 'spinRing1 20s linear infinite' }}>
            <circle cx="100" cy="100" r="88" stroke="#F5B041" strokeWidth="1" opacity="0.08" />
            <path d="M100 12 A88 88 0 0 1 188 100" stroke="#F5B041" strokeWidth="0.8" opacity="0.12" fill="none" />
            <path d="M100 188 A88 88 0 0 1 12 100" stroke="#F5B041" strokeWidth="0.8" opacity="0.08" fill="none" />
          </g>
          <g className="spin-2" style={{ transformOrigin: 'center', animation: 'spinRing2 25s linear infinite' }}>
            <circle cx="100" cy="100" r="76" stroke="#F5B041" strokeWidth="1.2" opacity="0.12" />
            <path d="M100 24 A76 76 0 0 1 176 100" stroke="#F7DC6F" strokeWidth="0.6" opacity="0.15" fill="none" />
            <path d="M100 176 A76 76 0 0 1 24 100" stroke="#F7DC6F" strokeWidth="0.6" opacity="0.1" fill="none" />
          </g>
          <g className="spin-3" style={{ transformOrigin: 'center', animation: 'spinRing3 18s linear infinite' }}>
            <circle cx="100" cy="100" r="64" stroke="#F5B041" strokeWidth="1.5" opacity="0.18" />
            <path d="M100 36 A64 64 0 0 1 164 100" stroke="#F5B041" strokeWidth="0.7" opacity="0.2" fill="none" />
            <path d="M100 164 A64 64 0 0 1 36 100" stroke="#F5B041" strokeWidth="0.7" opacity="0.15" fill="none" />
          </g>
          <circle cx="100" cy="100" r="52" stroke="#F5B041" strokeWidth="2" opacity="0.25" />
          <circle cx="100" cy="100" r="44" stroke="#F7DC6F" strokeWidth="1.5" opacity="0.2" />
          <g opacity="0.15">
            <ellipse cx="100" cy="56" rx="3" ry="8" fill="#F5B041" />
            <ellipse cx="144" cy="100" rx="8" ry="3" fill="#F5B041" />
            <ellipse cx="100" cy="144" rx="3" ry="8" fill="#F5B041" />
            <ellipse cx="56" cy="100" rx="8" ry="3" fill="#F5B041" />
          </g>
          <circle cx="100" cy="100" r="36" stroke="#F5B041" strokeWidth="2.5" opacity="0.35" />
          <g opacity="0.2">
            <path d="M100 64 L108 92 L138 92 L113 110 L122 138 L100 120 L78 138 L87 110 L62 92 L92 92 Z" fill="#F5B041" />
          </g>
          <circle cx="100" cy="100" r="24" stroke="#F7DC6F" strokeWidth="2" opacity="0.4" />
          <circle cx="100" cy="100" r="16" stroke="#F5B041" strokeWidth="2.5" opacity="0.5" />
          <circle cx="100" cy="100" r="10" fill="url(#glowGrad)" opacity="0.6" />
          <circle cx="100" cy="100" r="7" fill="#E74C3C" />
          <circle cx="100" cy="100" r="3" fill="#FF4466" className="inner-dot" style={{ animation: 'logoPulse 3s ease-in-out infinite' }} />
        </svg>
      </div>

      <style>{`
        @keyframes spinRing1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinRing2 { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes spinRing3 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes logoPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.03); opacity: 0.95; } }
      `}</style>

      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-10 border border-gold/25 rounded-full text-[11px] font-semibold tracking-widest uppercase text-gold-light bg-gold/6 reveal">
        Now in Development
      </div>
      <h1 className="text-[clamp(42px,8vw,96px)] font-extrabold leading-[1.04] tracking-tighter mb-6 bg-gradient-to-br from-white/40 to-gold-light bg-clip-text text-transparent reveal reveal-delay-1">
        The Oracle for<br />your Infrastructure
      </h1>
      <p className="max-w-[600px] text-lg leading-relaxed text-white/60 mb-12 reveal reveal-delay-2">
        AI-augmented anomaly detection that eliminates alert fatigue. Z-Score MAD precision meets LLM-powered diagnosis — confidence above 95% or silence.
      </p>
      <div className="flex gap-4 items-center flex-wrap justify-center reveal reveal-delay-3">
        <a href="#" className="btn-primary">
          Deploy Now
          <span className="arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </a>
        <a href="#architecture" className="btn-secondary">View Architecture</a>
      </div>
    </section>
  )
}
