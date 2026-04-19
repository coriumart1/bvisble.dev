import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

interface ActiveTimer {
  taskId: number
  taskTitle: string
  entryId: number
  startedAt: Date
  elapsed: number // seconds
}

interface TimerContextValue {
  activeTimer: ActiveTimer | null
  startTimer: (taskId: number, taskTitle: string) => Promise<void>
  stopTimer: () => Promise<void>
  formatElapsed: (seconds: number) => string
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev) return null
          return { ...prev, elapsed: Math.floor((Date.now() - prev.startedAt.getTime()) / 1000) }
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeTimer?.taskId])

  async function startTimer(taskId: number, taskTitle: string): Promise<void> {
    // Stop any existing timer first
    if (activeTimer) await stopTimer()

    const startedAt = new Date()
    const entry = await window.api.time.create({
      task_id: taskId,
      started_at: startedAt.toISOString()
    })
    setActiveTimer({ taskId, taskTitle, entryId: entry.id, startedAt, elapsed: 0 })
    window.api.widget.sendTimerStarted({
      taskId,
      taskTitle,
      entryId: entry.id,
      startedAt: startedAt.toISOString()
    })
  }

  async function stopTimer(): Promise<void> {
    if (!activeTimer) return
    const duration = Math.floor((Date.now() - activeTimer.startedAt.getTime()) / 1000)
    await window.api.time.update(activeTimer.entryId, {
      ended_at: new Date().toISOString(),
      duration
    })
    setActiveTimer(null)
    window.api.widget.sendTimerStopped()
  }

  function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <TimerContext.Provider value={{ activeTimer, startTimer, stopTimer, formatElapsed }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within TimerProvider')
  return ctx
}
