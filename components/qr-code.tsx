"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export default function QRCodeComponent({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      }).catch((err) => {
        console.error("QR Code generation error:", err)
      })
    }
  }, [value, size])

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <canvas ref={canvasRef} />
      <p className="text-xs text-muted-foreground text-center">
        스마트폰으로 스캔하여 참여하세요
      </p>
    </div>
  )
}
