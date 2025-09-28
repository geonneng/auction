import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 기본 헬스체크
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error('[Health] Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

export async function HEAD() {
  // 간단한 헬스체크 (연결 상태만 확인)
  return new NextResponse(null, { status: 200 })
}
