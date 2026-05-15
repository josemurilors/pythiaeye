export default function StatsBar() {
  return (
    <div className="flex justify-center gap-15 px-6 py-8 flex-wrap border-y border-white/5 bg-black-2 reveal">
      <div className="text-center">
        <div className="text-[32px] font-extrabold tracking-tight bg-gradient-to-br from-gold-light to-gold bg-clip-text text-transparent">99.7%</div>
        <div className="text-[13px] text-white/60 mt-1 font-medium">Alert Precision</div>
      </div>
      <div className="text-center">
        <div className="text-[32px] font-extrabold tracking-tight bg-gradient-to-br from-gold-light to-gold bg-clip-text text-transparent">&lt;5s</div>
        <div className="text-[13px] text-white/60 mt-1 font-medium">Mean Detection</div>
      </div>
      <div className="text-center">
        <div className="text-[32px] font-extrabold tracking-tight bg-gradient-to-br from-gold-light to-gold bg-clip-text text-transparent">2-10</div>
        <div className="text-[13px] text-white/60 mt-1 font-medium">VPS Fleet Size</div>
      </div>
      <div className="text-center">
        <div className="text-[32px] font-extrabold tracking-tight bg-gradient-to-br from-gold-light to-gold bg-clip-text text-transparent">100%</div>
        <div className="text-[13px] text-white/60 mt-1 font-medium">Open Source</div>
      </div>
    </div>
  )
}
