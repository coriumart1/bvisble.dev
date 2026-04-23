// frontend/src/components/DocumentEditor.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { api } from '../api/client'
import AttachmentList from './AttachmentList'
import type { Document, Attachment, Folder } from '../types'

interface Props {
  document: Document
  folders: Folder[]
  onUpdate: (doc: Document) => void
}

export default function DocumentEditor({ document, folders, onUpdate }: Props) {
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(document.title)
    setSaveError(false)
    setContent(document.content)
    loadAttachments()
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [document.id])

  const loadAttachments = async () => {
    try {
      const list = await api.attachments.getByDocument(document.id)
      setAttachments(list)
    } catch {
      // silent fail
    }
  }

  const scheduleSave = useCallback((newTitle: string, newContent: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      setSaveError(false)
      try {
        const updated = await api.documents.update(document.id, {
          title: newTitle,
          content: newContent
        })
        onUpdate(updated)
      } catch {
        setSaveError(true)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }, [document.id, onUpdate])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave(e.target.value, content)
  }

  const handleContentChange = (val: string | undefined) => {
    const newContent = val ?? ''
    setContent(newContent)
    scheduleSave(title, newContent)
  }

  const handleFolderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const folderId = e.target.value === '' ? null : Number(e.target.value)
    try {
      const updated = await api.documents.update(document.id, { folder_id: folderId })
      onUpdate(updated)
    } catch {
      alert('Ordner konnte nicht gespeichert werden.')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
        <input
          className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-blue-500"
          value={title}
          onChange={handleTitleChange}
          placeholder="Titel..."
        />
        <select
          className="text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
          value={document.folder_id ?? ''}
          onChange={handleFolderChange}
        >
          <option value="">Kein Ordner</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {saving ? 'Speichern...' : saveError ? 'Fehler beim Speichern' : 'Gespeichert'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden" data-color-mode="auto">
        <MDEditor
          value={content}
          onChange={handleContentChange}
          preview="live"
          height="100%"
          style={{ height: '100%', borderRadius: 0, border: 'none' }}
        />
      </div>

      <AttachmentList
        documentId={document.id}
        attachments={attachments}
        onRefresh={loadAttachments}
      />
    </div>
  )
}
