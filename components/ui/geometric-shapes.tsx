"use client"

export function GeometricShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large Geometric Shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-3xl rotate-45 animate-float-slow"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-2xl rotate-12 animate-float-slow delay-1000"></div>
      <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full animate-float-slow delay-2000"></div>
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-lg rotate-45 animate-float-slow delay-3000"></div>
      
      {/* Medium Shapes */}
      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-br from-emerald-300/15 to-transparent rounded-xl rotate-45 animate-pulse-slow"></div>
      <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-br from-blue-300/15 to-transparent rounded-lg rotate-12 animate-pulse-slow delay-500"></div>
      <div className="absolute bottom-1/3 left-1/3 w-14 h-14 bg-gradient-to-br from-purple-300/15 to-transparent rounded-2xl rotate-45 animate-pulse-slow delay-1000"></div>
      
      {/* Small Accent Shapes */}
      <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-emerald-400/20 rounded-full animate-bounce-slow"></div>
      <div className="absolute top-2/3 right-1/3 w-6 h-6 bg-blue-400/20 rounded-full animate-bounce-slow delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/2 w-4 h-4 bg-purple-400/20 rounded-full animate-bounce-slow delay-2000"></div>
    </div>
  )
}
