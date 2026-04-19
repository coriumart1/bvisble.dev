import { getDb } from './database'

export interface Task {
  id: number
  project_id: number
  milestone_id: number | null
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateTaskData {
  project_id: number
  milestone_id?: number
  title: string
  description?: string
  status?: string
  priority?: string
  due_date?: string
}

export interface UpdateTaskData {
  milestone_id?: number | null
  title?: string
  description?: string
  status?: string
  priority?: string
  due_date?: string | null
}

export function getTasksByProject(projectId: number): Task[] {
  return getDb().prepare(`
    SELECT * FROM tasks WHERE project_id = ?
    ORDER BY
      CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'done' THEN 3 END,
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      due_date ASC NULLS LAST
  `).all(projectId) as Task[]
}

export function getTaskById(id: number): Task | null {
  return (getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task) ?? null
}

export function createTask(data: CreateTaskData): Task {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO tasks (project_id, milestone_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    data.project_id,
    data.milestone_id ?? null,
    data.title,
    data.description ?? null,
    data.status ?? 'todo',
    data.priority ?? 'medium',
    data.due_date ?? null
  )
  return getTaskById(result.lastInsertRowid as number)!
}

export function updateTask(id: number, data: UpdateTaskData): Task {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title) }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }
  if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority) }
  if ('due_date' in data) { fields.push('due_date = ?'); values.push(data.due_date ?? null) }
  if ('milestone_id' in data) { fields.push('milestone_id = ?'); values.push(data.milestone_id ?? null) }
  fields.push("updated_at = datetime('now')")

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  return getTaskById(id)!
}

export function deleteTask(id: number): void {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
}
