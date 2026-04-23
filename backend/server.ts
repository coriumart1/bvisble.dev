import express from 'express'
import { join } from 'path'
import { initDatabase } from './db/database'
import projectsRouter from './routes/projects'
import tasksRouter from './routes/tasks'
import milestonesRouter from './routes/milestones'
import notesRouter from './routes/notes'
import timeEntriesRouter from './routes/timeEntries'
import searchRouter from './routes/search'
import foldersRouter from './routes/folders'
import documentsRouter from './routes/documents'
import attachmentsRouter from './routes/attachments'
import { ensureUploadsDir } from './config'

const app = express()
const PORT = Number(process.env.PORT ?? 3000)
const FRONTEND_DIST = join(__dirname, '../../dist/frontend')

app.use(express.json())

app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/milestones', milestonesRouter)
app.use('/api/notes', notesRouter)
app.use('/api/time-entries', timeEntriesRouter)
app.use('/api/search', searchRouter)
app.use('/api/folders', foldersRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/attachments', attachmentsRouter)

app.use(express.static(FRONTEND_DIST))
app.get('*', (_req, res) => res.sendFile(join(FRONTEND_DIST, 'index.html')))

// Error handler — must be last middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message ?? 'Internal server error' })
})

ensureUploadsDir()
initDatabase()
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on :${PORT}`))
