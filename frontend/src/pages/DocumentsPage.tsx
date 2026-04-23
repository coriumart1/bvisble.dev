// frontend/src/pages/DocumentsPage.tsx
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import FolderTree from '../components/FolderTree'
import DocumentList from '../components/DocumentList'
import DocumentEditor from '../components/DocumentEditor'
import type { Folder, Document } from '../types'

export default function DocumentsPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | undefined>(undefined)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [selectedFolderId])

  const loadFolders = async () => {
    try {
      setFolders(await api.folders.getAll())
    } catch {
      // silent fail
    }
  }

  const loadDocuments = async () => {
    try {
      setDocuments(await api.documents.getAll(selectedFolderId ?? undefined))
    } catch {
      // silent fail
    }
  }

  const handleFolderSelect = (id: number | null | undefined) => {
    setSelectedFolderId(id)
    setSelectedDocument(null)
  }

  const handleDocumentUpdate = (updated: Document) => {
    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
    setSelectedDocument(updated)
  }

  return (
    <div className="flex h-full">
      <FolderTree
        folders={folders}
        selectedId={selectedFolderId}
        onSelect={handleFolderSelect}
        onRefresh={loadFolders}
      />
      <DocumentList
        documents={documents}
        folders={folders}
        selectedId={selectedDocument?.id ?? null}
        folderId={selectedFolderId}
        onSelect={setSelectedDocument}
        onRefresh={loadDocuments}
      />
      {selectedDocument ? (
        <DocumentEditor
          key={selectedDocument.id}
          document={selectedDocument}
          folders={folders}
          onUpdate={handleDocumentUpdate}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-3">📄</div>
            <div>Dokument auswählen oder neues erstellen</div>
          </div>
        </div>
      )}
    </div>
  )
}
