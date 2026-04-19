import { Router } from 'express'
import { search } from '../db/search'

const router = Router()

router.get('/', (req, res) => {
  const q = String(req.query.q ?? '')
  res.json(search(q))
})

export default router
