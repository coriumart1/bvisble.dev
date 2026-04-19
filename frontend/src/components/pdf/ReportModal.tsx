import React, { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { ProjectReportDocument, type ReportData } from './ProjectReport'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { api } from '../../api/client'
import type { Project } from '../../types'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  project: Project
}

export function ReportModal({ open, onClose, project }: ReportModalProps): React.JSX.Element {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [savedPath, setSavedPath] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setResult(null)
    loadData()
  }, [open])

  async function loadData(): Promise<void> {
    setLoading(true)
    const [notes, totalTime] = await Promise.all([
      api.notes.getByProject(project.id),
      api.time.getTotalByProject(project.id)
    ])
    setData({ project, notes, totalTime })
    setLoading(false)
  }

  async function handleSave(): Promise<void> {
    if (!data) return
    setSaving(true)
    setErrorMessage('')
    try {
      const doc = <ProjectReportDocument data={data} />
      const blob = await pdf(doc).toBlob()

      const filename = `Abschlussbericht_${project.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '_')}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setResult('success')
      setSavedPath(filename)
    } catch (e) {
      console.error('PDF Error:', e)
      setErrorMessage(e instanceof Error ? e.message : String(e))
      setResult('error')
    } finally {
      setSaving(false)
    }
  }

  function formatDuration(seconds: number): string {
    if (seconds === 0) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  function findByHeading(keyword: string) {
    const re = new RegExp(`^#{1,6}\\s+${keyword}`, 'im')
    return data?.notes.find((n) => n.content && re.test(n.content))
  }
  const readmeNote = findByHeading('README')
  const roadmapNote = findByHeading('ROADMAP')

  return (
    <Modal open={open} onClose={onClose} title="Abschlussbericht" size="md">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          Lade Projektdaten…
        </div>
      ) : !data ? null : result === 'success' ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">✓</div>
          <div className="text-center">
            <p className="text-white font-medium">PDF gespeichert</p>
            {savedPath && <p className="text-xs text-gray-500 mt-1 break-all">{savedPath}</p>}
          </div>
          <Button variant="secondary" onClick={onClose}>Schließen</Button>
        </div>
      ) : result === 'error' ? (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-start gap-2 px-3 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="text-red-400 shrink-0">✕</span>
            <div>
              <p className="text-red-300 text-sm font-medium">Fehler beim Speichern</p>
              {errorMessage && (
                <p className="text-red-400/70 text-xs mt-1 break-all">{errorMessage}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResult(null)}>Zurück</Button>
            <Button onClick={handleSave} loading={saving}>Erneut versuchen</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Preview */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Berichtsinhalt</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Projekt', value: data.project.name },
                { label: 'Status', value: { active: 'Aktiv', completed: 'Abgeschlossen', archived: 'Archiviert' }[data.project.status] ?? data.project.status },
                { label: 'Projektstart', value: data.project.start_date ? new Date(data.project.start_date).toLocaleDateString('de-DE') : '—' },
                { label: 'Projektende', value: data.project.end_date ? new Date(data.project.end_date).toLocaleDateString('de-DE') : '—' },
                { label: 'Gesamtzeit', value: formatDuration(data.totalTime) },
                { label: 'README', value: readmeNote ? 'Vorhanden' : 'Keine Notiz "README" gefunden' },
                { label: 'ROADMAP', value: roadmapNote ? 'Vorhanden' : 'Keine Notiz "ROADMAP" gefunden' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm text-gray-100 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {(!readmeNote || !roadmapNote) && (
            <div className="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <span className="text-yellow-400 text-sm shrink-0">⚠</span>
              <p className="text-xs text-yellow-300">
                {!readmeNote && !roadmapNote
                  ? 'Keine Notiz "README" oder "ROADMAP" gefunden.'
                  : !readmeNote
                  ? 'Keine Notiz mit dem Titel "README" gefunden.'
                  : 'Keine Notiz mit dem Titel "ROADMAP" gefunden.'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave} loading={saving}>
              PDF speichern
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
