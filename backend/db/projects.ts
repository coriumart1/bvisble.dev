import { getDb } from './database'

export interface Project {
  id: number
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  task_count?: number
  open_task_count?: number
}

export interface CreateProjectData {
  name: string
  description?: string
  start_date?: string
  end_date?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: string
  start_date?: string
  end_date?: string
}

export function getAllProjects(): Project[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status != 'done' THEN 1 ELSE 0 END) as open_task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all() as Project[]
}

export function getProjectById(id: number): Project | null {
  const db = getDb()
  return (db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project) ?? null
}

export function createProject(data: CreateProjectData): Project {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO projects (name, description, start_date, end_date) VALUES (?, ?, ?, ?)'
  ).run(data.name, data.description ?? null, data.start_date ?? null, data.end_date ?? null)
  return getProjectById(result.lastInsertRowid as number)!
}

export function updateProject(id: number, data: UpdateProjectData): Project {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }
  if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date) }
  if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date) }
  if (fields.length === 0) return getProjectById(id)!
  fields.push("updated_at = datetime('now')")

  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  return getProjectById(id)!
}

export function deleteProject(id: number): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
}
