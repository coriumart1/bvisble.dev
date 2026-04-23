// backend/routes/folders.ts
import { Router } from 'express'
import {
  getAllFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  isFolderEmpty
} from '../db/folders'

const router = Router()

router.get('/', (_req, res) => res.json(getAllFolders()))

router.post('/', (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ error: 'name is required' })
  res.status(201).json(createFolder(req.body))
})

router.put('/:id', (req, res) => {
  const folder = getFolderById(Number(req.params.id))
  if (!folder) return res.status(404).json({ error: 'Folder not found' })
  res.json(updateFolder(Number(req.params.id), req.body.name))
})

router.delete('/:id', (req, res) => {
  if (!isFolderEmpty(Number(req.params.id))) {
    return res.status(409).json({ error: 'Folder is not empty' })
  }
  deleteFolder(Number(req.params.id))
  res.status(204).end()
})

export default router
