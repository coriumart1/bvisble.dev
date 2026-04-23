// frontend/src/components/DocumentList.tsx
import { useState } from 'react'
import { api } from '../api/client'
import type { Document, Folder } from '../types'

interface Props {
  documents: Document[]
  folders: Folder[]
  selectedId: number | null
  folderId: number | null | undefined
  onSelect: (doc: Document) => void
  onRefresh: () => void
}

export default function DocumentList({ documents, folders, selectedId, folderId, onSelect, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const getFolderName = (id: number | null) => {
    if (!id) return null
    return folders.find(f => f.id === id)?.name ?? null
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const doc = await api.documents.create({ title: newTitle.trim(), folder_id: folderId ?? null })
    setNewTitle('')
    setCreating(false)
    onRefresh()
    onSelect(doc)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Dokument und alle Anhänge löschen?')) return
    await api.documents.delete(id)
    onRefresh()
  }

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dokumente</span>
          <button
            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setCreating(true)}
          >+ Neu</button>
        </div>
        {creating && (
          <div className="flex gap-1 mt-1">
            <input
              autoFocus
              className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
              placeholder="Titel"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            />
            <button className="text-xs px-2 bg-blue-600 text-white rounded" onClick={handleCreate}>✓</button>
          </div>
        )}
        <input
          className="w-full mt-2 text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">Keine Dokumente</div>
        )}
        {filtered.map(doc => (
          <div
            key={doc.id}
            className={`group flex items-start justify-between p-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
              selectedId === doc.id
                ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelect(doc)}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{doc.title}</div>
              {getFolderName(doc.folder_id) && (
                <div className="text-xs text-gray-400 mt-0.5">📁 {getFolderName(doc.folder_id)}</div>
              )}
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(doc.updated_at).toLocaleDateString('de-AT')}
              </div>
            </div>
            <button
              className="hidden group-hover:block text-red-400 hover:text-red-600 ml-2 text-xs"
              onClick={e => handleDelete(e, doc.id)}
            >🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
