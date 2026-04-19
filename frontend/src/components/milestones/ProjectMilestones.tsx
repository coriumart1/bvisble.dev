import React, { useEffect, useState } from 'react'
import { MilestoneItem } from './MilestoneItem'
import { MilestoneForm } from './MilestoneForm'
import { Button } from '../ui/Button'
import { api } from '../../api/client'
import type { Milestone, Project } from '../../types'

interface ProjectMilestonesProps {
  project: Project
}

export function ProjectMilestones({ project }: ProjectMilestonesProps): React.JSX.Element {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editMilestone, setEditMilestone] = useState<Milestone | undefined>()

  async function load(): Promise<void> {
    const data = await api.milestones.getByProject(project.id)
    setMilestones(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [project.id])

  async function handleCreate(data: { name: string; description?: string; due_date?: string }): Promise<void> {
    await api.milestones.create({ project_id: project.id, ...data })
    await load()
  }

  async function handleEdit(data: { name: string; description?: string; due_date?: string }): Promise<void> {
    if (!editMilestone) return
    await api.milestones.update(editMilestone.id, data)
    setEditMilestone(undefined)
    await load()
  }

  async function handleToggle(milestone: Milestone): Promise<void> {
    await api.milestones.update(milestone.id, { completed: milestone.completed === 1 ? 0 : 1 })
    await load()
  }

  async function handleDelete(milestone: Milestone): Promise<void> {
    await api.milestones.delete(milestone.id)
    await load()
  }

  const open = milestones.filter((m) => m.completed === 0)
  const done = milestones.filter((m) => m.completed === 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {open.length} offen{done.length > 0 && `, ${done.length} erreicht`}
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Meilenstein</Button>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm text-center py-8">Lade...</div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-gray-600 text-sm">Noch keine Meilensteine.</p>
          <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
            Ersten Meilenstein erstellen
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {open.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Offen</h4>
              <div className="flex flex-col gap-1.5">
                {open.map((m) => (
                  <MilestoneItem
                    key={m.id}
                    milestone={m}
                    onToggle={handleToggle}
                    onEdit={(ms) => setEditMilestone(ms)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Erreicht</h4>
              <div className="flex flex-col gap-1.5">
                {done.map((m) => (
                  <MilestoneItem
                    key={m.id}
                    milestone={m}
                    onToggle={handleToggle}
                    onEdit={(ms) => setEditMilestone(ms)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <MilestoneForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />
      {editMilestone && (
        <MilestoneForm
          open={!!editMilestone}
          onClose={() => setEditMilestone(undefined)}
          onSave={handleEdit}
          milestone={editMilestone}
        />
      )}
    </div>
  )
}
