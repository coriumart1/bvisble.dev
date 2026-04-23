// frontend/src/components/FolderTree.tsx
import { useState } from 'react'
import { api } from '../api/client'
import type { Folder } from '../types'

interface Props {
  folders: Folder[]
  selectedId: number | null | undefined  // undefined = "Alle Dokumente"
  onSelect: (id: number | null | undefined) => void
  onRefresh: () => void
}

function FolderItem({
  folder,
  allFolders,
  selectedId,
  onSelect,
  onRefresh,
  depth
}: {
  folder: Folder
  allFolders: Folder[]
  selectedId: number | null | undefined
  onSelect: (id: number | null | undefined) => void
  onRefresh: () => void
  depth: number
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)
  const children = allFolders.filter(f => f.parent_id === folder.id)

  const handleRename = async () => {
    if (name.trim() && name !== folder.name) {
      await api.folders.update(folder.id, name.trim())
      onRefresh()
    }
    setEditing(false)
  }

  const handleDelete = async () => {
    try {
      await api.folders.delete(folder.id)
      if (selectedId === folder.id) onSelect(undefined)
      onRefresh()
    } catch {
      alert('Ordner kann nur gelöscht werden wenn er leer ist.')
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center justify-between rounded px-2 py-1 cursor-pointer text-sm ${
          selectedId === folder.id
            ? 'bg-blue-600 text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {editing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">📁 {folder.name}</span>
        )}
        <div className="hidden group-hover:flex gap-1 ml-1" onClick={e => e.stopPropagation()}>
          <button
            className="text-xs px-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => setEditing(true)}
          >✏️</button>
          <button
            className="text-xs px-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            onClick={handleDelete}
          >🗑️</button>
        </div>
      </div>
      {children.map(child => (
        <FolderItem
          key={child.id}
          folder={child}
          allFolders={allFolders}
          selectedId={selectedId}
          onSelect={onSelect}
          onRefresh={onRefresh}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export default function FolderTree({ folders, selectedId, onSelect, onRefresh }: Props) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    await api.folders.create({ name: newName.trim() })
    setNewName('')
    setCreating(false)
    onRefresh()
  }

  const rootFolders = folders.filter(f => f.parent_id === null)

  return (
    <div className="w-56 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ordner</span>
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
              placeholder="Ordnername"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            />
            <button className="text-xs px-2 bg-blue-600 text-white rounded" onClick={handleCreate}>✓</button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div
          className={`flex items-center px-2 py-1 rounded cursor-pointer text-sm ${
            selectedId === undefined
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelect(undefined)}
        >
          📄 Alle Dokumente
        </div>
        {rootFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            allFolders={folders}
            selectedId={selectedId}
            onSelect={onSelect}
            onRefresh={onRefresh}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}
