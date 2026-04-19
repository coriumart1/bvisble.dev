import React, { useEffect, useState } from 'react'
import { useTimer } from '../../contexts/TimerContext'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Project, Task } from '../../types'
import type { TimeEntry } from '../../../../main/db/timeEntries'

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseHHMM(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})$/)
  if (match) return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60
  const matchH = str.match(/^(\d+)h(?:\s*(\d+)m?)?$/)
  if (matchH) return parseInt(matchH[1]) * 3600 + (matchH[2] ? parseInt(matchH[2]) * 60 : 0)
  const matchM = str.match(/^(\d+)m$/)
  if (matchM) return parseInt(matchM[1]) * 60
  return null
}

interface ManualEntryFormProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  onSaved: () => void
}

function ManualEntryForm({ open, onClose, tasks, onSaved }: ManualEntryFormProps): React.JSX.Element {
  const [taskId, setTaskId] = useState<number | ''>(tasks[0]?.id ?? '')
  const [durationStr, setDurationStr] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!taskId) { setError('Task auswählen'); return }
    const duration = parseHHMM(durationStr)
    if (!duration) { setError('Format: 1:30 oder 1h 30m oder 90m'); return }
    setError('')
    setLoading(true)
    try {
      await window.api.time.create({
        task_id: taskId as number,
        description: description || undefined,
        duration,
        started_at: new Date(date).toISOString()
      })
      onSaved()
      onClose()
      setDurationStr('')
      setDescription('')
    } catch {
      setError('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Zeiteintrag hinzufügen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Task *</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 outline-none focus:border-indigo-500"
          >
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dauer * (z.B. 1:30 oder 90m)"
            placeholder="0:30"
            value={durationStr}
            onChange={(e) => setDurationStr(e.target.value)}
            error={error}
            autoFocus
          />
          <Input
            label="Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Input
          label="Beschreibung"
          placeholder="Woran wurde gearbeitet?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" loading={loading}>Hinzufügen</Button>
        </div>
      </form>
    </Modal>
  )
}

interface ProjectTimeViewProps {
  project: Project
  tasks: Task[]
}

export function ProjectTimeView({ project, tasks }: ProjectTimeViewProps): React.JSX.Element {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const { activeTimer, startTimer, stopTimer, formatElapsed } = useTimer()

  async function load(): Promise<void> {
    const [data, t] = await Promise.all([
      window.api.time.getByProject(project.id),
      window.api.time.getTotalByProject(project.id)
    ])
    setEntries(data)
    setTotal(t)
  }

  useEffect(() => { load() }, [project.id])

  // Refresh when timer stops
  useEffect(() => {
    if (!activeTimer) load()
  }, [activeTimer])

  async function handleDelete(id: number): Promise<void> {
    await window.api.time.delete(id)
    await load()
  }

  // Group entries by task
  const byTask = tasks.reduce<Record<number, { task: Task; entries: TimeEntry[]; total: number }>>(
    (acc, task) => {
      const taskEntries = entries.filter((e) => e.task_id === task.id)
      if (taskEntries.length > 0) {
        acc[task.id] = {
          task,
          entries: taskEntries,
          total: taskEntries.reduce((s, e) => s + e.duration, 0)
        }
      }
      return acc
    },
    {}
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{formatDuration(total)}</p>
            <p className="text-xs text-gray-500">Gesamt erfasst</p>
          </div>
          {activeTimer && tasks.find((t) => t.id === activeTimer.taskId) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-sm text-indigo-300 font-mono font-medium">
                {formatElapsed(activeTimer.elapsed)}
              </span>
              <span className="text-xs text-indigo-400 truncate max-w-32">{activeTimer.taskTitle}</span>
              <button
                onClick={stopTimer}
                className="px-2 py-0.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
              >
                Stop
              </button>
            </div>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setManualOpen(true)}>
          + Manuell
        </Button>
      </div>

      {/* Tasks with time */}
      {Object.keys(byTask).length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">Noch keine Zeiteinträge für dieses Projekt.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.values(byTask).map(({ task, entries: taskEntries, total: taskTotal }) => (
            <div key={task.id} className="border border-gray-800 rounded-xl overflow-hidden">
              {/* Task header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-indigo-400">{formatDuration(taskTotal)}</span>
                  {activeTimer?.taskId === task.id ? (
                    <button
                      onClick={stopTimer}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      {formatElapsed(activeTimer.elapsed)} Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => startTimer(task.id, task.title)}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors"
                    >
                      ▶ Start
                    </button>
                  )}
                </div>
              </div>
              {/* Entries */}
              <div className="divide-y divide-gray-800/50">
                {taskEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-900/50 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{formatDate(entry.created_at)}</span>
                      {entry.description && (
                        <span className="text-xs text-gray-400">{entry.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-300">{formatDuration(entry.duration)}</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timer buttons for tasks without entries */}
      <div className="mt-2">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Timer starten
        </h4>
        <div className="flex flex-wrap gap-2">
          {tasks.filter((t) => t.status !== 'done').map((task) => (
            <button
              key={task.id}
              onClick={() =>
                activeTimer?.taskId === task.id ? stopTimer() : startTimer(task.id, task.title)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                activeTimer?.taskId === task.id
                  ? 'bg-red-600/20 border-red-500/40 text-red-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-indigo-500/40 hover:text-indigo-400'
              }`}
            >
              {activeTimer?.taskId === task.id ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> {formatElapsed(activeTimer.elapsed)}</>
              ) : (
                <>▶</>
              )}
              {task.title}
            </button>
          ))}
        </div>
      </div>

      <ManualEntryForm
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        tasks={tasks}
        onSaved={load}
      />
    </div>
  )
}
