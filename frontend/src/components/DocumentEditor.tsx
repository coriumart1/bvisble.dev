import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [content, setContent] = useState(document.content ?? '')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(document.title)
    setContent(document.content ?? '')
    setSaveError(false)
    loadAttachments()
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [document.id])

  const loadAttachments = async () => {
    try {
      setAttachments(await api.attachments.getByDocument(document.id))
    } catch {}
  }

  const scheduleSave = useCallback((newTitle: string, newContent: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      setSaveError(false)
      try {
        const updated = await api.documents.update(document.id, { title: newTitle, content: newContent })
        onUpdate(updated)
      } catch {
        setSaveError(true)
      } finally {
        setSaving(false)
      }
    }, 800)
  }, [document.id, onUpdate])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave(e.target.value, content)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    scheduleSave(title, e.target.value)
  }

  const handleFolderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const folderId = e.target.value === '' ? null : Number(e.target.value)
    try {
      const updated = await api.documents.update(document.id, { folder_id: folderId })
      onUpdate(updated)
    } catch {}
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3 flex items-center gap-3 shrink-0 bg-gray-850">
        <input
          className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-blue-500 text-gray-100 placeholder-gray-600"
          value={title}
          onChange={handleTitleChange}
          placeholder="Titel..."
        />
        <select
          className="text-sm border border-gray-600 rounded px-2 py-1 bg-gray-800 text-gray-300"
          value={document.folder_id ?? ''}
          onChange={handleFolderChange}
        >
          <option value="">Kein Ordner</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 shrink-0">
          {saving ? 'Speichern...' : saveError ? '\u274c Fehler' : '\u2713 Gespeichert'}
        </span>
      </div>

      {/* Text editor */}
      <textarea
        className="flex-1 w-full px-6 py-4 bg-gray-900 text-gray-100 resize-none outline-none font-mono text-sm leading-relaxed placeholder-gray-600"
        value={content}
        onChange={handleContentChange}
        placeholder="Text hier eingeben..."
        spellCheck={false}
      />

      {/* Attachments */}
      <div className="border-t border-gray-700 shrink-0">
        <AttachmentList
          documentId={document.id}
          attachments={attachments}
          onRefresh={loadAttachments}
        />
      </div>
    </div>
  )
}
