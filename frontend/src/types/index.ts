export type ProjectStatus = 'active' | 'archived' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Project {
  id: number
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  task_count?: number
  open_task_count?: number
}

export interface Task {
  id: number
  project_id: number
  milestone_id: number | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: number
  project_id: number
  name: string
  description: string | null
  due_date: string | null
  completed: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: number
  project_id: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: number
  task_id: number
  description: string | null
  duration: number
  started_at: string | null
  ended_at: string | null
  created_at: string
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
  status?: ProjectStatus
  start_date?: string
  end_date?: string
}

export interface SearchResult {
  type: 'project' | 'task' | 'note'
  id: number
  title: string
  subtitle: string
  project_id?: number
  project_name?: string
}

export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_at: string
}

export interface Document {
  id: number
  title: string
  content: string
  folder_id: number | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: number
  document_id: number
  filename: string
  original_name: string
  mimetype: string
  size: number
  created_at: string
}
