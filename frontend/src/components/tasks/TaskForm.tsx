import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Task, TaskPriority } from '../../types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description?: string
    priority: TaskPriority
    due_date?: string
  }) => Promise<void>
  task?: Task
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Hoch', color: 'text-red-400' },
  { value: 'medium', label: 'Mittel', color: 'text-yellow-400' },
  { value: 'low', label: 'Niedrig', color: 'text-gray-400' }
]

export function TaskForm({ open, onClose, onSave, task }: TaskFormProps): React.JSX.Element {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!title.trim()) { setError('Titel ist erforderlich'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined
      })
      onClose()
      if (!task) {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setDueDate('')
      }
    } catch {
      setError('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Task bearbeiten' : 'Neuer Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Titel *"
          placeholder="Was muss erledigt werden?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label="Beschreibung"
          placeholder="Details, Kontext, Notizen..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Priorität</label>
            <div className="flex gap-1">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    priority === p.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Fälligkeitsdatum"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" loading={loading}>
            {task ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
