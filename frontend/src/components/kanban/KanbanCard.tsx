import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskPriority } from '../../types'

const priorityDot: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500'
}

interface KanbanCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function KanbanCard({ task, onEdit, onDelete }: KanbanCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  function formatDate(date: string | null): string | null {
    if (!date) return null
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return `⚠ ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  }

  const dateStr = formatDate(task.due_date)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-900 border border-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing group hover:border-gray-700 transition-colors select-none"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-100 font-medium leading-snug flex-1">{task.title}</p>
        {/* Kebab menu — stopPropagation so drag doesn't trigger */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <KanbanCardMenu task={task} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
        {dateStr && (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-600'}`}>
            {dateStr}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanCardMenu({
  task,
  onEdit,
  onDelete
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <button
        className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded text-xs"
        onClick={() => setOpen(!open)}
      >
        ···
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
              onClick={() => { onEdit(task); setOpen(false) }}
            >
              Bearbeiten
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
              onClick={() => { onDelete(task); setOpen(false) }}
            >
              Löschen
            </button>
          </div>
        </>
      )}
    </div>
  )
}
