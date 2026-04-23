// frontend/src/components/AttachmentList.tsx
import { useRef } from 'react'
import { api } from '../api/client'
import type { Attachment } from '../types'

interface Props {
  documentId: number
  attachments: Attachment[]
  onRefresh: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentList({ documentId, attachments, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await api.attachments.upload(documentId, file)
      onRefresh()
    } catch {
      alert('Upload fehlgeschlagen. Max. 10 MB, erlaubte Typen: PDF, Bild, TXT, MD, DOCX.')
    }
    e.target.value = ''
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" löschen?`)) return
    await api.attachments.delete(id)
    onRefresh()
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Anhänge ({attachments.length})
        </span>
        <button
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={() => fileInputRef.current?.click()}
        >
          + Datei hochladen
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.docx"
          onChange={handleUpload}
        />
      </div>
      {attachments.length === 0 && (
        <div className="text-xs text-gray-400">Keine Anhänge</div>
      )}
      <div className="space-y-1">
        {attachments.map(att => (
          <div
            key={att.id}
            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <button
              className="flex-1 text-left text-blue-600 hover:underline truncate"
              onClick={() => api.attachments.download(att.id)}
            >
              📎 {att.original_name}
            </button>
            <span className="text-xs text-gray-400 mx-2">{formatSize(att.size)}</span>
            <button
              className="text-red-400 hover:text-red-600 text-xs"
              onClick={() => handleDelete(att.id, att.original_name)}
            >🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
