// backend/db/attachments.ts
import { getDb } from "./database"

export interface Attachment {
  id: number
  document_id: number
  filename: string
  original_name: string
  mimetype: string
  size: number
  created_at: string
}

export interface CreateAttachmentData {
  document_id: number
  filename: string
  original_name: string
  mimetype: string
  size: number
}

export function getAttachmentsByDocument(documentId: number): Attachment[] {
  return getDb()
    .prepare("SELECT * FROM attachments WHERE document_id = ? ORDER BY created_at DESC")
    .all(documentId) as Attachment[]
}

export function getAttachmentById(id: number): Attachment | null {
  return getDb().prepare("SELECT * FROM attachments WHERE id = ?").get(id) as Attachment | null
}

export function createAttachment(data: CreateAttachmentData): Attachment {
  return getDb()
    .prepare("INSERT INTO attachments (document_id, filename, original_name, mimetype, size) VALUES (?, ?, ?, ?, ?) RETURNING *")
    .get(data.document_id, data.filename, data.original_name, data.mimetype, data.size) as Attachment
}

export function deleteAttachment(id: number): void {
  getDb().prepare("DELETE FROM attachments WHERE id = ?").run(id)
}
