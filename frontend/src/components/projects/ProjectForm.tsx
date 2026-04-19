import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Project, CreateProjectData, UpdateProjectData } from '../../types'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: CreateProjectData | UpdateProjectData) => Promise<void>
  project?: Project
}

export function ProjectForm({ open, onClose, onSave, project }: ProjectFormProps): React.JSX.Element {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [startDate, setStartDate] = useState(project?.start_date ?? '')
  const [endDate, setEndDate] = useState(project?.end_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      })
      onClose()
      if (!isEdit) {
        setName('')
        setDescription('')
        setStartDate('')
        setEndDate('')
      }
    } catch {
      setError('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name *"
          placeholder="Projektname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label="Beschreibung"
          placeholder="Kurze Beschreibung des Projekts..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Startdatum"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Enddatum"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
