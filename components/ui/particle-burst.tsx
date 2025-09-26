"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export function ParticleBurst() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const createParticle = (x: number, y: number) => {
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      return {
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        color,
        size: Math.random() * 4 + 2
      }
    }

    const animate = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.2, // gravity
            life: particle.life - 1
          }))
          .filter(particle => particle.life > 0)
      )
    }

    const interval = setInterval(animate, 16)
    
    // Create initial burst
    const initialParticles = Array.from({ length: 20 }, () => 
      createParticle(window.innerWidth / 2, window.innerHeight / 2)
    )
    setParticles(initialParticles)

    // Create periodic bursts
    const burstInterval = setInterval(() => {
      const newParticles = Array.from({ length: 15 }, () => 
        createParticle(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2
        )
      )
      setParticles(prev => [...prev, ...newParticles])
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(burstInterval)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: `scale(${particle.life / particle.maxLife})`
          }}
        />
      ))}
    </div>
  )
}
