import React, { useEffect, useState } from 'react'
import { TimerProvider, useTimer } from './contexts/TimerContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { MilestonesPage } from './pages/MilestonesPage'
import { TimeTrackingPage } from './pages/TimeTrackingPage'
import { SearchModal } from './components/search/SearchModal'
import { TopBar } from './components/TopBar'
import { api } from './api/client'
import type { Project, SearchResult } from './types'

type Page = 'projects' | 'milestones' | 'time'

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'projects', label: 'Projekte', icon: '◫' },
  { id: 'milestones', label: 'Meilensteine', icon: '⚑' },
  { id: 'time', label: 'Zeiterfassung', icon: '◷' }
]

function AppInner(): React.JSX.Element {
  const [page, setPage] = useState<Page>('projects')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { activeTimer, stopTimer, formatElapsed } = useTimer()
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (page === 'projects' && !selectedProject) {
          window.dispatchEvent(new CustomEvent('shortcut:new-project'))
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [page, selectedProject])

  function navigateTo(newPage: Page): void {
    setPage(newPage)
    setSelectedProject(null)
  }

  function handleSearchNavigate(result: SearchResult): void {
    if (result.type === 'project') {
      setPage('projects')
      api.projects.getById(result.id).then((project) => {
        if (project) setSelectedProject(project)
      })
    } else if (result.type === 'task' || result.type === 'note') {
      if (result.project_id) {
        setPage('projects')
        api.projects.getById(result.project_id).then((project) => {
          if (project) setSelectedProject(project)
        })
      }
    }
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-56 shrink-0 flex flex-col border-r transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="px-4 py-5 flex items-center justify-between">
            <h1 className={`text-sm font-bold tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              ProjectManager
            </h1>
            <button
              onClick={toggleTheme}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors text-sm ${
                theme === 'dark' ? 'text-gray-600 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'
              }`}
              title={theme === 'dark' ? 'Zum hellen Design' : 'Zum dunklen Design'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>

          <div className="px-2 mb-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                theme === 'dark'
                  ? 'text-gray-500 bg-gray-800/50 hover:bg-gray-800 hover:text-gray-300 border border-gray-800'
                  : 'text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600 border border-gray-200'
              }`}
            >
              <span>⌕</span>
              <span className="flex-1 text-left text-xs">Suchen…</span>
              <kbd className={`text-xs border rounded px-1 py-0.5 ${theme === 'dark' ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'}`}>
                Ctrl K
              </kbd>
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  page === item.id
                    ? theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                    : theme === 'dark' ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {activeTimer && (
            <div className={`mt-auto mx-2 mb-3 p-3 rounded-xl border ${
              theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className={`text-xs ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Timer läuft</span>
              </div>
              <p className={`text-lg font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatElapsed(activeTimer.elapsed)}
              </p>
              <p className={`text-xs truncate mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                {activeTimer.taskTitle}
              </p>
              <button
                onClick={stopTimer}
                className="mt-2 w-full py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                ■ Stop
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {page === 'projects' && !selectedProject && (
            <ProjectsPage onSelectProject={(p) => setSelectedProject(p)} />
          )}
          {page === 'projects' && selectedProject && (
            <ProjectDetailPage project={selectedProject} onBack={() => setSelectedProject(null)} />
          )}
          {page === 'milestones' && <MilestonesPage />}
          {page === 'time' && <TimeTrackingPage />}
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleSearchNavigate} />
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TimerProvider>
          <AppInner />
        </TimerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
