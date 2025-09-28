"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface OfflineHandlerOptions {
  showNotifications?: boolean
  autoRetry?: boolean
  retryInterval?: number
  maxRetries?: number
  onOffline?: () => void
  onOnline?: () => void
}

export function useOfflineHandler(options: OfflineHandlerOptions = {}) {
  const {
    showNotifications = true,
    autoRetry = true,
    retryInterval = 5000,
    maxRetries = 10,
    onOffline,
    onOnline
  } = options

  const [isOffline, setIsOffline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [pendingActions, setPendingActions] = useState<Array<() => Promise<any>>>([])
  
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  // 오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setRetryCount(0)
      onOnline?.()
      
      if (showNotifications) {
        toast({
          title: "연결 복구됨",
          description: "인터넷 연결이 복구되었습니다.",
        })
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      onOffline?.()
      
      if (showNotifications) {
        toast({
          title: "오프라인 상태",
          description: "인터넷 연결이 끊어졌습니다. 연결이 복구되면 자동으로 동기화됩니다.",
          variant: "destructive",
        })
      }
    }

    // 초기 상태 설정
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showNotifications, onOffline, onOnline, toast])

  // 오프라인 상태에서 실행할 액션 큐에 추가
  const queueAction = useCallback((action: () => Promise<any>) => {
    if (isOffline) {
      setPendingActions(prev => [...prev, action])
      return Promise.resolve({ success: false, error: 'Offline - action queued' })
    }
    return action()
  }, [isOffline])

  // 대기 중인 액션들 실행
  const executePendingActions = useCallback(async () => {
    if (pendingActions.length === 0) return

    const actions = [...pendingActions]
    setPendingActions([])

    const results = await Promise.allSettled(
      actions.map(action => action())
    )

    const failedActions = results
      .map((result, index) => ({ result, action: actions[index] }))
      .filter(({ result }) => result.status === 'rejected')

    if (failedActions.length > 0) {
      // 실패한 액션들을 다시 큐에 추가
      setPendingActions(prev => [
        ...prev,
        ...failedActions.map(({ action }) => action)
      ])
    }
  }, [pendingActions])

  // 자동 재시도 로직
  useEffect(() => {
    if (!isOffline || !autoRetry || retryCount >= maxRetries) {
      return
    }

    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1)
      executePendingActions()
    }, retryInterval)

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [isOffline, autoRetry, retryCount, maxRetries, retryInterval, executePendingActions])

  // 온라인 상태로 복구 시 대기 중인 액션 실행
  useEffect(() => {
    if (!isOffline && pendingActions.length > 0) {
      executePendingActions()
    }
  }, [isOffline, pendingActions.length, executePendingActions])

  // 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    isOffline,
    retryCount,
    pendingActionsCount: pendingActions.length,
    queueAction,
    executePendingActions,
    clearPendingActions: () => setPendingActions([])
  }
}

// 오프라인 데이터 저장소
export class OfflineStorage {
  private static instance: OfflineStorage
  private storage: Map<string, any> = new Map()

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  set(key: string, value: any): void {
    this.storage.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key: string): any {
    const item = this.storage.get(key)
    if (!item) return null

    // 1시간 이상 된 데이터는 무효화
    if (Date.now() - item.timestamp > 60 * 60 * 1000) {
      this.storage.delete(key)
      return null
    }

    return item.value
  }

  remove(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    this.storage.forEach((item, key) => {
      result[key] = item.value
    })
    return result
  }
}

// 오프라인 상태에서 사용할 훅
export function useOfflineStorage() {
  const storage = OfflineStorage.getInstance()

  const setOfflineData = useCallback((key: string, value: any) => {
    storage.set(key, value)
  }, [storage])

  const getOfflineData = useCallback((key: string) => {
    return storage.get(key)
  }, [storage])

  const removeOfflineData = useCallback((key: string) => {
    storage.remove(key)
  }, [storage])

  const clearOfflineData = useCallback(() => {
    storage.clear()
  }, [storage])

  return {
    setOfflineData,
    getOfflineData,
    removeOfflineData,
    clearOfflineData
  }
}
