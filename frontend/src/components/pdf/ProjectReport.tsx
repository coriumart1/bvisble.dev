import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Project, Note } from '../../types'

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// ── Markdown Parser ───────────────────────────────────────────────────────────

type ParsedLine =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'checkbox'; checked: boolean; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; n: number; text: string }
  | { kind: 'table_row'; cells: string[] }
  | { kind: 'blank' }
  | { kind: 'text'; text: string }

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function parseMarkdown(markdown: string): ParsedLine[] {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result: ParsedLine[] = []
  let inCodeBlock = false

  for (const line of lines) {
    // Code fence toggle
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) {
      if (line.trim()) result.push({ kind: 'text', text: line })
      continue
    }

    // Table separator — skip
    if (/^\|[\s\-:|]+\|/.test(line)) continue

    // Blank
    if (line.trim() === '') {
      result.push({ kind: 'blank' })
      continue
    }

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.+)/)
    if (hm) {
      result.push({ kind: 'heading', level: hm[1].length, text: stripInline(hm[2]) })
      continue
    }

    // Checkbox (checked or unchecked)
    const cbm = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)/)
    if (cbm) {
      result.push({ kind: 'checkbox', checked: cbm[1].toLowerCase() === 'x', text: stripInline(cbm[2]) })
      continue
    }

    // Bullet
    const bm = line.match(/^[-*]\s+(.+)/)
    if (bm) {
      result.push({ kind: 'bullet', text: stripInline(bm[1]) })
      continue
    }

    // Numbered list
    const nm = line.match(/^(\d+)\.\s+(.+)/)
    if (nm) {
      result.push({ kind: 'numbered', n: parseInt(nm[1]), text: stripInline(nm[2]) })
      continue
    }

    // Table row
    if (/^\|.+\|/.test(line)) {
      const cells = line.split('|').map((s) => s.trim()).filter(Boolean)
      result.push({ kind: 'table_row', cells })
      continue
    }

    // Horizontal rule / blockquote — treat as spacing
    if (/^---+$/.test(line.trim()) || /^>\s*$/.test(line)) {
      result.push({ kind: 'blank' })
      continue
    }

    // Blockquote text
    if (/^>\s/.test(line)) {
      const t = stripInline(line.replace(/^>\s*/, ''))
      if (t) result.push({ kind: 'text', text: t })
      continue
    }

    // Regular text
    const t = stripInline(line)
    if (t) result.push({ kind: 'text', text: t })
  }

  return result
}

// ── Design Tokens ─────────────────────────────────────────────────────────────

const C = {
  indigo: '#4f46e5',
  indigoMid: '#6366f1',
  indigoLight: '#eef2ff',
  indigoText: '#3730a3',
  dark: '#111827',
  mid: '#374151',
  muted: '#6b7280',
  light: '#9ca3af',
  border: '#e5e7eb',
  bg: '#f9fafb',
  white: '#ffffff',
}

const F = { regular: 'Helvetica', bold: 'Helvetica-Bold' }
const H_PAD = 52
const V_TOP = 48
const V_BOT = 56

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Content page
  page: {
    paddingTop: V_TOP,
    paddingBottom: V_BOT,
    paddingHorizontal: H_PAD,
    fontFamily: F.regular,
    backgroundColor: C.white,
    fontSize: 10,
    color: C.mid,
  },

  // Cover page
  cover: {
    fontFamily: F.regular,
    backgroundColor: C.white,
  },
  coverAccent: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 6,
    backgroundColor: C.indigo,
  },
  coverBody: {
    paddingTop: 90,
    paddingBottom: 60,
    paddingHorizontal: 60,
  },
  coverEyebrow: {
    fontSize: 9,
    fontFamily: F.bold,
    color: C.indigoMid,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 34,
    fontFamily: F.bold,
    color: C.dark,
    lineHeight: 1.15,
    marginBottom: 10,
  },
  coverDesc: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 1.6,
    marginBottom: 44,
    maxWidth: 380,
  },
  coverRule: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 36,
  },
  coverCards: {
    flexDirection: 'row',
    gap: 14,
  },
  coverCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  coverCardLabel: {
    fontSize: 8,
    fontFamily: F.bold,
    color: C.light,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  coverCardValue: {
    fontSize: 20,
    fontFamily: F.bold,
    color: C.dark,
  },
  coverBottom: {
    position: 'absolute',
    bottom: 32,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverBottomText: { fontSize: 8, color: C.light },
  coverBadge: {
    fontSize: 8,
    fontFamily: F.bold,
    color: C.indigoText,
    backgroundColor: C.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  // Section header on content pages
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.indigo,
  },
  sectionAccent: {
    width: 4, height: 22,
    backgroundColor: C.indigo,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: F.bold,
    color: C.dark,
    letterSpacing: 0.3,
  },

  // Footer (fixed on every content page)
  footer: {
    position: 'absolute',
    bottom: 20,
    left: H_PAD,
    right: H_PAD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: C.light },

  // Markdown elements
  mdH1: { fontSize: 15, fontFamily: F.bold, color: C.dark, marginTop: 16, marginBottom: 6 },
  mdH2: { fontSize: 12, fontFamily: F.bold, color: C.dark, marginTop: 14, marginBottom: 5 },
  mdH3: { fontSize: 10, fontFamily: F.bold, color: C.mid, marginTop: 10, marginBottom: 4 },
  mdH4: { fontSize: 10, fontFamily: F.bold, color: C.muted, marginTop: 8, marginBottom: 3 },
  mdText: { fontSize: 10, color: C.mid, lineHeight: 1.65, marginBottom: 2 },
  mdSpacer: { marginBottom: 7 },

  mdBulletRow: { flexDirection: 'row', gap: 7, marginBottom: 4, paddingLeft: 6 },
  mdBulletDot: { fontSize: 11, color: C.indigo, width: 10, marginTop: -1 },
  mdBulletText: { flex: 1, fontSize: 10, color: C.mid, lineHeight: 1.55 },

  mdCheckRow: { flexDirection: 'row', gap: 8, marginBottom: 5, paddingLeft: 6, alignItems: 'flex-start' },
  mdCheckOpen: {
    width: 11, height: 11,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: C.white,
    marginTop: 1.5,
    flexShrink: 0,
  },
  mdCheckDone: {
    width: 11, height: 11,
    borderRadius: 2,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1.5,
    flexShrink: 0,
  },
  mdCheckMark: { fontSize: 7, color: C.white, fontFamily: F.bold },
  mdCheckText: { flex: 1, fontSize: 10, color: C.mid, lineHeight: 1.55 },
  mdCheckTextDone: { flex: 1, fontSize: 10, color: C.light, lineHeight: 1.55 },

  mdTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 5,
  },
  mdTableHeader: { backgroundColor: C.bg },
  mdTableCell: { flex: 1, fontSize: 9, color: C.mid, paddingHorizontal: 5 },
  mdTableCellBold: { flex: 1, fontSize: 9, fontFamily: F.bold, color: C.dark, paddingHorizontal: 5 },
})

// ── Markdown Renderer ─────────────────────────────────────────────────────────

function renderMarkdown(lines: ParsedLine[]): React.ReactElement {
  const elements: React.ReactElement[] = []
  let blankCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.kind === 'blank') {
      blankCount++
      if (blankCount === 1) {
        elements.push(<View key={`blank-${i}`} style={s.mdSpacer} />)
      }
      continue
    }
    blankCount = 0

    switch (line.kind) {
      case 'heading': {
        const hs = [s.mdH1, s.mdH2, s.mdH3, s.mdH4][Math.min(line.level - 1, 3)]
        elements.push(<Text key={i} style={hs}>{line.text}</Text>)
        break
      }

      case 'checkbox':
        elements.push(
          <View key={i} style={s.mdCheckRow}>
            {line.checked ? (
              <View style={s.mdCheckDone}>
                <Text style={s.mdCheckMark}>✓</Text>
              </View>
            ) : (
              <View style={s.mdCheckOpen} />
            )}
            <Text style={line.checked ? s.mdCheckTextDone : s.mdCheckText}>
              {line.text}
            </Text>
          </View>
        )
        break

      case 'bullet':
        elements.push(
          <View key={i} style={s.mdBulletRow}>
            <Text style={s.mdBulletDot}>·</Text>
            <Text style={s.mdBulletText}>{line.text}</Text>
          </View>
        )
        break

      case 'numbered':
        elements.push(
          <View key={i} style={s.mdBulletRow}>
            <Text style={[s.mdBulletDot, { width: 16 }]}>{line.n}.</Text>
            <Text style={s.mdBulletText}>{line.text}</Text>
          </View>
        )
        break

      case 'table_row': {
        // Determine if this is the first row in a consecutive block
        const prevIsTable = i > 0 && lines[i - 1].kind === 'table_row'
        let rowIdx = 0
        if (prevIsTable) {
          // count back
          let j = i - 1
          while (j >= 0 && lines[j].kind === 'table_row') j--
          rowIdx = i - j - 1
        }
        const isHeader = rowIdx === 0
        elements.push(
          <View key={i} style={[s.mdTableRow, isHeader ? s.mdTableHeader : {}]}>
            {line.cells.map((cell, ci) => (
              <Text key={ci} style={isHeader ? s.mdTableCellBold : s.mdTableCell}>
                {cell}
              </Text>
            ))}
          </View>
        )
        break
      }

      case 'text':
        elements.push(<Text key={i} style={s.mdText}>{line.text}</Text>)
        break
    }
  }

  return <View>{elements}</View>
}

// ── Report Data ───────────────────────────────────────────────────────────────

export interface ReportData {
  project: Project
  notes: Note[]
  totalTime: number
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  archived: 'Archiviert',
  completed: 'Abgeschlossen'
}

// ── Document ──────────────────────────────────────────────────────────────────

export function ProjectReportDocument({ data }: { data: ReportData }): React.JSX.Element {
  const { project, notes, totalTime } = data

  // Match by first heading in content (e.g. # README or # ROADMAP)
  function findByHeading(keyword: string): Note | undefined {
    const re = new RegExp(`^#{1,6}\\s+${keyword}`, 'im')
    return notes.find((n) => n.content && re.test(n.content))
  }

  // Strip the first line if it's the section heading (avoid duplicate header)
  function contentWithoutHeading(note: Note, keyword: string): string {
    const raw = note.content ?? ''
    const lines = raw.replace(/\r\n/g, '\n').split('\n')
    const first = lines.findIndex((l) => l.trim() !== '')
    if (first >= 0 && new RegExp(`^#{1,6}\\s+${keyword}\\s*$`, 'i').test(lines[first].trim())) {
      return lines.slice(first + 1).join('\n')
    }
    return raw
  }

  const readmeNote = findByHeading('README')
  const roadmapNote = findByHeading('ROADMAP')

  const generatedAt = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const readmeLines = readmeNote ? parseMarkdown(contentWithoutHeading(readmeNote, 'README')) : []
  const roadmapLines = roadmapNote ? parseMarkdown(contentWithoutHeading(roadmapNote, 'ROADMAP')) : []

  const footer = (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{project.name}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
        `Seite ${pageNumber} / ${totalPages} · ${generatedAt}`
      } />
    </View>
  )

  return (
    <Document title={`Abschlussbericht – ${project.name}`} author="ProjectManager">

      {/* ── PAGE 1: COVER ── */}
      <Page size="A4" style={s.cover}>
        <View style={s.coverAccent} />
        <View style={s.coverBody}>
          <Text style={s.coverEyebrow}>Abschlussbericht</Text>
          <Text style={s.coverTitle}>{project.name}</Text>
          {project.description ? (
            <Text style={s.coverDesc}>{project.description}</Text>
          ) : null}
          <View style={s.coverRule} />
          <View style={s.coverCards}>
            <View style={s.coverCard}>
              <Text style={s.coverCardLabel}>Projektstart</Text>
              <Text style={s.coverCardValue}>{formatDate(project.start_date)}</Text>
            </View>
            <View style={s.coverCard}>
              <Text style={s.coverCardLabel}>Projektende</Text>
              <Text style={s.coverCardValue}>{formatDate(project.end_date)}</Text>
            </View>
            <View style={s.coverCard}>
              <Text style={s.coverCardLabel}>Gesamtzeit</Text>
              <Text style={s.coverCardValue}>{formatDuration(totalTime)}</Text>
            </View>
          </View>
        </View>
        <View style={s.coverBottom}>
          <Text style={s.coverBottomText}>Erstellt am {generatedAt}</Text>
          <Text style={s.coverBadge}>{STATUS_LABELS[project.status] ?? project.status}</Text>
        </View>
      </Page>

      {/* ── README ── */}
      {readmeNote && (
        <Page size="A4" style={s.page}>
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>README</Text>
          </View>
          {renderMarkdown(readmeLines)}
          {footer}
        </Page>
      )}

      {/* ── ROADMAP ── */}
      {roadmapNote && (
        <Page size="A4" style={s.page}>
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>ROADMAP</Text>
          </View>
          {renderMarkdown(roadmapLines)}
          {footer}
        </Page>
      )}

    </Document>
  )
}
