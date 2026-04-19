import React, { useState } from 'react'
import { Button } from '../ui/Button'
import type { Project, ProjectStatus } from '../../types'

const statusColors: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  archived: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
}

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Aktiv',
  archived: 'Archiviert',
  completed: 'Abgeschlossen'
}

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onStatusChange: (project: Project, status: ProjectStatus) => void
  onClick: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete, onStatusChange, onClick }: ProjectCardProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)

  function formatDate(date: string | null): string {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-pointer relative group"
      onClick={() => onClick(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
          {/* Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ···
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    onClick={() => { onEdit(project); setMenuOpen(false) }}
                  >
                    Bearbeiten
                  </button>
                  {project.status !== 'completed' && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => { onStatusChange(project, 'completed'); setMenuOpen(false) }}
                    >
                      Als abgeschlossen
                    </button>
                  )}
                  {project.status !== 'archived' && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => { onStatusChange(project, 'archived'); setMenuOpen(false) }}
                    >
                      Archivieren
                    </button>
                  )}
                  {project.status !== 'active' && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => { onStatusChange(project, 'active'); setMenuOpen(false) }}
                    >
                      Reaktivieren
                    </button>
                  )}
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    onClick={() => { onDelete(project); setMenuOpen(false) }}
                  >
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {(project.task_count ?? 0) > 0 ? (
          <span>
            <span className="text-gray-300 font-medium">{project.open_task_count ?? 0}</span> / {project.task_count} Tasks offen
          </span>
        ) : (
          <span>Keine Tasks</span>
        )}
        {project.end_date && (
          <span>Bis {formatDate(project.end_date)}</span>
        )}
      </div>
    </div>
  )
}

interface ConfirmDeleteProps {
  project: Project
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDelete({ project, onConfirm, onCancel }: ConfirmDeleteProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-2">Projekt löschen?</h3>
        <p className="text-sm text-gray-400 mb-5">
          „{project.name}" und alle zugehörigen Tasks, Meilensteine und Notizen werden unwiderruflich gelöscht.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>Löschen</Button>
        </div>
      </div>
    </div>
  )
}
