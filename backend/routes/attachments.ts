// backend/routes/attachments.ts
import { Router } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { getAttachmentById, deleteAttachment } from '../db/attachments'
import { UPLOADS_DIR } from '../config'

const router = Router()

router.get('/:id', (req, res) => {
  const att = getAttachmentById(Number(req.params.id))
  if (!att) return res.status(404).json({ error: 'Attachment not found' })
  const filePath = path.join(UPLOADS_DIR, att.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' })
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(att.original_name)}"`)
  res.setHeader('Content-Type', att.mimetype)
  fs.createReadStream(filePath).pipe(res)
})

router.delete('/:id', (req, res) => {
  const att = getAttachmentById(Number(req.params.id))
  if (!att) return res.status(404).json({ error: 'Attachment not found' })
  const filePath = path.join(UPLOADS_DIR, att.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  deleteAttachment(att.id)
  res.status(204).end()
})

export default router
