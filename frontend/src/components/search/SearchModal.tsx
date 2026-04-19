import React, { useEffect, useRef, useState } from 'react'
import type { SearchResult } from '../../types'

const TYPE_CONFIG = {
  project: { icon: '◫', label: 'Projekt', color: 'text-indigo-400' },
  task: { icon: '✓', label: 'Task', color: 'text-emerald-400' },
  note: { icon: '✎', label: 'Notiz', color: 'text-yellow-400' }
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
  onNavigate: (result: SearchResult) => void
}

export function SearchModal({ open, onClose, onNavigate }: SearchModalProps): React.JSX.Element | null {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const data = await window.api.search.query(query)
      setResults(data)
      setActiveIdx(0)
      setLoading(false)
    }, 200)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIdx]) { onNavigate(results[activeIdx]); onClose() }
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <span className="text-gray-500 text-lg">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Projekte, Tasks, Notizen suchen…"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
          />
          {loading && (
            <span className="w-4 h-4 border-2 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
          )}
          <kbd className="text-xs text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, idx) => {
              const cfg = TYPE_CONFIG[r.type]
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === activeIdx ? 'bg-indigo-500/15' : 'hover:bg-gray-800/60'
                    }`}
                    onClick={() => { onNavigate(r); onClose() }}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className={`text-base mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-100 font-medium truncate">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{r.subtitle}</p>
                      )}
                      {r.project_name && (
                        <p className="text-xs text-gray-700 mt-0.5">{r.project_name}</p>
                      )}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded border border-gray-700 ${cfg.color} opacity-60 shrink-0`}>
                      {cfg.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : query && !loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Keine Ergebnisse für „{query}"</div>
        ) : !query ? (
          <div className="px-4 py-4">
            <p className="text-xs text-gray-600 mb-3 font-medium uppercase tracking-wider">Tastaturkürzel</p>
            <div className="flex flex-col gap-2">
              {[
                { keys: ['Ctrl', 'K'], desc: 'Suche öffnen' },
                { keys: ['Ctrl', 'N'], desc: 'Neues Projekt' },
                { keys: ['↑', '↓'], desc: 'Ergebnisse navigieren' },
                { keys: ['Enter'], desc: 'Auswählen' },
                { keys: ['Esc'], desc: 'Schließen' }
              ].map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{desc}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
