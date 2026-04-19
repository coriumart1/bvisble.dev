import React, { useEffect, useState } from 'react'
import { ProjectCard, ConfirmDelete } from '../components/projects/ProjectCard'
import { ProjectForm } from '../components/projects/ProjectForm'
import { Button } from '../components/ui/Button'
import { api } from '../api/client'
import type { Project, ProjectStatus, CreateProjectData, UpdateProjectData } from '../types'

type FilterStatus = 'all' | ProjectStatus

const filterLabels: Record<FilterStatus, string> = {
  all: 'Alle',
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  archived: 'Archiviert'
}

interface ProjectsPageProps {
  onSelectProject: (project: Project) => void
}

export function ProjectsPage({ onSelectProject }: ProjectsPageProps): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<FilterStatus>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | undefined>()
  const [deleteProject, setDeleteProject] = useState<Project | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function handler(): void { setFormOpen(true) }
    window.addEventListener('shortcut:new-project', handler)
    return () => window.removeEventListener('shortcut:new-project', handler)
  }, [])

  async function load(): Promise<void> {
    const data = await api.projects.getAll()
    setProjects(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(data: CreateProjectData | UpdateProjectData): Promise<void> {
    await api.projects.create(data as CreateProjectData)
    await load()
  }

  async function handleEdit(data: CreateProjectData | UpdateProjectData): Promise<void> {
    if (!editProject) return
    await api.projects.update(editProject.id, data as UpdateProjectData)
    setEditProject(undefined)
    await load()
  }

  async function handleDelete(): Promise<void> {
    if (!deleteProject) return
    await api.projects.delete(deleteProject.id)
    setDeleteProject(undefined)
    await load()
  }

  async function handleStatusChange(project: Project, status: ProjectStatus): Promise<void> {
    await api.projects.update(project.id, { status })
    await load()
  }

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  const counts: Record<FilterStatus, number> = {
    all: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-gray-800">
        <h2 className="text-base font-semibold text-white">Projekte</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Neues Projekt</Button>
      </header>

      {/* Filter Tabs */}
      <div className="shrink-0 flex gap-1 px-6 pt-4 pb-2">
        {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {filterLabels[f]}
            <span className={`ml-1.5 text-xs ${filter === f ? 'text-gray-400' : 'text-gray-600'}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Lade...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-gray-600 text-sm">
              {filter === 'active' ? 'Keine aktiven Projekte.' : 'Keine Projekte in dieser Kategorie.'}
            </p>
            {filter === 'active' && (
              <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                Erstes Projekt erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => setEditProject(p)}
                onDelete={(p) => setDeleteProject(p)}
                onStatusChange={handleStatusChange}
                onClick={onSelectProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />

      {editProject && (
        <ProjectForm
          open={!!editProject}
          onClose={() => setEditProject(undefined)}
          onSave={handleEdit}
          project={editProject}
        />
      )}

      {deleteProject && (
        <ConfirmDelete
          project={deleteProject}
          onConfirm={handleDelete}
          onCancel={() => setDeleteProject(undefined)}
        />
      )}
    </div>
  )
}
