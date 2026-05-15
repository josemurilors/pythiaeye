import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const cards = [
  {
    title: 'Anomaly Timeline',
    subtitle: 'Z-Score MAD · 12 metrics',
    badge: '3 ACTIVE',
    badgeClass: 'text-magenta bg-magenta/15 border-magenta/20',
    gradient: 'from-[#0d0d0d] to-[#1a1410]',
    glow: 'rgba(245,176,65,0.08)',
    glowPos: '20% 30%' as const,
  },
  {
    title: 'Infra Topology',
    subtitle: '5 nodes · 3 services · 2 regions',
    badge: 'HEALTHY',
    badgeClass: 'text-[#00DCB4] bg-[#00DCB4]/10 border-[#00DCB4]/15',
    gradient: 'from-[#0d0d0d] to-[#0a1018]',
    glow: 'rgba(100,200,255,0.06)',
    glowPos: '60% 40%' as const,
  },
  {
    title: 'LLM Diagnosis',
    subtitle: 'Ollama → Groq · phi-4 · pydantic',
    badge: null,
    gradient: 'from-[#0d0d0d] to-[#100818]',
    glow: 'rgba(160,100,255,0.06)',
    glowPos: '50% 60%' as const,
  },
  {
    title: 'Alert History',
    subtitle: 'Last 24h · 12 incidents',
    badge: null,
    gradient: 'from-[#0d0d0d] to-[#14100a]',
    glow: 'rgba(245,176,65,0.04)',
    glowPos: '80% 20%' as const,
  },
  {
    title: 'System Health',
    subtitle: 'Uptime · 14d 6h 32m',
    badge: 'ALL CLEAR',
    badgeClass: 'text-[#00DCB4] bg-[#00DCB4]/10 border-[#00DCB4]/15',
    gradient: 'from-[#0d0d0d] to-[#0a140a]',
    glow: 'rgba(0,220,180,0.04)',
    glowPos: '30% 70%' as const,
  },
]

export default function DashboardGallery() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const container = containerRef.current
    if (!wrapper || !container) return

    const cardEls = wrapper.querySelectorAll<HTMLDivElement>('.dash-card')
    const total = cardEls.length
    if (total === 0) return

    gsap.set(cardEls[0], { y: '0%', scale: 1, rotation: 0 })
    for (let i = 1; i < total; i++) {
      gsap.set(cardEls[i], { y: '100%', scale: 1, rotation: 0 })
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: `+=${window.innerHeight * (total - 0.5)}`,
        pin: true,
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
      },
    })

    for (let i = 0; i < total - 1; i++) {
      const current = cardEls[i]
      const next = cardEls[i + 1]
      if (!current || !next) continue
      tl.to(current, { scale: 0.75, rotation: i % 2 === 0 ? 4 : -4, duration: 1, ease: 'none' }, i)
      tl.to(next, { y: '0%', duration: 1, ease: 'none' }, i)
    }

    ScrollTrigger.refresh()

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <section className="py-25 px-6 bg-black-2 overflow-hidden" id="dashboard-gallery">
      <div className="max-w-[1200px] mx-auto mb-15">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.25 mb-5 border border-white/10 rounded-full text-[11px] font-semibold tracking-widest uppercase text-white/60 reveal">Dashboard Gallery</div>
          <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight leading-[1.1] mb-4 reveal reveal-delay-1">Scroll through<br />your observability suite</h2>
          <p className="max-w-[560px] text-base leading-relaxed text-white/60 reveal reveal-delay-2">Each card is a live view into your infrastructure — anomaly timelines, topology maps, and LLM-powered diagnosis, stacked and scrollable.</p>
        </div>
      </div>

      <div ref={containerRef} className="w-full relative" style={{ height: '100vh' }}>
        <div className="sticky top-0 h-dvh w-full flex items-center justify-center overflow-hidden">
          <div ref={wrapperRef} className="relative w-[min(90vw,700px)] h-[min(80vh,520px)]">
            {cards.map((card, i) => (
              <div key={i} className="dash-card absolute inset-0 rounded-2xl overflow-hidden border border-white/10" data-index={i}
                style={{
                  background: `linear-gradient(145deg, ${card.gradient})`,
                }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at ${card.glowPos}, ${card.glow}, transparent)` }} />
                <div className="relative z-1 p-8 h-full flex flex-col">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i === 0 ? 'bg-gold/15' : i === 1 ? 'bg-[#64C8FF]/12' : i === 2 ? 'bg-[#A064FF]/12' : i === 3 ? 'bg-gold/10' : 'bg-[#00DCB4]/10'
                    }`}>
                      {i === 0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5B041" strokeWidth="1.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>}
                      {i === 1 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64C8FF" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M2 12a10 10 0 0 1 10-10"/><path d="M12 22a10 10 0 0 1-10-10"/><path d="M22 12a10 10 0 0 1-10 10"/></svg>}
                      {i === 2 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A064FF" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                      {i === 3 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F7DC6F" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      {i === 4 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00DCB4" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{card.title}</div>
                      <div className="text-[11px] text-white/40 font-mono">{card.subtitle}</div>
                    </div>
                    {card.badge && (
                      <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${card.badgeClass}`}>
                        {card.badge}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex gap-4 min-h-0">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 p-3 flex flex-col justify-end">
                        {i === 0 && (
                          <svg viewBox="0 0 200 80" className="w-full h-full">
                            <polyline points="0,60 10,55 20,58 30,35 40,38 50,20 55,22 60,18 70,40 80,42 90,45 100,48 110,50 120,55 130,35 140,38 145,40 150,45 160,48 170,52 180,30 190,32 200,28" fill="none" stroke="#F5B041" strokeWidth="1.5" opacity="0.8" />
                            <circle cx="50" cy="20" r="4" fill="#E74C3C" stroke="#0d0d0d" strokeWidth="2" />
                            <circle cx="130" cy="35" r="4" fill="#E74C3C" stroke="#0d0d0d" strokeWidth="2" />
                            <circle cx="180" cy="30" r="4" fill="#F5B041" stroke="#0d0d0d" strokeWidth="2" />
                            <line x1="0" y1="70" x2="200" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="0" y1="35" x2="200" y2="35" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="4,4" />
                          </svg>
                        )}
                        {i === 1 && (
                          <svg viewBox="0 0 280 160" className="w-full h-full max-h-[200px]">
                            <circle cx="140" cy="80" r="60" fill="none" stroke="rgba(100,200,255,0.06)" strokeWidth="1" />
                            <circle cx="140" cy="80" r="40" fill="none" stroke="rgba(100,200,255,0.04)" strokeWidth="1" />
                            <circle cx="140" cy="80" r="20" fill="none" stroke="rgba(100,200,255,0.04)" strokeWidth="1" />
                            <circle cx="140" cy="35" r="16" fill="rgba(245,176,65,0.12)" stroke="#F5B041" strokeWidth="1.5" />
                            <text x="140" y="40" textAnchor="middle" fill="#F5B041" fontSize="8" fontWeight="600">API GW</text>
                            <circle cx="100" cy="120" r="14" fill="rgba(100,200,255,0.1)" stroke="#64C8FF" strokeWidth="1.5" />
                            <text x="100" y="124" textAnchor="middle" fill="#64C8FF" fontSize="7" fontWeight="600">DB</text>
                            <circle cx="180" cy="120" r="14" fill="rgba(0,220,180,0.1)" stroke="#00DCB4" strokeWidth="1.5" />
                            <text x="180" y="124" textAnchor="middle" fill="#00DCB4" fontSize="7" fontWeight="600">Cache</text>
                            <circle cx="60" cy="70" r="10" fill="rgba(160,100,255,0.1)" stroke="#A064FF" strokeWidth="1.5" />
                            <text x="60" y="74" textAnchor="middle" fill="#A064FF" fontSize="6" fontWeight="600">Wkr</text>
                            <circle cx="220" cy="70" r="10" fill="rgba(231,76,60,0.1)" stroke="#E74C3C" strokeWidth="1.5" />
                            <text x="220" y="74" textAnchor="middle" fill="#E74C3C" fontSize="6" fontWeight="600">LLM</text>
                            <line x1="125" y1="48" x2="108" y2="108" stroke="rgba(100,200,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="155" y1="48" x2="172" y2="108" stroke="rgba(100,200,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="126" y1="48" x2="68" y2="64" stroke="rgba(100,200,255,0.1)" strokeWidth="0.8" />
                            <line x1="154" y1="48" x2="212" y2="64" stroke="rgba(100,200,255,0.1)" strokeWidth="0.8" />
                            <circle cx="100" cy="112" r="3" fill="#00DCB4" opacity="0.6" />
                            <circle cx="180" cy="112" r="3" fill="#00DCB4" opacity="0.6" />
                            <circle cx="140" cy="27" r="3" fill="#00DCB4" opacity="0.6" />
                          </svg>
                        )}
                        {i === 2 && (
                          <div className="rounded-xl bg-black/40 border border-[#A064FF]/10 p-4 font-mono text-[11px] leading-relaxed overflow-hidden h-full">
                            <div style={{ color: '#64C8FF', marginBottom: 4 }}>$ diagnose --alert-id a7f3e2</div>
                            <div className="flex gap-2 mb-1.5"><span className="text-white/40">[</span><span className="text-gold-light">ANALYZING</span><span className="text-white/40">]</span><span className="text-white/60">Scanning 5 metric streams...</span></div>
                            <div><span style={{ color: '#00DCB4' }}>✓</span> <span className="text-white/40">Baseline:</span> <span className="text-white/60">cpu 34.2% ± 8.1%</span></div>
                            <div><span style={{ color: '#E74C3C' }}>!</span> <span className="text-white/40">Current:</span> <span style={{ color: '#E74C3C' }}>cpu 91.7%</span></div>
                            <div className="mt-1.5 text-white/40">└─ <span className="text-gold-light">Z=7.8 · 98.2% confidence</span></div>
                            <div className="mt-1.5 pt-1.5 border-t border-[#A064FF]/8"><span style={{ color: '#A064FF' }}>→</span> <span className="text-white/60">Potential memory leak in</span> <span className="text-gold-light">worker-pool-3</span></div>
                            <div><span style={{ color: '#A064FF' }}>→</span> <span className="text-white/40">Playbook:</span> <span style={{ color: '#64C8FF' }}>p-42 (restart worker)</span></div>
                          </div>
                        )}
                        {i === 3 && (
                          <div className="flex flex-col gap-1.5 h-full justify-center">
              {[
                  { time: '09:42', desc: 'CPU spike · procyon-3', severity: 'critical', color: '#E74C3C' },
                  { time: '07:18', desc: 'Memory warning · pool-2', severity: 'warning', color: '#F5B041' },
                  { time: '04:55', desc: 'Disk cleanup complete', severity: 'resolved', color: '#00DCB4' },
                  { time: '02:12', desc: 'Net latency increased', severity: 'warning', color: '#F5B041' },
                ].map((item, j) => (
                  <div key={j} className="grid grid-cols-[60px_1fr_60px] gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: j === 0 ? 'rgba(231,76,60,0.06)' : 'transparent', borderLeft: `2px solid ${j === 0 ? '#E74C3C' : j === 1 ? '#F5B041' : 'rgba(255,255,255,0.1)'}` }}>
                                <span className="text-[10px] font-mono text-white/40">{item.time}</span>
                                <span className="text-[11px] text-white/80 font-semibold">{item.desc}</span>
                                <span className="text-[10px] font-bold text-right" style={{ color: item.color }}>{item.severity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {i === 4 && (
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {[
                              { value: '98.7', label: 'uptime %', color: '#00DCB4' },
                              { value: '0', label: 'active alerts', color: '#F7DC6F' },
                              { value: '5', label: 'nodes online', color: '#64C8FF' },
                              { value: '1.2k', label: 'metrics/min', color: '#A064FF' },
                            ].map((item, j) => (
                              <div key={j} className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 flex flex-col items-center justify-center">
                                <div className="text-[28px] font-extrabold" style={{ color: item.color }}>{item.value}</div>
                                <div className="text-[10px] text-white/40 mt-0.5">{item.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="w-[120px] flex flex-col gap-2">
                        <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 p-2.5 flex flex-col gap-1.5">
                          <div className="text-[9px] text-white/40 tracking-wider uppercase">Top Metrics</div>
                          <div><div className="flex justify-between text-[10px] text-white/60"><span>cpu</span><span style={{ color: '#E74C3C' }}>92%</span></div><div className="h-[3px] rounded-full bg-white/10 mt-0.5"><div className="w-[92%] h-full rounded-full" style={{ background: '#E74C3C' }} /></div></div>
                          <div><div className="flex justify-between text-[10px] text-white/60"><span>mem</span><span style={{ color: '#F5B041' }}>78%</span></div><div className="h-[3px] rounded-full bg-white/10 mt-0.5"><div className="w-[78%] h-full rounded-full" style={{ background: '#F5B041' }} /></div></div>
                          <div><div className="flex justify-between text-[10px] text-white/60"><span>disk</span><span className="text-white/40">45%</span></div><div className="h-[3px] rounded-full bg-white/10 mt-0.5"><div className="w-[45%] h-full rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} /></div></div>
                        </div>
                        <div className="px-2.5 py-2 rounded-lg bg-gold/6 border border-gold/12">
                          <div className="text-[9px] text-gold-light font-semibold mb-0.5">Confidence</div>
                          <div className="text-base font-extrabold text-gold">97.3%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {i === 0 && (
                    <div className="mt-2.5 flex gap-1.5">
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-magenta/10 text-magenta">cpu spike</span>
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-gold/10 text-gold-light">z=7.2</span>
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-white/4 text-white/40">procyon-3</span>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="mt-2.5 flex gap-2 flex-wrap">
                      {['procyon-1', 'procyon-2', 'procyon-3'].map((name, j) => (
                        <div key={j} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: j < 2 ? '#00DCB4' : '#F5B041' }} /><span className="text-[10px] text-white/40">{name}</span></div>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="mt-2.5 flex gap-1.5">
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-[#A064FF]/10 text-[#A064FF]">model: phi-4</span>
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-gold/10 text-gold-light">latency: 4.2s</span>
                      <span className="px-2 py-0.75 rounded-md text-[9px] font-semibold bg-white/4 text-white/40">inference #892</span>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="mt-2.5 text-center">
                      <span className="text-[11px] text-white/40">Mean time to detect: <span className="text-gold font-bold">3.2s</span></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
