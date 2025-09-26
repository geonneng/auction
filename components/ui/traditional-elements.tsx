"use client"

export function TraditionalElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Traditional Korean Motifs */}
      <div className="absolute top-20 left-20 w-16 h-16 border-2 border-emerald-400/30 rounded-full animate-pulse-slow"></div>
      <div className="absolute top-20 right-20 w-12 h-12 border-2 border-emerald-400/30 rounded-full animate-pulse-slow delay-1000"></div>
      <div className="absolute bottom-20 left-20 w-14 h-14 border-2 border-emerald-400/30 rounded-full animate-pulse-slow delay-2000"></div>
      <div className="absolute bottom-20 right-20 w-10 h-10 border-2 border-emerald-400/30 rounded-full animate-pulse-slow delay-3000"></div>
      
      {/* Traditional Lines */}
      <div className="absolute top-1/3 left-10 w-20 h-0.5 bg-emerald-400/40 animate-fade-in-up delay-500"></div>
      <div className="absolute top-1/3 right-10 w-20 h-0.5 bg-emerald-400/40 animate-fade-in-up delay-700"></div>
      <div className="absolute bottom-1/3 left-10 w-20 h-0.5 bg-emerald-400/40 animate-fade-in-up delay-900"></div>
      <div className="absolute bottom-1/3 right-10 w-20 h-0.5 bg-emerald-400/40 animate-fade-in-up delay-1100"></div>
      
      {/* Traditional Dots */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-bounce-slow"></div>
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-bounce-slow delay-500"></div>
      <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-bounce-slow delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-bounce-slow delay-1500"></div>
    </div>
  )
}
