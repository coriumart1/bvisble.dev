import { Router } from 'express'
import { getNotesByProject, createNote, updateNote, deleteNote } from '../db/notes'

const router = Router()

router.get('/', (req, res) => {
  const projectId = Number(req.query.projectId)
  if (!projectId) return res.status(400).json({ error: 'projectId required' })
  res.json(getNotesByProject(projectId))
})
router.post('/', (req, res) => res.status(201).json(createNote(req.body)))
router.put('/:id', (req, res) => res.json(updateNote(Number(req.params.id), req.body)))
router.delete('/:id', (req, res) => { deleteNote(Number(req.params.id)); res.status(204).end() })

export default router
