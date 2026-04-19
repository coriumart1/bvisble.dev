import React, { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import type { Task, TaskStatus } from '../../types'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onQuickAdd: (status: TaskStatus, title: string) => Promise<void>
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onQuickAdd
}: KanbanBoardProps): React.JSX.Element {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Sync with parent when tasks prop changes
  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function getTasksByStatus(status: TaskStatus): Task[] {
    return localTasks.filter((t) => t.status === status)
  }

  function findTaskStatus(taskId: number): TaskStatus | undefined {
    return localTasks.find((t) => t.id === taskId)?.status
  }

  function handleDragStart(event: DragStartEvent): void {
    const task = localTasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent): void {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as number
    const overId = over.id

    const activeStatus = findTaskStatus(activeId)

    // over is a column
    if (COLUMNS.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus
      if (activeStatus === newStatus) return
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
      )
      return
    }

    // over is a card
    const overStatus = findTaskStatus(overId as number)
    if (!overStatus || !activeStatus) return

    if (activeStatus !== overStatus) {
      // Move to new column at the position of the hovered card
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overStatus } : t))
      )
    } else {
      // Reorder within same column
      const colTasks = localTasks.filter((t) => t.status === activeStatus)
      const activeIdx = colTasks.findIndex((t) => t.id === activeId)
      const overIdx = colTasks.findIndex((t) => t.id === overId)
      if (activeIdx !== overIdx) {
        const reordered = arrayMove(colTasks, activeIdx, overIdx)
        setLocalTasks((prev) => {
          const others = prev.filter((t) => t.status !== activeStatus)
          return [...others, ...reordered]
        })
      }
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active } = event
    const activeId = active.id as number
    const newStatus = localTasks.find((t) => t.id === activeId)?.status
    const originalStatus = tasks.find((t) => t.id === activeId)?.status

    if (newStatus && newStatus !== originalStatus) {
      const task = tasks.find((t) => t.id === activeId)
      if (task) onStatusChange(task, newStatus)
    }

    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 h-full overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <KanbanCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
