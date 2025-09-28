"use client"

export function TraditionalGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Traditional Korean Color Palette */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-emerald-100/20 via-emerald-50/10 to-transparent rounded-full animate-pulse-glow"></div>
      
      {/* Traditional Color Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-emerald-200/15 via-emerald-100/5 to-transparent rounded-full animate-pulse-glow delay-1000"></div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-emerald-300/15 via-emerald-200/5 to-transparent rounded-full animate-pulse-glow delay-2000"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-radial from-emerald-200/15 via-emerald-100/5 to-transparent rounded-full animate-pulse-glow delay-3000"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-radial from-emerald-300/15 via-emerald-200/5 to-transparent rounded-full animate-pulse-glow delay-4000"></div>
      
      {/* Traditional Warm Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-amber-50/20 to-emerald-50/40"></div>
    </div>
  )
}
