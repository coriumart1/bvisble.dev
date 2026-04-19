import React, { useState } from 'react'
import type { Task, TaskStatus, TaskPriority } from '../../types'

const priorityConfig: Record<TaskPriority, { dot: string; label: string }> = {
  high: { dot: 'bg-red-500', label: 'Hoch' },
  medium: { dot: 'bg-yellow-500', label: 'Mittel' },
  low: { dot: 'bg-gray-500', label: 'Niedrig' }
}

const statusConfig: Record<TaskStatus, { label: string; next: TaskStatus; nextLabel: string }> = {
  todo: { label: 'Todo', next: 'in_progress', nextLabel: 'Starten' },
  in_progress: { label: 'In Arbeit', next: 'done', nextLabel: 'Abschließen' },
  done: { label: 'Erledigt', next: 'todo', nextLabel: 'Wieder öffnen' }
}

interface TaskItemProps {
  task: Task
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskItem({ task, onStatusChange, onEdit, onDelete }: TaskItemProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const pCfg = priorityConfig[task.priority]
  const sCfg = statusConfig[task.status]
  const isDone = task.status === 'done'

  function formatDate(date: string | null): string | null {
    if (!date) return null
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = d < today && !isDone
    return isOverdue ? `⚠ ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}` : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  }

  const dateStr = formatDate(task.due_date)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors group ${
      isDone ? 'border-gray-800/50 bg-gray-900/30' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
        className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-indigo-600 border-indigo-600'
            : task.status === 'in_progress'
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-600 hover:border-gray-400'
        }`}
      >
        {isDone && <span className="text-white text-xs leading-none">✓</span>}
        {task.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-600' : 'text-gray-100'}`}>
          {task.title}
        </p>
        {task.description && !isDone && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className={`flex items-center gap-1 text-xs text-gray-600`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
            {pCfg.label}
          </span>
          {dateStr && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-600'}`}>
              {dateStr}
            </span>
          )}
          {task.status === 'in_progress' && (
            <span className="text-xs text-indigo-400 font-medium">In Arbeit</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {task.status !== 'done' && (
          <button
            onClick={() => onStatusChange(task, sCfg.next)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded transition-colors"
          >
            {sCfg.nextLabel}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors text-xs"
          >
            ···
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                  onClick={() => { onEdit(task); setMenuOpen(false) }}
                >
                  Bearbeiten
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                  onClick={() => { onDelete(task); setMenuOpen(false) }}
                >
                  Löschen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
