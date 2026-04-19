import React, { useEffect, useRef, useState } from 'react'
import type { Task, Milestone, Project, TaskStatus } from '../../types'

type ViewMode = 'week' | 'month' | 'quarter'

interface GanttChartProps {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'bg-gray-600',
  in_progress: 'bg-indigo-500',
  done: 'bg-emerald-500'
}

const CELL_WIDTH: Record<ViewMode, number> = {
  week: 52,
  month: 28,
  quarter: 10
}

const VIEW_DAYS: Record<ViewMode, number> = {
  week: 14,
  month: 30,
  quarter: 90
}

const VIEW_LABELS: Record<ViewMode, string> = {
  week: '2 Wochen',
  month: 'Monat',
  quarter: 'Quartal'
}

const LEFT_WIDTH = 220

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function isoToDate(s: string): Date {
  return startOfDay(new Date(s))
}

export function GanttChart({ project, tasks, milestones }: GanttChartProps): React.JSX.Element {
  const [view, setView] = useState<ViewMode>('month')
  const [rangeStart, setRangeStart] = useState<Date>(() => {
    // start from project.start_date or today
    const base = project.start_date ? isoToDate(project.start_date) : startOfDay(new Date())
    // week: align to Monday
    if (view === 'week') {
      const day = base.getDay()
      return addDays(base, -(day === 0 ? 6 : day - 1))
    }
    return base
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = startOfDay(new Date())

  const cellW = CELL_WIDTH[view]
  const days = VIEW_DAYS[view]
  const totalWidth = days * cellW

  // Re-align when view changes
  useEffect(() => {
    if (view === 'week') {
      const day = rangeStart.getDay()
      setRangeStart((prev) => addDays(prev, -(day === 0 ? 6 : day - 1)))
    }
  }, [view])

  function navigate(dir: -1 | 1): void {
    setRangeStart((prev) => addDays(prev, dir * days))
  }

  function goToToday(): void {
    setRangeStart(today)
  }

  // Build date headers
  const dateHeaders: { label: string; col: number; span: number }[] = []
  if (view === 'week' || view === 'month') {
    // Month groupings
    let i = 0
    while (i < days) {
      const d = addDays(rangeStart, i)
      const m = d.getMonth()
      const y = d.getFullYear()
      let span = 1
      while (i + span < days) {
        const nd = addDays(rangeStart, i + span)
        if (nd.getMonth() !== m) break
        span++
      }
      dateHeaders.push({
        label: `${['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][m]} ${y}`,
        col: i,
        span
      })
      i += span
    }
  } else {
    // Quarter: week groupings
    let i = 0
    while (i < days) {
      const d = addDays(rangeStart, i)
      const kw = getWeekNumber(d)
      dateHeaders.push({ label: `KW ${kw}`, col: i, span: 7 })
      i += 7
    }
  }

  function getWeekNumber(d: Date): number {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
    const week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  }

  // Bar helpers
  function getBar(start: string | null, end: string | null): { left: number; width: number } | null {
    if (!end) return null
    const s = start ? isoToDate(start) : rangeStart
    const e = isoToDate(end)
    const left = diffDays(rangeStart, s) * cellW
    const width = Math.max(cellW, diffDays(s, e) * cellW)
    return { left, width }
  }

  function getMilestonePos(date: string | null): number | null {
    if (!date) return null
    const d = isoToDate(date)
    return diffDays(rangeStart, d) * cellW + cellW / 2
  }

  const todayX = diffDays(rangeStart, today) * cellW

  const rangeEnd = addDays(rangeStart, days)

  // Filter items that have any date in range
  const visibleTasks = tasks.filter((t) => {
    if (!t.due_date && !t.created_at) return false
    const end = t.due_date ? isoToDate(t.due_date) : null
    const start = isoToDate(t.created_at)
    if (end && end < rangeStart) return false
    if (start > rangeEnd) return false
    return true
  })

  const visibleMilestones = milestones.filter((m) => {
    if (!m.due_date) return false
    const d = isoToDate(m.due_date)
    return d >= rangeStart && d <= rangeEnd
  })

  const hasItems = visibleTasks.length > 0 || visibleMilestones.length > 0

  return (
    <div className="flex flex-col h-full select-none">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 mb-3">
        <div className="flex bg-gray-800 rounded-lg p-0.5">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === v ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >‹</button>
          <button
            onClick={goToToday}
            className="px-2 h-7 text-xs text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >Heute</button>
          <button
            onClick={() => navigate(1)}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >›</button>
        </div>
        <span className="text-xs text-gray-600 ml-1">
          {rangeStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} –{' '}
          {addDays(rangeStart, days - 1).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-hidden flex flex-col border border-gray-800 rounded-xl">
        {/* Header row */}
        <div className="shrink-0 flex border-b border-gray-800 bg-gray-900/60">
          {/* Name column */}
          <div style={{ width: LEFT_WIDTH, minWidth: LEFT_WIDTH }} className="shrink-0 px-4 py-2 text-xs text-gray-600 border-r border-gray-800">
            Aufgabe / Meilenstein
          </div>
          {/* Date header */}
          <div className="flex-1 overflow-hidden">
            <div ref={scrollRef} className="overflow-x-auto">
              <div style={{ width: totalWidth }} className="relative">
                {/* Month/KW labels */}
                <div className="flex border-b border-gray-800/50 h-6">
                  {dateHeaders.map((h) => (
                    <div
                      key={h.col}
                      style={{ width: h.span * cellW, minWidth: h.span * cellW }}
                      className="text-xs text-gray-500 px-2 flex items-center border-r border-gray-800/30 truncate"
                    >
                      {h.label}
                    </div>
                  ))}
                </div>
                {/* Day numbers */}
                <div className="flex h-6">
                  {Array.from({ length: days }).map((_, i) => {
                    const d = addDays(rangeStart, i)
                    const isToday = diffDays(rangeStart, today) === i
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    return (
                      <div
                        key={i}
                        style={{ width: cellW, minWidth: cellW }}
                        className={`flex items-center justify-center text-xs border-r border-gray-800/20 ${
                          isToday ? 'text-indigo-400 font-bold' :
                          isWeekend ? 'text-gray-700' : 'text-gray-600'
                        }`}
                      >
                        {view !== 'quarter' ? d.getDate() : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!hasItems ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Keine Tasks oder Meilensteine mit Datum im gewählten Zeitraum.
            </div>
          ) : (
            <>
              {/* Tasks */}
              {visibleTasks.map((task) => {
                const bar = getBar(task.created_at, task.due_date)
                const isOverdue = task.due_date && isoToDate(task.due_date) < today && task.status !== 'done'
                return (
                  <div key={task.id} className="flex border-b border-gray-800/40 hover:bg-gray-900/30 group" style={{ height: 40 }}>
                    {/* Name */}
                    <div
                      style={{ width: LEFT_WIDTH, minWidth: LEFT_WIDTH }}
                      className="shrink-0 flex items-center px-4 border-r border-gray-800/40 gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[task.status]}`} />
                      <span className={`text-xs truncate ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                        {task.title}
                      </span>
                    </div>
                    {/* Bar area */}
                    <div className="flex-1 overflow-hidden relative">
                      <div style={{ width: totalWidth }} className="relative h-full">
                        {/* Grid lines */}
                        {Array.from({ length: days }).map((_, i) => {
                          const d = addDays(rangeStart, i)
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6
                          return (
                            <div
                              key={i}
                              style={{ left: i * cellW, width: cellW }}
                              className={`absolute inset-y-0 border-r border-gray-800/20 ${isWeekend ? 'bg-gray-800/10' : ''}`}
                            />
                          )
                        })}
                        {/* Today line */}
                        {todayX >= 0 && todayX <= totalWidth && (
                          <div
                            style={{ left: todayX }}
                            className="absolute inset-y-0 w-px bg-indigo-500/50 z-10"
                          />
                        )}
                        {/* Bar */}
                        {bar && (
                          <div
                            style={{
                              left: Math.max(0, bar.left),
                              width: bar.left < 0 ? bar.width + bar.left : bar.width,
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                            className={`absolute h-5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity ${
                              isOverdue ? 'bg-red-600' : STATUS_COLOR[task.status]
                            }`}
                            title={`${task.title} — fällig: ${task.due_date}`}
                          />
                        )}
                        {/* No-date marker */}
                        {!task.due_date && (
                          <div
                            style={{ left: Math.max(0, diffDays(rangeStart, isoToDate(task.created_at)) * cellW), top: '50%', transform: 'translateY(-50%)' }}
                            className="absolute w-2 h-2 rounded-full bg-gray-600"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Milestones */}
              {visibleMilestones.map((m) => {
                const x = getMilestonePos(m.due_date)
                const d = m.due_date ? isoToDate(m.due_date) : null
                const isOverdue = d && d < today && m.completed === 0
                return (
                  <div key={m.id} className="flex border-b border-gray-800/40 hover:bg-gray-900/30" style={{ height: 40 }}>
                    <div
                      style={{ width: LEFT_WIDTH, minWidth: LEFT_WIDTH }}
                      className="shrink-0 flex items-center px-4 border-r border-gray-800/40 gap-2"
                    >
                      <span className={`text-sm ${m.completed === 1 ? 'text-emerald-500' : isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>⚑</span>
                      <span className={`text-xs truncate ${m.completed === 1 ? 'text-gray-600 line-through' : isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                        {m.name}
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                      <div style={{ width: totalWidth }} className="relative h-full">
                        {Array.from({ length: days }).map((_, i) => {
                          const dd = addDays(rangeStart, i)
                          const isWeekend = dd.getDay() === 0 || dd.getDay() === 6
                          return (
                            <div
                              key={i}
                              style={{ left: i * cellW, width: cellW }}
                              className={`absolute inset-y-0 border-r border-gray-800/20 ${isWeekend ? 'bg-gray-800/10' : ''}`}
                            />
                          )
                        })}
                        {todayX >= 0 && todayX <= totalWidth && (
                          <div style={{ left: todayX }} className="absolute inset-y-0 w-px bg-indigo-500/50 z-10" />
                        )}
                        {x !== null && x >= 0 && x <= totalWidth && (
                          <div
                            style={{ left: x - 7, top: '50%', transform: 'translateY(-50%) rotate(45deg)' }}
                            className={`absolute w-3.5 h-3.5 border-2 ${
                              m.completed === 1 ? 'bg-emerald-500 border-emerald-400' :
                              isOverdue ? 'bg-red-600 border-red-400' : 'bg-yellow-500 border-yellow-400'
                            }`}
                            title={`${m.name} — ${m.due_date}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="shrink-0 flex items-center gap-4 mt-2 px-1">
        {[
          { color: 'bg-gray-600', label: 'Todo' },
          { color: 'bg-indigo-500', label: 'In Arbeit' },
          { color: 'bg-emerald-500', label: 'Erledigt' },
          { color: 'bg-red-600', label: 'Überfällig' }
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-yellow-400 bg-yellow-500 rotate-45 inline-block" />
          <span className="text-xs text-gray-600">Meilenstein</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-px h-3 bg-indigo-500/70 inline-block" />
          <span className="text-xs text-gray-600">Heute</span>
        </div>
      </div>
    </div>
  )
}
