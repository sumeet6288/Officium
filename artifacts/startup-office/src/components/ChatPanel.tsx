import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Trash2, Bot, User, Loader2 } from 'lucide-react'
import { GlassPanel } from './GlassPanel'
import { Button } from './ui/button'
import { Input } from './ui/input'
import type { Agent } from '@workspace/api-client-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  agentId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatPanelProps {
  agent: Agent
  sessionId: string
  onClose: () => void
}

export function ChatPanel({ agent, sessionId, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const historyKey = [`/api/chat/${agent.id}`, sessionId]

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: historyKey,
    queryFn: async () => {
      const res = await fetch(`/api/chat/${agent.id}?sessionId=${encodeURIComponent(sessionId)}`)
      return res.json()
    },
    enabled: !!sessionId,
    refetchInterval: 4000
  })

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/chat/${agent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send message')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKey })
    }
  })

  const { mutate: clearHistory, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chat/${agent.id}?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE'
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKey })
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-4 right-4 bottom-4 w-[400px] z-50 pointer-events-auto"
      >
        <GlassPanel className="w-full h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/10"
                style={{ backgroundColor: agent.color }}
              >
                {agent.emoji}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{agent.name}</h2>
                <p className="text-xs text-muted-foreground">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => clearHistory()}
                disabled={isClearing || messages.length === 0}
                title="Clear Chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground flex-col gap-3 px-6">
                <Bot className="w-12 h-12 opacity-20" />
                <p className="text-sm">
                  Start a conversation with {agent.name}. Ask about their domain, current tasks, or startup strategy.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    'flex flex-col gap-1 max-w-[85%]',
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                    {msg.role === 'assistant' && <Bot className="w-3 h-3" />}
                    <span>{format(new Date(msg.timestamp), 'h:mm a')}</span>
                    {msg.role === 'user' && <User className="w-3 h-3" />}
                  </div>
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap shadow-md',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-white/10 text-foreground rounded-tl-sm border border-white/5'
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))
            )}

            {isSending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-1 max-w-[85%] mr-auto items-start"
              >
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm shadow-md">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-black/20 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${agent.name}...`}
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                disabled={isSending}
              />
              <Button type="submit" disabled={!input.trim() || isSending} size="icon" className="shrink-0">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  )
}
