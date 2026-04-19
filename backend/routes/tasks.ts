import { Router } from 'express'
import { getTasksByProject, createTask, updateTask, deleteTask } from '../db/tasks'

const router = Router()

router.get('/', (req, res) => {
  const projectId = Number(req.query.projectId)
  if (!projectId) return res.status(400).json({ error: 'projectId required' })
  res.json(getTasksByProject(projectId))
})
router.post('/', (req, res) => res.status(201).json(createTask(req.body)))
router.put('/:id', (req, res) => res.json(updateTask(Number(req.params.id), req.body)))
router.delete('/:id', (req, res) => { deleteTask(Number(req.params.id)); res.status(204).end() })

export default router
