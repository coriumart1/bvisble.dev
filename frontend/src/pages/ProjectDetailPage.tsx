import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { TaskItem } from '../components/tasks/TaskItem'
import { TaskForm } from '../components/tasks/TaskForm'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { ProjectMilestones } from '../components/milestones/ProjectMilestones'
import { GanttChart } from '../components/gantt/GanttChart'
import { ProjectNotes } from '../components/notes/ProjectNotes'
import { ProjectTimeView } from '../components/time/ProjectTimeView'
import { ReportModal } from '../components/pdf/ReportModal'
import { Button } from '../components/ui/Button'
import type { Project, Task, Milestone, TaskStatus, TaskPriority } from '../types'

type View = 'list' | 'kanban' | 'milestones' | 'gantt' | 'notes' | 'time'

const statusGroups: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'In Arbeit' },
  { status: 'done', label: 'Erledigt' }
]

interface ProjectDetailPageProps {
  project: Project
  onBack: () => void
}

export function ProjectDetailPage({ project, onBack }: ProjectDetailPageProps): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()
  const [reportOpen, setReportOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all')

  async function load(): Promise<void> {
    const [taskData, milestoneData] = await Promise.all([
      api.tasks.getByProject(project.id),
      api.milestones.getByProject(project.id)
    ])
    setTasks(taskData)
    setMilestones(milestoneData)
    setLoading(false)
  }

  useEffect(() => { load() }, [project.id])

  async function handleCreate(data: {
    title: string
    description?: string
    priority: TaskPriority
    due_date?: string
  }): Promise<void> {
    await api.tasks.create({ project_id: project.id, ...data })
    await load()
  }

  async function handleEdit(data: {
    title: string
    description?: string
    priority: TaskPriority
    due_date?: string
  }): Promise<void> {
    if (!editTask) return
    await api.tasks.update(editTask.id, data)
    setEditTask(undefined)
    await load()
  }

  async function handleStatusChange(task: Task, status: TaskStatus): Promise<void> {
    await api.tasks.update(task.id, { status })
    await load()
  }

  async function handleDelete(task: Task): Promise<void> {
    await api.tasks.delete(task.id)
    await load()
  }

  async function handleQuickAdd(status: TaskStatus, title: string): Promise<void> {
    await api.tasks.create({ project_id: project.id, title, status, priority: 'medium' })
    await load()
  }

  const todoCount = tasks.filter((t) => t.status === 'todo').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  const filtered = activeFilter === 'all' ? tasks : tasks.filter((t) => t.status === activeFilter)
  const groupedTasks = statusGroups.reduce<Record<TaskStatus, Task[]>>(
    (acc, { status }) => { acc[status] = filtered.filter((t) => t.status === status); return acc },
    { todo: [], in_progress: [], done: [] }
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3 px-6 h-14">
          <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Projekte
          </button>
          <span className="text-gray-700">/</span>
          <h2 className="text-base font-semibold text-white truncate">{project.name}</h2>
          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {([
                { id: 'list', label: '☰ Liste' },
                { id: 'kanban', label: '⊞ Kanban' },
                { id: 'milestones', label: '⚑ Meilensteine' },
                { id: 'gantt', label: '▦ Gantt' },
                { id: 'notes', label: '✎ Notizen' },
                { id: 'time', label: '◷ Zeit' }
              ] as { id: View; label: string }[]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    view === v.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setReportOpen(true)}>↓ Bericht</Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>+ Neuer Task</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 px-6 pb-3">
          {[
            { label: 'Todo', count: todoCount, filter: 'todo' as TaskStatus },
            { label: 'In Arbeit', count: inProgressCount, filter: 'in_progress' as TaskStatus },
            { label: 'Erledigt', count: doneCount, filter: 'done' as TaskStatus },
            { label: 'Gesamt', count: tasks.length, filter: 'all' as const }
          ].map(({ label, count, filter }) => (
            <button
              key={filter}
              onClick={() => { setActiveFilter(filter); setView('list') }}
              className={`flex flex-col items-start transition-colors ${
                activeFilter === filter && view === 'list' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <span className="text-xl font-bold">{count}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className={`flex-1 overflow-auto ${view === 'notes' ? 'overflow-hidden p-0' : view === 'kanban' ? 'px-6 py-5' : 'px-6 py-4'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Lade...</div>
        ) : view === 'milestones' ? (
          <ProjectMilestones project={project} />
        ) : view === 'gantt' ? (
          <GanttChart project={project} tasks={tasks} milestones={milestones} />
        ) : view === 'notes' ? (
          <ProjectNotes project={project} />
        ) : view === 'time' ? (
          <ProjectTimeView project={project} tasks={tasks} />
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={(t) => setEditTask(t)}
            onDelete={handleDelete}
            onQuickAdd={handleQuickAdd}
          />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <p className="text-gray-600 text-sm">Noch keine Tasks. Leg den ersten an.</p>
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              Ersten Task erstellen
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {statusGroups.map(({ status, label }) => {
              const group = groupedTasks[status]
              if (activeFilter !== 'all' && activeFilter !== status) return null
              if (group.length === 0 && activeFilter === 'all') return null
              return (
                <section key={status}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {label} <span className="text-gray-700 font-normal normal-case">({group.length})</span>
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {group.length === 0 ? (
                      <p className="text-xs text-gray-700 px-4 py-2">Keine Tasks</p>
                    ) : (
                      group.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onEdit={(t) => setEditTask(t)}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} project={project} />

      {editTask && (
        <TaskForm
          open={!!editTask}
          onClose={() => setEditTask(undefined)}
          onSave={handleEdit}
          task={editTask}
        />
      )}
    </div>
  )
}
