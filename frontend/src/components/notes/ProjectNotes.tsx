import React, { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { api } from '../../api/client'
import type { Note, Project } from '../../types'

interface ProjectNotesProps {
  project: Project
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function excerpt(content: string | null, maxLen = 80): string {
  if (!content) return ''
  const plain = content.replace(/[#*`_>~\[\]()]/g, '').trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain
}

export function ProjectNotes({ project }: ProjectNotesProps): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>([])
  const [selected, setSelected] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  async function load(): Promise<void> {
    const data = await api.notes.getByProject(project.id)
    setNotes(data)
    return data as unknown as void
  }

  useEffect(() => { load() }, [project.id])

  function openNote(note: Note): void {
    setSelected(note)
    setEditTitle(note.title)
    setEditContent(note.content ?? '')
    setPreview(false)
    setDirty(false)
  }

  async function createNote(): Promise<void> {
    const note = await api.notes.create({
      project_id: project.id,
      title: 'Neue Notiz',
      content: ''
    })
    await load()
    openNote(note)
  }

  const saveNote = useCallback(async (title: string, content: string): Promise<void> => {
    if (!selected) return
    setSaving(true)
    await api.notes.update(selected.id, { title, content })
    setSaving(false)
    setDirty(false)
    const data = await api.notes.getByProject(project.id)
    setNotes(data)
    setSelected((prev) => prev ? { ...prev, title, content, updated_at: new Date().toISOString() } : prev)
  }, [selected, project.id])

  // Auto-save after 1.5s of inactivity
  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(() => saveNote(editTitle, editContent), 1500)
    return () => clearTimeout(timer)
  }, [dirty, editTitle, editContent, saveNote])

  async function deleteNote(note: Note): Promise<void> {
    await api.notes.delete(note.id)
    if (selected?.id === note.id) setSelected(null)
    await load()
  }

  function handleTitleChange(v: string): void {
    setEditTitle(v)
    setDirty(true)
  }

  function handleContentChange(v: string): void {
    setEditContent(v)
    setDirty(true)
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Sidebar — note list */}
      <div className="w-56 shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="shrink-0 p-3 border-b border-gray-800">
          <button
            onClick={createNote}
            className="w-full py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/40 rounded-lg hover:bg-indigo-500/10 transition-colors"
          >
            + Neue Notiz
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6 px-3">Noch keine Notizen.</p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={`w-full text-left px-3 py-3 border-b border-gray-800/50 transition-colors group ${
                  selected?.id === note.id ? 'bg-gray-800' : 'hover:bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs font-medium truncate ${selected?.id === note.id ? 'text-white' : 'text-gray-300'}`}>
                    {note.title || 'Ohne Titel'}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0 text-xs"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">{excerpt(note.content)}</p>
                <p className="text-xs text-gray-700 mt-1">{formatDate(note.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-600 text-sm">Notiz auswählen oder neue erstellen</p>
            <button
              onClick={createNote}
              className="px-4 py-2 text-sm text-indigo-400 border border-indigo-500/40 rounded-lg hover:bg-indigo-500/10 transition-colors"
            >
              + Neue Notiz
            </button>
          </div>
        ) : (
          <>
            {/* Note toolbar */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-800">
              <input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder-gray-600"
                placeholder="Titel..."
              />
              <div className="flex items-center gap-2">
                {dirty && <span className="text-xs text-gray-600">Wird gespeichert…</span>}
                {saving && <span className="text-xs text-indigo-400">Gespeichert</span>}
                <div className="flex bg-gray-800 rounded-md p-0.5">
                  <button
                    onClick={() => setPreview(false)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${!preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setPreview(true)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Vorschau
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {preview ? (
              <div className="flex-1 overflow-auto px-6 py-4 prose prose-invert prose-sm max-w-none
                prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white
                prose-code:text-indigo-300 prose-pre:bg-gray-800 prose-li:text-gray-300
                prose-a:text-indigo-400 prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400
              ">
                {editContent ? (
                  <ReactMarkdown>{editContent}</ReactMarkdown>
                ) : (
                  <p className="text-gray-600 italic">Kein Inhalt.</p>
                )}
              </div>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`# Überschrift\n\nHier Markdown schreiben...\n\n- Listenpunkt\n- **Fett**, *kursiv*\n\n> Zitat`}
                className="flex-1 resize-none bg-transparent px-6 py-4 text-sm text-gray-200 outline-none placeholder-gray-700 font-mono leading-relaxed"
                spellCheck={false}
              />
            )}

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-800">
              <span className="text-xs text-gray-700">
                Zuletzt geändert: {formatDate(selected.updated_at)}
              </span>
              <span className="text-xs text-gray-700">
                {editContent.length} Zeichen · Markdown
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
