import type { Folder, Document, Attachment } from '../types'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  projects: {
    getAll: () => request<any[]>('GET', '/projects'),
    getById: (id: number) => request<any>('GET', `/projects/${id}`),
    create: (data: unknown) => request<any>('POST', '/projects', data),
    update: (id: number, data: unknown) => request<any>('PUT', `/projects/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/projects/${id}`)
  },
  tasks: {
    getByProject: (projectId: number) => request<any[]>('GET', `/tasks?projectId=${projectId}`),
    create: (data: unknown) => request<any>('POST', '/tasks', data),
    update: (id: number, data: unknown) => request<any>('PUT', `/tasks/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/tasks/${id}`)
  },
  milestones: {
    getByProject: (projectId: number) => request<any[]>('GET', `/milestones?projectId=${projectId}`),
    getAll: () => request<any[]>('GET', '/milestones'),
    create: (data: unknown) => request<any>('POST', '/milestones', data),
    update: (id: number, data: unknown) => request<any>('PUT', `/milestones/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/milestones/${id}`)
  },
  notes: {
    getByProject: (projectId: number) => request<any[]>('GET', `/notes?projectId=${projectId}`),
    create: (data: unknown) => request<any>('POST', '/notes', data),
    update: (id: number, data: unknown) => request<any>('PUT', `/notes/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/notes/${id}`)
  },
  time: {
    getByTask: (taskId: number) => request<any[]>('GET', `/time-entries?taskId=${taskId}`),
    getByProject: (projectId: number) => request<any[]>('GET', `/time-entries?projectId=${projectId}`),
    getAll: () => request<any[]>('GET', '/time-entries'),
    getTotalByProject: (projectId: number) => request<{ total: number }>('GET', `/time-entries/total?projectId=${projectId}`).then(r => r.total),
    create: (data: unknown) => request<any>('POST', '/time-entries', data),
    update: (id: number, data: unknown) => request<any>('PUT', `/time-entries/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/time-entries/${id}`)
  },
  search: {
    query: (q: string) => request<any[]>('GET', `/search?q=${encodeURIComponent(q)}`)
  },
  folders: {
    getAll: () => request<Folder[]>('GET', '/folders'),
    create: (data: { name: string; parent_id?: number | null }) =>
      request<Folder>('POST', '/folders', data),
    update: (id: number, name: string) =>
      request<Folder>('PUT', `/folders/${id}`, { name }),
    delete: (id: number) => request<void>('DELETE', `/folders/${id}`)
  },
  documents: {
    getAll: (folderId?: number) =>
      request<Document[]>('GET', `/documents${folderId !== undefined ? `?folderId=${folderId}` : ''}`),
    getById: (id: number) => request<Document>('GET', `/documents/${id}`),
    create: (data: { title: string; folder_id?: number | null }) =>
      request<Document>('POST', '/documents', data),
    update: (id: number, data: Partial<Pick<Document, 'title' | 'content' | 'folder_id'>>) =>
      request<Document>('PUT', `/documents/${id}`, data),
    delete: (id: number) => request<void>('DELETE', `/documents/${id}`)
  },
  attachments: {
    getByDocument: (documentId: number) =>
      request<Attachment[]>('GET', `/documents/${documentId}/attachments`),
    upload: async (documentId: number, file: File): Promise<Attachment> => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/documents/${documentId}/attachments`, {
        method: 'POST',
        body: formData
      })
      return res.json()
    },
    download: (id: number) => window.open(`/api/attachments/${id}`, '_blank'),
    delete: (id: number) => request<void>('DELETE', `/attachments/${id}`)
  },
  dialog: {
    savePdf: async (_filename: string, base64Data: string): Promise<void> => {
      const binary = atob(base64Data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = _filename
      a.click()
      URL.revokeObjectURL(url)
    }
  },
  widget: {
    sendTimerStarted: () => {},
    sendTimerStopped: () => {},
    toggle: async () => false,
    isVisible: async () => false
  }
}
