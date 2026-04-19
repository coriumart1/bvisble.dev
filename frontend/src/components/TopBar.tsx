import React, { useEffect, useState } from 'react'

interface ServerStats {
  cpuTemp: number
  ramUsedGB: number
  ramTotalGB: number
  uptimeDays: number
  uptimeHours: number
}

export function TopBar(): React.JSX.Element {
  const [stats, setStats] = useState<ServerStats | null>(null)

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const r = await fetch('https://status.b-visible.dev/status')
        setStats(await r.json())
      } catch { /* server stats unavailable */ }
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-9 shrink-0 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
      <div className="flex items-center gap-3">
        <a
          href="https://ai.b-visible.dev"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
        >
          <span>🤖</span> KI Chat
        </a>
        <a
          href="https://code.b-visible.dev"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
        >
          <span>💻</span> Code
        </a>
        <a
          href="https://terminal.b-visible.dev"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
        >
          <span>⌨️</span> Terminal
        </a>
      </div>
      {stats && (
        <div className="flex items-center gap-4 text-gray-500">
          <span>CPU {stats.cpuTemp}°C</span>
          <span>RAM {stats.ramUsedGB}/{stats.ramTotalGB} GB</span>
          <span>↑ {stats.uptimeDays}d {stats.uptimeHours}h</span>
        </div>
      )}
    </div>
  )
}
