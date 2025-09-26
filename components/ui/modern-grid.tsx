"use client"

export function ModernGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Modern Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-pulse delay-1000"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent animate-pulse delay-500"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent animate-pulse delay-1500"></div>
      </div>
    </div>
  )
}
