"use client"

export function RotatingRings() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Outer Ring */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-96 h-96 border-2 border-emerald-300/30 rounded-full animate-spin-slow">
          <div className="w-full h-full border-2 border-blue-300/20 rounded-full animate-spin-reverse">
            <div className="w-full h-full border-2 border-purple-300/20 rounded-full animate-spin-slow">
              <div className="w-full h-full border-2 border-amber-300/20 rounded-full animate-spin-reverse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Ring */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-64 h-64 border-2 border-emerald-400/40 rounded-full animate-spin-reverse">
          <div className="w-full h-full border-2 border-blue-400/30 rounded-full animate-spin-slow">
            <div className="w-full h-full border-2 border-purple-400/30 rounded-full animate-spin-reverse"></div>
          </div>
        </div>
      </div>

      {/* Inner Ring */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 border-2 border-emerald-500/50 rounded-full animate-spin-slow">
          <div className="w-full h-full border-2 border-blue-500/40 rounded-full animate-spin-reverse">
            <div className="w-full h-full border-2 border-purple-500/40 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
