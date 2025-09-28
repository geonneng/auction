"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface ConnectionState {
  isOnline: boolean
  isConnected: boolean
  lastSuccessfulRequest: number | null
  consecutiveFailures: number
  retryCount: number
}

interface ConnectionMonitorOptions {
  maxRetries?: number
  retryDelay?: number
  maxRetryDelay?: number
  onConnectionLost?: () => void
  onConnectionRestored?: () => void
  onMaxRetriesReached?: () => void
}

export function useConnectionMonitor(options: ConnectionMonitorOptions = {}) {
  const {
    maxRetries = 10,
    retryDelay = 1000,
    maxRetryDelay = 30000,
    onConnectionLost,
    onConnectionRestored,
    onMaxRetriesReached
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: false,
    lastSuccessfulRequest: null,
    consecutiveFailures: 0,
    retryCount: 0
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({
        ...prev,
        isOnline: true,
        consecutiveFailures: 0,
        retryCount: 0
      }))
    }

    const handleOffline = () => {
      setConnectionState(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false
      }))
      onConnectionLost?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onConnectionLost])

  // 연결 상태 체크 함수
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // 간단한 헬스체크 요청
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      return response.ok
    } catch (error) {
      console.warn('[ConnectionMonitor] Health check failed:', error)
      return false
    }
  }, [])

  // 연결 복구 시도
  const attemptReconnection = useCallback(async () => {
    if (!connectionState.isOnline) {
      return
    }

    const isConnected = await checkConnection()
    
    if (isConnected) {
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        lastSuccessfulRequest: Date.now(),
        consecutiveFailures: 0,
        retryCount: 0
      }))
      onConnectionRestored?.()
    } else {
      setConnectionState(prev => {
        const newRetryCount = prev.retryCount + 1
        const newConsecutiveFailures = prev.consecutiveFailures + 1
        
        if (newRetryCount >= maxRetries) {
          onMaxRetriesReached?.()
          return {
            ...prev,
            isConnected: false,
            retryCount: newRetryCount,
            consecutiveFailures: newConsecutiveFailures
          }
        }

        // 지수 백오프 적용
        const delay = Math.min(retryDelay * Math.pow(2, newRetryCount - 1), maxRetryDelay)
        
        retryTimeoutRef.current = setTimeout(() => {
          attemptReconnection()
        }, delay)

        return {
          ...prev,
          isConnected: false,
          retryCount: newRetryCount,
          consecutiveFailures: newConsecutiveFailures
        }
      })
    }
  }, [connectionState.isOnline, checkConnection, maxRetries, retryDelay, maxRetryDelay, onConnectionRestored, onMaxRetriesReached])

  // API 요청 성공/실패 추적
  const recordRequest = useCallback((success: boolean) => {
    setConnectionState(prev => {
      if (success) {
        return {
          ...prev,
          isConnected: true,
          lastSuccessfulRequest: Date.now(),
          consecutiveFailures: 0,
          retryCount: 0
        }
      } else {
        const newConsecutiveFailures = prev.consecutiveFailures + 1
        
        if (newConsecutiveFailures >= 3 && prev.isConnected) {
          onConnectionLost?.()
        }

        return {
          ...prev,
          isConnected: false,
          consecutiveFailures: newConsecutiveFailures
        }
      }
    })
  }, [onConnectionLost])

  // 주기적 헬스체크
  useEffect(() => {
    if (connectionState.isOnline && !connectionState.isConnected) {
      heartbeatIntervalRef.current = setInterval(() => {
        checkConnection().then(isConnected => {
          if (isConnected) {
            setConnectionState(prev => ({
              ...prev,
              isConnected: true,
              lastSuccessfulRequest: Date.now(),
              consecutiveFailures: 0,
              retryCount: 0
            }))
            onConnectionRestored?.()
          }
        })
      }, 10000) // 10초마다 체크
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [connectionState.isOnline, connectionState.isConnected, checkConnection, onConnectionRestored])

  // 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [])

  return {
    connectionState,
    recordRequest,
    attemptReconnection,
    checkConnection
  }
}
