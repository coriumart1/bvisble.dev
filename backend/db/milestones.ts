import { getDb } from './database'

export interface Milestone {
  id: number
  project_id: number
  name: string
  description: string | null
  due_date: string | null
  completed: number
  created_at: string
  updated_at: string
  project_name?: string
}

export interface CreateMilestoneData {
  project_id: number
  name: string
  description?: string
  due_date?: string
}

export interface UpdateMilestoneData {
  name?: string
  description?: string
  due_date?: string | null
  completed?: number
}

export function getMilestonesByProject(projectId: number): Milestone[] {
  return getDb().prepare(
    'SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC NULLS LAST, created_at ASC'
  ).all(projectId) as Milestone[]
}

export function getAllMilestonesWithProject(): Milestone[] {
  return getDb().prepare(`
    SELECT m.*, p.name as project_name
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE p.status = 'active'
    ORDER BY m.due_date ASC NULLS LAST
  `).all() as Milestone[]
}

export function getMilestoneById(id: number): Milestone | null {
  return (getDb().prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Milestone) ?? null
}

export function createMilestone(data: CreateMilestoneData): Milestone {
  const result = getDb().prepare(
    'INSERT INTO milestones (project_id, name, description, due_date) VALUES (?, ?, ?, ?)'
  ).run(data.project_id, data.name, data.description ?? null, data.due_date ?? null)
  return getMilestoneById(result.lastInsertRowid as number)!
}

export function updateMilestone(id: number, data: UpdateMilestoneData): Milestone {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if ('due_date' in data) { fields.push('due_date = ?'); values.push(data.due_date ?? null) }
  if (data.completed !== undefined) { fields.push('completed = ?'); values.push(data.completed) }
  if (fields.length === 0) return getMilestoneById(id)!
  fields.push("updated_at = datetime('now')")

  db.prepare(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  const updated = getMilestoneById(id)
  if (!updated) throw new Error(`Milestone ${id} not found`)
  return updated
}

export function deleteMilestone(id: number): void {
  getDb().prepare('DELETE FROM milestones WHERE id = ?').run(id)
}
