import { useState } from 'react'
import { useGetAgents } from '@workspace/api-client-react'
import { useSession } from '@/hooks/use-session'
import { OfficeScene } from '@/components/3d/OfficeScene'
import { Sidebar } from '@/components/Sidebar'
import { ChatPanel } from '@/components/ChatPanel'
import { Loader2 } from 'lucide-react'

export function OfficePage() {
  const sessionId = useSession()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const { data: agents = [], isLoading } = useGetAgents({
    query: {
      refetchInterval: 3000,
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="font-semibold text-xl">Loading Startup Office...</h2>
      </div>
    )
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <OfficeScene
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentClick={setSelectedAgentId}
      />

      <div className="absolute inset-0 pointer-events-none flex">
        <Sidebar
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentSelect={setSelectedAgentId}
        />

        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            sessionId={sessionId}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </div>
    </div>
  )
}
