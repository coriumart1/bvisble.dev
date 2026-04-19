import React, { useState } from 'react'
import type { Milestone } from '../../types'

interface MilestoneItemProps {
  milestone: Milestone
  projectName?: string
  onToggle: (milestone: Milestone) => void
  onEdit: (milestone: Milestone) => void
  onDelete: (milestone: Milestone) => void
}

export function MilestoneItem({ milestone, projectName, onToggle, onEdit, onDelete }: MilestoneItemProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDone = milestone.completed === 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = milestone.due_date ? new Date(milestone.due_date) : null
  const isOverdue = dueDate && dueDate < today && !isDone
  const isSoon = dueDate && !isOverdue && !isDone &&
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 7

  function formatDate(d: Date): string {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors group ${
      isDone ? 'border-gray-800/50 bg-gray-900/20' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
    }`}>
      {/* Flag icon / toggle */}
      <button
        onClick={() => onToggle(milestone)}
        className={`mt-0.5 shrink-0 text-base transition-colors ${
          isDone ? 'text-emerald-500' : isOverdue ? 'text-red-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-400'
        }`}
        title={isDone ? 'Als offen markieren' : 'Als erreicht markieren'}
      >
        {isDone ? '⚑' : '⚐'}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-600' : 'text-gray-100'}`}>
          {milestone.name}
        </p>
        {milestone.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{milestone.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {projectName && (
            <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
              {projectName}
            </span>
          )}
          {dueDate && (
            <span className={`text-xs font-medium ${
              isDone ? 'text-gray-600' :
              isOverdue ? 'text-red-400' :
              isSoon ? 'text-yellow-400' :
              'text-gray-500'
            }`}>
              {isOverdue && '⚠ '}
              {isSoon && '⏰ '}
              {formatDate(dueDate)}
            </span>
          )}
          {isOverdue && <span className="text-xs text-red-500">Überfällig</span>}
          {isSoon && <span className="text-xs text-yellow-500">Bald fällig</span>}
        </div>
      </div>

      {/* Menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded text-xs"
        >
          ···
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-7 z-20 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                onClick={() => { onEdit(milestone); setMenuOpen(false) }}
              >
                Bearbeiten
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                onClick={() => { onDelete(milestone); setMenuOpen(false) }}
              >
                Löschen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
