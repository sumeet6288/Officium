import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Megaphone, Clock } from 'lucide-react'
import { issueCommand, type CEOCommand } from '@/components/3d/commandStore'
import { getOfficeClock, getOfficeStatusLine } from '@/components/3d/officeSchedule'

const QUICK_ACTIONS: { label: string; icon: string; cmd: CEOCommand; color: string }[] = [
  { label: 'Work',     icon: '💻', cmd: 'work',    color: '#3b82f6' },
  { label: 'Standup',  icon: '📋', cmd: 'meeting', color: '#8b5cf6' },
  { label: 'Lunch',    icon: '🍱', cmd: 'lounge',  color: '#f97316' },
  { label: 'Coffee',   icon: '☕', cmd: 'coffee',  color: '#d97706' },
  { label: 'Focus',    icon: '🎯', cmd: 'focus',   color: '#0f766e' },
  { label: 'Dismiss',  icon: '🏠', cmd: 'dismiss', color: '#6b7280' },
]

const KEYWORD_MAP: Record<string, CEOCommand> = {
  work:     'work',  working:  'work',  desk:    'work',  back:    'work',
  meeting:  'meeting', standup: 'meeting', gather: 'meeting', everyone: 'meeting',
  lunch:    'lounge', break:   'lounge', lounge:  'lounge', rest:    'lounge',
  coffee:   'coffee', cafe:    'coffee', drink:   'coffee',
  focus:    'focus',  quiet:   'focus',  deep:    'focus',  booth:   'focus',
  dismiss:  'dismiss', home:   'dismiss', leave:  'dismiss', done:    'dismiss',
}

function parseNLP(text: string): CEOCommand | null {
  const words = text.toLowerCase().split(/\s+/)
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '')
    if (KEYWORD_MAP[clean]) return KEYWORD_MAP[clean]
  }
  return null
}

export function CEOCommandBar() {
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [clock, setClock] = useState(getOfficeClock())
  const [status, setStatus] = useState(getOfficeStatusLine())

  useEffect(() => {
    const id = setInterval(() => {
      setClock(getOfficeClock())
      setStatus(getOfficeStatusLine())
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  function fire(cmd: CEOCommand, label: string) {
    issueCommand(cmd)
    setFlash(label)
    setTimeout(() => setFlash(null), 1800)
  }

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed) return
    const cmd = parseNLP(trimmed)
    if (cmd) {
      fire(cmd, trimmed)
    } else {
      setFlash('❓ Not recognized')
      setTimeout(() => setFlash(null), 2000)
    }
    setInput('')
  }

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex flex-col items-center pb-3 px-3 gap-2">
      {/* Flash notification */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="bg-foreground/90 text-background text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm"
          >
            📣 "{flash}" — broadcast to all agents
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command bar */}
      <div className="w-full max-w-3xl bg-background/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-2">
        {/* Clock + status */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground leading-none tabular-nums">{clock}</span>
            <span className={`text-[9px] leading-none mt-0.5 truncate ${status.open ? 'text-emerald-500' : 'text-red-400'}`}>
              {status.text}
            </span>
          </div>
        </div>

        <div className="w-px h-7 bg-border shrink-0 mx-1" />

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {QUICK_ACTIONS.map(({ label, icon, cmd, color }) => (
            <button
              key={cmd}
              onClick={() => fire(cmd, `${icon} ${label}`)}
              title={`Broadcast: ${label}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ background: color }}
            >
              <span className="text-[11px]">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-7 bg-border shrink-0 mx-1" />

        {/* Natural language input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Megaphone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder='Type a command, e.g. "everyone work" or "lunch break"'
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none min-w-0"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 p-1 rounded-md bg-primary/10 hover:bg-primary/20 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3 h-3 text-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
