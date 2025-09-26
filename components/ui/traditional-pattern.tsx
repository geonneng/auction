"use client"

export function TraditionalPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Traditional Korean Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.08)_1px,transparent_0)] bg-[length:40px_40px] opacity-60"></div>
      
      {/* Traditional Border Patterns */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400"></div>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-400"></div>
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-400"></div>
      
      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-2 border-emerald-500 rounded-full opacity-60"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-2 border-emerald-500 rounded-full opacity-60"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-emerald-500 rounded-full opacity-60"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-emerald-500 rounded-full opacity-60"></div>
    </div>
  )
}
