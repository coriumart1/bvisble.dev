import { getDb } from './database'

export interface SearchResult {
  type: 'project' | 'task' | 'note'
  id: number
  title: string
  subtitle: string
  project_id?: number
  project_name?: string
}

export function search(query: string): SearchResult[] {
  if (!query.trim()) return []
  const db = getDb()
  const q = `%${query.trim()}%`
  const results: SearchResult[] = []

  const projects = db.prepare(`
    SELECT id, name, description, status FROM projects
    WHERE (name LIKE ? OR description LIKE ?) AND status != 'archived'
    LIMIT 5
  `).all(q, q) as { id: number; name: string; description: string | null; status: string }[]
  for (const p of projects) {
    results.push({ type: 'project', id: p.id, title: p.name, subtitle: p.description ?? p.status })
  }

  const tasks = db.prepare(`
    SELECT t.id, t.title, t.description, t.status, t.project_id, p.name as project_name
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE (t.title LIKE ? OR t.description LIKE ?) AND p.status = 'active'
    LIMIT 8
  `).all(q, q) as { id: number; title: string; description: string | null; status: string; project_id: number; project_name: string }[]
  for (const t of tasks) {
    results.push({ type: 'task', id: t.id, title: t.title, subtitle: t.description ?? t.status, project_id: t.project_id, project_name: t.project_name })
  }

  const notes = db.prepare(`
    SELECT n.id, n.title, n.content, n.project_id, p.name as project_name
    FROM notes n JOIN projects p ON p.id = n.project_id
    WHERE (n.title LIKE ? OR n.content LIKE ?) AND p.status = 'active'
    LIMIT 5
  `).all(q, q) as { id: number; title: string; content: string | null; project_id: number; project_name: string }[]
  for (const n of notes) {
    results.push({ type: 'note', id: n.id, title: n.title, subtitle: n.content?.replace(/[#*`_>~]/g, '').slice(0, 80) ?? '', project_id: n.project_id, project_name: n.project_name })
  }

  return results
}
