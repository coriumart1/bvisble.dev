import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { Task, TaskStatus } from '../../types'

const columnConfig: Record<TaskStatus, { label: string; accent: string; counter: string }> = {
  todo: {
    label: 'Todo',
    accent: 'border-t-gray-600',
    counter: 'bg-gray-700 text-gray-300'
  },
  in_progress: {
    label: 'In Arbeit',
    accent: 'border-t-indigo-500',
    counter: 'bg-indigo-500/20 text-indigo-300'
  },
  done: {
    label: 'Erledigt',
    accent: 'border-t-emerald-500',
    counter: 'bg-emerald-500/20 text-emerald-300'
  }
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onQuickAdd: (status: TaskStatus, title: string) => void
}

export function KanbanColumn({
  status,
  tasks,
  onEdit,
  onDelete,
  onQuickAdd
}: KanbanColumnProps): React.JSX.Element {
  const [quickTitle, setQuickTitle] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: status })
  const cfg = columnConfig[status]
  const taskIds = tasks.map((t) => t.id)

  function handleQuickAdd(e: React.FormEvent): void {
    e.preventDefault()
    if (!quickTitle.trim()) return
    onQuickAdd(status, quickTitle.trim())
    setQuickTitle('')
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-300">{cfg.label}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.counter}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors text-sm"
          title="Task hinzufügen"
        >
          +
        </button>
      </div>

      {/* Drop zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-24 p-2 rounded-xl transition-colors ${
            isOver ? 'bg-gray-800/60 ring-1 ring-indigo-500/40' : 'bg-gray-900/30'
          }`}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}

          {tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-16 text-xs text-gray-700">
              Hierher ziehen
            </div>
          )}
        </div>
      </SortableContext>

      {/* Quick add form */}
      {addOpen && (
        <form onSubmit={handleQuickAdd} className="mt-2">
          <input
            autoFocus
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAddOpen(false)}
            placeholder="Task-Titel..."
            className="w-full px-3 py-2 bg-gray-800 border border-indigo-500 rounded-lg text-sm text-gray-100 placeholder-gray-600 outline-none"
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              type="submit"
              className="flex-1 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
            >
              Hinzufügen
            </button>
            <button
              type="button"
              onClick={() => { setAddOpen(false); setQuickTitle('') }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
