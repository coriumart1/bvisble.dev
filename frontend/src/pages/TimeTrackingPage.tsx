import React, { useEffect, useState } from 'react'
import { useTimer } from '../contexts/TimerContext'
import type { TimeEntry } from '../../../main/db/timeEntries'

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d >= today) return 'Heute'
  if (d >= yesterday) return 'Gestern'
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
}

export function TimeTrackingPage(): React.JSX.Element {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { activeTimer, stopTimer, formatElapsed } = useTimer()

  async function load(): Promise<void> {
    const data = await window.api.time.getAll()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (!activeTimer) load() }, [activeTimer])

  async function handleDelete(id: number): Promise<void> {
    await window.api.time.delete(id)
    await load()
  }

  // Group by date
  const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    const key = e.created_at.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const totalAll = entries.reduce((s, e) => s + e.duration, 0)

  // Group by project for summary
  const byProject = entries.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
    const key = String(e.project_id)
    if (!acc[key]) acc[key] = { name: e.project_name ?? 'Unbekannt', total: 0 }
    acc[key].total += e.duration
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 flex items-center px-6 h-14 border-b border-gray-800">
        <h2 className="text-base font-semibold text-white">Zeiterfassung</h2>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6 items-start">
          {/* Left: active timer + stats */}
          <div className="shrink-0 w-64 flex flex-col gap-4">
            {/* Active timer */}
            {activeTimer ? (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Läuft</span>
                </div>
                <p className="text-3xl font-bold font-mono text-white mb-1">
                  {formatElapsed(activeTimer.elapsed)}
                </p>
                <p className="text-xs text-gray-400 truncate mb-3">{activeTimer.taskTitle}</p>
                <button
                  onClick={stopTimer}
                  className="w-full py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  ■ Stop
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-600 text-center">Kein Timer aktiv.<br/>Timer im Projekt starten.</p>
              </div>
            )}

            {/* Total */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Gesamt erfasst</p>
              <p className="text-2xl font-bold text-white">{formatDuration(totalAll)}</p>
            </div>

            {/* By project */}
            {Object.keys(byProject).length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nach Projekt</p>
                <div className="flex flex-col gap-2">
                  {Object.values(byProject)
                    .sort((a, b) => b.total - a.total)
                    .map(({ name, total }) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate flex-1">{name}</span>
                        <span className="text-xs font-medium text-gray-300 ml-2">{formatDuration(total)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: entry log */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Protokoll</h3>
            {loading ? (
              <p className="text-gray-600 text-sm">Lade...</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-600 text-sm">Noch keine Zeiteinträge. Timer im Projekt starten.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {Object.entries(grouped)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([date, dayEntries]) => {
                    const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0)
                    return (
                      <div key={date}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-gray-500">{formatDate(date)}</h4>
                          <span className="text-xs text-gray-500">{formatDuration(dayTotal)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {dayEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 group transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-200 truncate">{entry.task_title}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {entry.project_name}
                                    {entry.description && ` · ${entry.description}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <span className="text-sm font-medium text-gray-300">{formatDuration(entry.duration)}</span>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm transition-all"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
