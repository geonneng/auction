"use client"

export function ModernGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Central Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-emerald-400/20 via-emerald-400/5 to-transparent rounded-full animate-pulse-glow"></div>
      
      {/* Corner Glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-blue-400/15 via-blue-400/5 to-transparent rounded-full animate-pulse-glow delay-1000"></div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-purple-400/15 via-purple-400/5 to-transparent rounded-full animate-pulse-glow delay-2000"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-radial from-amber-400/15 via-amber-400/5 to-transparent rounded-full animate-pulse-glow delay-3000"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-radial from-cyan-400/15 via-cyan-400/5 to-transparent rounded-full animate-pulse-glow delay-4000"></div>
      
      {/* Subtle Ambient Light */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-blue-50/30"></div>
    </div>
  )
}
