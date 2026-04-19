import { getDb } from './database'

export interface TimeEntry {
  id: number
  task_id: number
  task_title?: string
  project_id?: number
  project_name?: string
  description: string | null
  duration: number
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface CreateTimeEntryData { task_id: number; description?: string; duration?: number; started_at?: string }
export interface UpdateTimeEntryData { description?: string; duration?: number; ended_at?: string }

export function getEntriesByTask(taskId: number): TimeEntry[] {
  return getDb().prepare('SELECT * FROM time_entries WHERE task_id = ? ORDER BY created_at DESC').all(taskId) as TimeEntry[]
}

export function getEntriesByProject(projectId: number): TimeEntry[] {
  return getDb().prepare(`
    SELECT te.*, t.title as task_title, t.project_id
    FROM time_entries te JOIN tasks t ON t.id = te.task_id
    WHERE t.project_id = ? ORDER BY te.created_at DESC
  `).all(projectId) as TimeEntry[]
}

export function getAllEntries(): TimeEntry[] {
  return getDb().prepare(`
    SELECT te.*, t.title as task_title, t.project_id, p.name as project_name
    FROM time_entries te
    JOIN tasks t ON t.id = te.task_id
    JOIN projects p ON p.id = t.project_id
    ORDER BY te.created_at DESC LIMIT 200
  `).all() as TimeEntry[]
}

export function getTotalByProject(projectId: number): number {
  const row = getDb().prepare(`
    SELECT COALESCE(SUM(te.duration), 0) as total
    FROM time_entries te JOIN tasks t ON t.id = te.task_id
    WHERE t.project_id = ?
  `).get(projectId) as { total: number }
  return row.total
}

export function getEntryById(id: number): TimeEntry | null {
  return (getDb().prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry) ?? null
}

export function createTimeEntry(data: CreateTimeEntryData): TimeEntry {
  const result = getDb().prepare(
    'INSERT INTO time_entries (task_id, description, duration, started_at) VALUES (?, ?, ?, ?)'
  ).run(data.task_id, data.description ?? null, data.duration ?? 0, data.started_at ?? null)
  return getEntryById(result.lastInsertRowid as number)!
}

export function updateTimeEntry(id: number, data: UpdateTimeEntryData): TimeEntry {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
  if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration) }
  if (data.ended_at !== undefined) { fields.push('ended_at = ?'); values.push(data.ended_at) }
  if (fields.length === 0) return getEntryById(id)!
  db.prepare(`UPDATE time_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  return getEntryById(id)!
}

export function deleteTimeEntry(id: number): void {
  getDb().prepare('DELETE FROM time_entries WHERE id = ?').run(id)
}
