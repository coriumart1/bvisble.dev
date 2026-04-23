import * as path from 'path'
import * as fs from 'fs'

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}
