import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10 flex justify-between items-center flex-wrap gap-4 relative z-2">
      <p className="text-[13px] text-white/40">&copy; 2026 PythiaEye. The Oracle for your Infrastructure.</p>
      <div className="flex gap-5">
        <a href="#" className="text-white/40 no-underline text-[13px] transition-colors duration-300 hover:text-white">GitHub</a>
        <a href="#" className="text-white/40 no-underline text-[13px] transition-colors duration-300 hover:text-white">Documentation</a>
        <Link to="/about" className="text-white/40 no-underline text-[13px] transition-colors duration-300 hover:text-white">About</Link>
        <a href="#" className="text-white/40 no-underline text-[13px] transition-colors duration-300 hover:text-white">Status</a>
      </div>
    </footer>
  )
}
