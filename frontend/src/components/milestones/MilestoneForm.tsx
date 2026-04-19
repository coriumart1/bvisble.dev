import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Milestone } from '../../types'

interface MilestoneFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string; due_date?: string }) => Promise<void>
  milestone?: Milestone
}

export function MilestoneForm({ open, onClose, onSave, milestone }: MilestoneFormProps): React.JSX.Element {
  const [name, setName] = useState(milestone?.name ?? '')
  const [description, setDescription] = useState(milestone?.description ?? '')
  const [dueDate, setDueDate] = useState(milestone?.due_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined
      })
      onClose()
      if (!milestone) { setName(''); setDescription(''); setDueDate('') }
    } catch {
      setError('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={milestone ? 'Meilenstein bearbeiten' : 'Neuer Meilenstein'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name *"
          placeholder="z.B. Beta-Release, Design abgeschlossen..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label="Beschreibung"
          placeholder="Was wird mit diesem Meilenstein erreicht?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Fälligkeitsdatum"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" loading={loading}>{milestone ? 'Speichern' : 'Erstellen'}</Button>
        </div>
      </form>
    </Modal>
  )
}
