import React, { useEffect, useState } from 'react'
import { MilestoneItem } from '../components/milestones/MilestoneItem'
import type { Milestone } from '../types'

type MilestoneWithProject = Milestone & { project_name: string }

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export function MilestonesPage(): React.JSX.Element {
  const [milestones, setMilestones] = useState<MilestoneWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  async function load(): Promise<void> {
    const data = await window.api.milestones.getAll()
    setMilestones(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleToggle(milestone: Milestone): Promise<void> {
    await window.api.milestones.update(milestone.id, { completed: milestone.completed === 1 ? 0 : 1 })
    await load()
  }

  async function handleDelete(milestone: Milestone): Promise<void> {
    await window.api.milestones.delete(milestone.id)
    await load()
  }

  // Calendar helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  // Monday-based week (0=Mo, 6=So)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function toIso(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  // Map date -> milestones
  const milestonesByDate = milestones.reduce<Record<string, MilestoneWithProject[]>>((acc, m) => {
    if (!m.due_date) return acc
    const key = m.due_date.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  function prevMonth(): void {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function nextMonth(): void {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const selectedMilestones = selectedDay ? (milestonesByDate[selectedDay] ?? []) : []

  // Upcoming (next 30 days, not completed)
  const upcoming = milestones
    .filter((m) => {
      if (m.completed === 1 || !m.due_date) return false
      const d = new Date(m.due_date)
      const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= -1 && diff <= 30
    })
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 flex items-center px-6 h-14 border-b border-gray-800">
        <h2 className="text-base font-semibold text-white">Meilensteine</h2>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6 items-start">
          {/* Calendar */}
          <div className="shrink-0 w-80">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-white">
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  ›
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - startOffset + 1
                  if (dayNum < 1 || dayNum > daysInMonth) {
                    return <div key={idx} />
                  }
                  const dayDate = new Date(year, month, dayNum)
                  const iso = toIso(dayDate)
                  const isToday = iso === toIso(today)
                  const isSelected = iso === selectedDay
                  const dayMilestones = milestonesByDate[iso] ?? []
                  const hasMilestone = dayMilestones.length > 0
                  const hasOverdue = dayMilestones.some((m) => m.completed === 0 && dayDate < today)

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDay(isSelected ? null : iso)}
                      className={`relative flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : isToday
                          ? 'bg-gray-800 text-white font-bold'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {dayNum}
                      {hasMilestone && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' :
                          hasOverdue ? 'bg-red-400' : 'bg-indigo-400'
                        }`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected day details */}
            {selectedDay && (
              <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 mb-3">
                  {new Date(selectedDay).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
                {selectedMilestones.length === 0 ? (
                  <p className="text-xs text-gray-600">Keine Meilensteine</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selectedMilestones.map((m) => (
                      <MilestoneItem
                        key={m.id}
                        milestone={m}
                        projectName={m.project_name}
                        onToggle={handleToggle}
                        onEdit={() => {}}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming list */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Nächste 30 Tage
              {upcoming.length > 0 && <span className="ml-2 text-gray-600 font-normal">({upcoming.length})</span>}
            </h3>

            {loading ? (
              <p className="text-gray-600 text-sm">Lade...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-gray-600 text-sm">Keine anstehenden Meilensteine.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {upcoming.map((m) => (
                  <MilestoneItem
                    key={m.id}
                    milestone={m}
                    projectName={m.project_name}
                    onToggle={handleToggle}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
