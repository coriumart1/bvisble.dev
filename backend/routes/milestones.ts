import { Router } from 'express'
import { getMilestonesByProject, getAllMilestonesWithProject, createMilestone, updateMilestone, deleteMilestone } from '../db/milestones'

const router = Router()

router.get('/', (req, res) => {
  if (req.query.projectId) return res.json(getMilestonesByProject(Number(req.query.projectId)))
  res.json(getAllMilestonesWithProject())
})
router.post('/', (req, res) => res.status(201).json(createMilestone(req.body)))
router.put('/:id', (req, res) => res.json(updateMilestone(Number(req.params.id), req.body)))
router.delete('/:id', (req, res) => { deleteMilestone(Number(req.params.id)); res.status(204).end() })

export default router
