import { Users, Bot, Briefcase, Activity } from 'lucide-react'
import { GlassPanel } from './GlassPanel'
import { Badge } from './ui/badge'
import type { Agent } from '@workspace/api-client-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  agents: Agent[]
  selectedAgentId: string | null
  onAgentSelect: (id: string) => void
}

export function Sidebar({ agents, selectedAgentId, onAgentSelect }: SidebarProps) {
  return (
    <GlassPanel className="w-80 h-full flex flex-col pointer-events-auto rounded-none border-l-0 border-y-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          StartupHQ
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Manage your AI team</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Users className="w-4 h-4" />
          Team Roster ({agents.length})
        </div>

        <div className="space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onAgentSelect(agent.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-300 border flex flex-col gap-3",
                selectedAgentId === agent.id 
                  ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5" 
                  : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/10"
                  style={{ backgroundColor: `${agent.color}40` }}
                >
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Briefcase className="w-3 h-3" />
                    <span className="truncate">{agent.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full">
                <Badge variant={agent.status === 'working' ? 'info' : agent.status === 'thinking' ? 'warning' : 'secondary'} className="text-[10px] uppercase">
                  {agent.status}
                </Badge>
                {agent.status === 'thinking' && (
                  <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}
