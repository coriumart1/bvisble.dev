import { Router } from 'express'
import { getEntriesByTask, getEntriesByProject, getAllEntries, getTotalByProject, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '../db/timeEntries'

const router = Router()

router.get('/', (req, res) => {
  if (req.query.taskId) return res.json(getEntriesByTask(Number(req.query.taskId)))
  if (req.query.projectId) return res.json(getEntriesByProject(Number(req.query.projectId)))
  res.json(getAllEntries())
})
router.get('/total', (req, res) => {
  const projectId = Number(req.query.projectId)
  if (!projectId) return res.status(400).json({ error: 'projectId required' })
  res.json({ total: getTotalByProject(projectId) })
})
router.post('/', (req, res) => res.status(201).json(createTimeEntry(req.body)))
router.put('/:id', (req, res) => res.json(updateTimeEntry(Number(req.params.id), req.body)))
router.delete('/:id', (req, res) => { deleteTimeEntry(Number(req.params.id)); res.status(204).end() })

export default router
