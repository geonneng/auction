"use client"

import { useEffect, useRef, useCallback } from 'react'

interface CleanupOptions {
  onUnmount?: () => void
  onPageHide?: () => void
  onBeforeUnload?: () => void
  intervalCleanup?: boolean
  eventCleanup?: boolean
}

export function useCleanup(options: CleanupOptions = {}) {
  const {
    onUnmount,
    onPageHide,
    onBeforeUnload,
    intervalCleanup = true,
    eventCleanup = true
  } = options

  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const eventListenersRef = useRef<Array<{ element: EventTarget; event: string; handler: EventListener }>>([])

  // 안전한 interval 생성
  const createInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = setInterval(callback, delay)
    intervalsRef.current.add(interval)
    return interval
  }, [])

  // 안전한 timeout 생성
  const createTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeout = setTimeout(callback, delay)
    timeoutsRef.current.add(timeout)
    return timeout
  }, [])

  // 안전한 이벤트 리스너 추가
  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options)
    eventListenersRef.current.push({ element, event, handler })
  }, [])

  // 정리 함수
  const cleanup = useCallback(() => {
    // 모든 interval 정리
    if (intervalCleanup) {
      intervalsRef.current.forEach(interval => {
        clearInterval(interval)
      })
      intervalsRef.current.clear()
    }

    // 모든 timeout 정리
    timeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout)
    })
    timeoutsRef.current.clear()

    // 모든 이벤트 리스너 정리
    if (eventCleanup) {
      eventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
      eventListenersRef.current = []
    }

    // 사용자 정의 정리 함수 실행
    onUnmount?.()
  }, [intervalCleanup, eventCleanup, onUnmount])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 페이지 숨김 시 정리
  useEffect(() => {
    if (!onPageHide) return

    const handlePageHide = () => {
      onPageHide()
    }

    addEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide()
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', handlePageHide)
    }
  }, [onPageHide, addEventListener])

  // 페이지 언로드 시 정리
  useEffect(() => {
    if (!onBeforeUnload) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      onBeforeUnload()
      // 일부 브라우저에서는 기본 동작을 막아야 함
      event.preventDefault()
      event.returnValue = ''
    }

    addEventListener(window, 'beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [onBeforeUnload, addEventListener])

  return {
    createInterval,
    createTimeout,
    addEventListener,
    cleanup
  }
}

// 메모리 사용량 모니터링
export function useMemoryMonitor(threshold = 100 * 1024 * 1024) { // 100MB
  const memoryRef = useRef<number[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMemory = memory.usedJSHeapSize
        
        memoryRef.current.push(usedMemory)
        
        // 최근 10개 측정값만 유지
        if (memoryRef.current.length > 10) {
          memoryRef.current.shift()
        }

        // 메모리 사용량이 임계값을 초과하면 경고
        if (usedMemory > threshold) {
          console.warn(`[MemoryMonitor] High memory usage: ${Math.round(usedMemory / 1024 / 1024)}MB`)
        }

        // 메모리 사용량이 계속 증가하는지 확인
        if (memoryRef.current.length >= 5) {
          const recent = memoryRef.current.slice(-5)
          const isIncreasing = recent.every((val, i) => i === 0 || val >= recent[i - 1])
          
          if (isIncreasing) {
            console.warn('[MemoryMonitor] Memory usage is continuously increasing')
          }
        }
      }
    }

    const interval = setInterval(checkMemory, 30000) // 30초마다 체크

    return () => {
      clearInterval(interval)
    }
  }, [threshold])

  return {
    getMemoryUsage: () => {
      if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
        return null
      }
      return (performance as any).memory.usedJSHeapSize
    },
    getMemoryHistory: () => [...memoryRef.current]
  }
}
