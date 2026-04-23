import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export const UPLOADS_DIR = join(process.cwd(), 'uploads')

export function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}
