import { Router } from 'express'
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from '../db/projects'

const router = Router()

router.get('/', (_req, res) => res.json(getAllProjects()))
router.get('/:id', (req, res) => {
  const p = getProjectById(Number(req.params.id))
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.json(p)
})
router.post('/', (req, res) => res.status(201).json(createProject(req.body)))
router.put('/:id', (req, res) => res.json(updateProject(Number(req.params.id), req.body)))
router.delete('/:id', (req, res) => { deleteProject(Number(req.params.id)); res.status(204).end() })

export default router
