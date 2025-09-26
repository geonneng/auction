"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function FloatingElements({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Floating circles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/30"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 40 - 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Floating auction elements */}
      <motion.div
        className="absolute top-20 right-20 text-emerald-500/30"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 16.5c0 2.7 1.8 4.5 4.5 4.5s4.5-1.8 4.5-4.5-1.8-4.5-4.5-4.5-4.5 1.8-4.5 4.5zM12 7V2l-1.5 1.5L12 7z"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-20 text-emerald-400/20"
        animate={{
          y: [0, -20, 0],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </motion.div>
    </div>
  )
}

export function PulsatingGradient({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-emerald-500/10 to-blue-500/10"
        animate={{
          scale: [1, 0.95, 1],
          opacity: [0.2, 0.5, 0.2],
          rotate: [0, 1, -1, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  )
}
