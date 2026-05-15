import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const sections = [
  { id: 'dashboard-gallery', label: 'Dashboard' },
  { id: 'features', label: 'Features' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'how-it-works', label: 'Pipeline' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [currentSection, setCurrentSection] = useState('')
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 80)

      if (!isHome) return
      let active = ''
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.offsetTop - 200 <= y) active = s.label
      }
      setCurrentSection(active)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        scrolled ? 'bg-black/85 backdrop-blur-2xl saturate-150 border-b border-white/5' : ''
      }`}
    >
      <div className={`flex items-center justify-between max-w-[1200px] mx-auto px-6 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${scrolled ? 'py-2.5' : 'py-3.5'}`}>
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 no-underline text-white">
            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#F5B041" strokeWidth="1.5" opacity="0.6" />
              <circle cx="16" cy="16" r="8" stroke="#F5B041" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="3" fill="#E74C3C" />
            </svg>
            <span className="text-[15px] font-bold tracking-tight">PythiaEye</span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-gold/15 text-gold-light">Dev</span>
          </Link>
          <div className="hidden md:flex gap-1 items-center">
            <Link to="/" className="px-3.5 py-1.5 rounded-lg text-white/60 no-underline text-[13px] font-medium transition-all duration-200 hover:text-white hover:bg-white/5">
              Home
            </Link>
            {isHome && sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="px-3.5 py-1.5 rounded-lg text-white/60 no-underline text-[13px] font-medium transition-all duration-200 hover:text-white hover:bg-white/5">
                {s.label}
              </a>
            ))}
            <Link to="/about" className="px-3.5 py-1.5 rounded-lg text-white/60 no-underline text-[13px] font-medium transition-all duration-200 hover:text-white hover:bg-white/5">
              About
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs text-white/40 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentSection ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <span className="text-white/60">/</span><span>{currentSection}</span>
          </div>
          <a href="#" className="py-1.5 px-4 bg-gradient-to-br from-gold-dark to-gold text-black no-underline rounded-lg text-[13px] font-bold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-104">
            Get Started
          </a>
          <button className="md:hidden w-9 h-9 flex items-center justify-center bg-none border border-white/10 rounded-lg cursor-pointer text-white" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
