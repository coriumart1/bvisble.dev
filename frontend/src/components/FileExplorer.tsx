import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import DocumentEditor from './DocumentEditor'
import type { Folder, Document } from '../types'

interface CtxMenu {
  x: number
  y: number
  type: 'empty' | 'folder' | 'document'
  folder?: Folder
  doc?: Document
}

interface Crumb { id: number | null; name: string }

export default function FileExplorer() {
  const [folderId, setFolderId] = useState<number | null>(null)
  const folderIdRef = useRef<number | null>(null)
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: null, name: 'Alle Dokumente' }])
  const [folders, setFolders] = useState<Folder[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const [ctx, setCtx] = useState<CtxMenu | null>(null)
  const [openDoc, setOpenDoc] = useState<Document | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<{ id: number; name: string } | null>(null)
  const [renamingDoc, setRenamingDoc] = useState<{ id: number; title: string } | null>(null)

  folderIdRef.current = folderId

  useEffect(() => { load() }, [folderId])

  useEffect(() => {
    const close = () => setCtx(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const load = async () => {
    const id = folderIdRef.current
    try {
      const af = await api.folders.getAll()
      setAllFolders(af)
      setFolders(af.filter(f => f.parent_id === id))
      const ad = await api.documents.getAll()
      setDocs(ad.filter(d => d.folder_id === id))
    } catch {}
  }

  const navigate = (folder: Folder) => {
    setFolderId(folder.id)
    setCrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
  }

  const navigateCrumb = (crumb: Crumb, idx: number) => {
    setFolderId(crumb.id)
    setCrumbs(prev => prev.slice(0, idx + 1))
  }

  const navigateUp = () => {
    if (crumbs.length <= 1) return
    const parent = crumbs[crumbs.length - 2]
    setFolderId(parent.id)
    setCrumbs(prev => prev.slice(0, -1))
  }

  const onCtx = (e: React.MouseEvent, type: CtxMenu['type'], folder?: Folder, doc?: Document) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 200, menuH = 120
    const x = e.clientX + menuW > window.innerWidth ? e.clientX - menuW : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY
    setCtx({ x, y, type, folder, doc })
  }

  const createFolder = async () => {
    setCtx(null)
    try {
      const id = folderIdRef.current
      const f = await api.folders.create({ name: 'Neuer Ordner', parent_id: id })
      await load()
      setRenamingFolder({ id: f.id, name: f.name })
    } catch {}
  }

  const createDoc = async () => {
    setCtx(null)
    try {
      const id = folderIdRef.current
      const d = await api.documents.create({ title: 'Neues Dokument', folder_id: id })
      await load()
      const full = await api.documents.getById(d.id)
      setOpenDoc(full)
    } catch {}
  }

  const deleteFolder = async (folder: Folder) => {
    setCtx(null)
    try {
      await api.folders.delete(folder.id)
      await load()
    } catch {
      alert('Ordner ist nicht leer \u2014 zuerst Inhalt l\u00f6schen.')
    }
  }

  const deleteDoc = async (doc: Document) => {
    setCtx(null)
    try {
      await api.documents.delete(doc.id)
      await load()
    } catch {}
  }

  const commitRenameFolder = async () => {
    if (!renamingFolder?.name.trim()) { setRenamingFolder(null); return }
    try {
      await api.folders.update(renamingFolder.id, renamingFolder.name.trim())
      await load()
    } catch {}
    setRenamingFolder(null)
  }

  const commitRenameDoc = async () => {
    if (!renamingDoc?.title.trim()) { setRenamingDoc(null); return }
    try {
      await api.documents.update(renamingDoc.id, { title: renamingDoc.title.trim() })
      await load()
    } catch {}
    setRenamingDoc(null)
  }

  const openDocument = async (doc: Document) => {
    setCtx(null)
    try {
      const full = await api.documents.getById(doc.id)
      setOpenDoc(full)
    } catch {}
  }

  const isEmpty = folders.length === 0 && docs.length === 0

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 select-none overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-900 shrink-0">
        <button onClick={navigateUp} disabled={crumbs.length <= 1} title="Eine Ebene h\u00f6her"
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-0.5 bg-gray-800 rounded px-3 py-1.5 text-sm overflow-x-auto">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-0.5 shrink-0">
              {i > 0 && <span className="text-gray-600 mx-1">&rsaquo;</span>}
              <button onClick={() => navigateCrumb(c, i)}
                className={`hover:text-blue-400 whitespace-nowrap ${i === crumbs.length - 1 ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
                {i === 0 && <span className="mr-1">\uD83D\uDDC2\uFE0F</span>}
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-600 shrink-0">
          {folders.length + docs.length} Element{folders.length + docs.length !== 1 ? 'e' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4" onContextMenu={(e) => onCtx(e, 'empty')}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 pointer-events-none gap-3">
            <svg className="w-20 h-20 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-sm">Ordner ist leer</p>
            <p className="text-xs opacity-60">Rechtsklick zum Erstellen</p>
          </div>
        ) : (
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
            {folders.map(f => (
              <div key={`folder-${f.id}`}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer hover:bg-gray-800 active:bg-gray-700"
                onDoubleClick={() => navigate(f)} onContextMenu={(e) => onCtx(e, 'folder', f)}>
                <div className="text-5xl leading-none">📁</div>
                {renamingFolder?.id === f.id ? (
                  <input autoFocus
                    className="w-full text-center text-xs bg-blue-900 text-white border border-blue-400 rounded px-1 py-0.5 outline-none"
                    value={renamingFolder.name}
                    onChange={e => setRenamingFolder({ ...renamingFolder, name: e.target.value })}
                    onBlur={commitRenameFolder}
                    onKeyDown={e => { if (e.key === 'Enter') commitRenameFolder(); if (e.key === 'Escape') setRenamingFolder(null) }}
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="text-xs text-center text-gray-300 line-clamp-2 w-full break-words">{f.name}</span>
                )}
              </div>
            ))}
            {docs.map(d => (
              <div key={`doc-${d.id}`}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer hover:bg-gray-800 active:bg-gray-700"
                onDoubleClick={() => openDocument(d)} onContextMenu={(e) => onCtx(e, 'document', undefined, d)}>
                <div className="text-5xl leading-none">📄</div>
                {renamingDoc?.id === d.id ? (
                  <input autoFocus
                    className="w-full text-center text-xs bg-blue-900 text-white border border-blue-400 rounded px-1 py-0.5 outline-none"
                    value={renamingDoc.title}
                    onChange={e => setRenamingDoc({ ...renamingDoc, title: e.target.value })}
                    onBlur={commitRenameDoc}
                    onKeyDown={e => { if (e.key === 'Enter') commitRenameDoc(); if (e.key === 'Escape') setRenamingDoc(null) }}
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="text-xs text-center text-gray-300 line-clamp-2 w-full break-words">{d.title}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {ctx && (
        <div className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 text-sm"
          style={{ top: ctx.y, left: ctx.x, minWidth: '180px' }}
          onClick={e => e.stopPropagation()}>
          {ctx.type === 'empty' && (
            <>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left" onClick={createFolder}>
                <span>📁</span> Neuer Ordner
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left" onClick={createDoc}>
                <span>📄</span> Neues Dokument
              </button>
            </>
          )}
          {ctx.type === 'folder' && ctx.folder && (
            <>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left"
                onClick={() => { setCtx(null); navigate(ctx.folder!) }}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                \u00d6ffnen
              </button>
              <div className="border-t border-gray-600 my-1" />
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left"
                onClick={() => { setCtx(null); setRenamingFolder({ id: ctx.folder!.id, name: ctx.folder!.name }) }}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Umbenennen
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left text-red-400"
                onClick={() => deleteFolder(ctx.folder!)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                L\u00f6schen
              </button>
            </>
          )}
          {ctx.type === 'document' && ctx.doc && (
            <>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left"
                onClick={() => openDocument(ctx.doc!)}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                \u00d6ffnen
              </button>
              <div className="border-t border-gray-600 my-1" />
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left"
                onClick={() => { setCtx(null); setRenamingDoc({ id: ctx.doc!.id, title: ctx.doc!.title }) }}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Umbenennen
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 text-left text-red-400"
                onClick={() => deleteDoc(ctx.doc!)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                L\u00f6schen
              </button>
            </>
          )}
        </div>
      )}

      {openDoc && (
        <div className="fixed inset-0 z-40 flex" onClick={() => { load(); setOpenDoc(null) }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative flex flex-col bg-gray-900 w-full max-w-4xl mx-auto my-8 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-gray-800 shrink-0">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <span>📄</span><span>{openDoc.title}</span>
              </span>
              <button className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
                onClick={() => { load(); setOpenDoc(null) }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <DocumentEditor key={openDoc.id} document={openDoc} folders={allFolders} onUpdate={(updated) => setOpenDoc(updated)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
