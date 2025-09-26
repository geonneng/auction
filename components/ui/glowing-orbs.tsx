"use client"

export function GlowingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large Orb - Top Left */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-full blur-xl animate-pulse-slow"></div>
      
      {/* Medium Orb - Top Right */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-lg animate-pulse-slow delay-1000"></div>
      
      {/* Small Orb - Bottom Left */}
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-md animate-pulse-slow delay-2000"></div>
      
      {/* Medium Orb - Bottom Right */}
      <div className="absolute -bottom-20 -right-20 w-36 h-36 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-xl animate-pulse-slow delay-1500"></div>
      
      {/* Center Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-radial from-emerald-400/20 via-transparent to-transparent rounded-full animate-pulse-slow"></div>
    </div>
  )
}
