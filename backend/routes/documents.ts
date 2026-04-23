// backend/routes/documents.ts
import { Router } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from '../db/documents'
import { getAttachmentsByDocument, createAttachment } from '../db/attachments'
import { UPLOADS_DIR } from '../config'

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
    else cb(new Error('File type not allowed'))
  }
})

const router = Router()

router.get('/', (req, res) => {
  const raw = req.query.folderId
  if (raw !== undefined && isNaN(Number(raw))) {
    return res.status(400).json({ error: 'Invalid folderId' })
  }
  const folderId = raw !== undefined ? Number(raw) : undefined
  res.json(getAllDocuments(folderId))
})

router.post('/', (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ error: 'title is required' })
  res.status(201).json(createDocument(req.body))
})

router.get('/:id', (req, res) => {
  const doc = getDocumentById(Number(req.params.id))
  if (!doc) return res.status(404).json({ error: 'Document not found' })
  res.json(doc)
})

router.put('/:id', (req, res) => {
  try {
    res.json(updateDocument(Number(req.params.id), req.body))
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message })
    throw err
  }
})

router.delete('/:id', (req, res) => {
  const attachments = getAttachmentsByDocument(Number(req.params.id))
  attachments.forEach(att => {
    const filePath = path.join(UPLOADS_DIR, att.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  })
  deleteDocument(Number(req.params.id))
  res.status(204).end()
})

router.get('/:id/attachments', (req, res) => {
  res.json(getAttachmentsByDocument(Number(req.params.id)))
})

router.post('/:id/attachments', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const attachment = createAttachment({
      document_id: Number(req.params.id),
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    })
    res.status(201).json(attachment)
  })
})

export default router
