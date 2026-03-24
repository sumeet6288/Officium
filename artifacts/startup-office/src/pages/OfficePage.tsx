import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useGetAgents } from '@workspace/api-client-react'
import { useSession } from '@/hooks/use-session'
import { OfficeScene } from '@/components/3d/OfficeScene'
import { Sidebar } from '@/components/Sidebar'
import { ChatPanel } from '@/components/ChatPanel'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export function OfficePage() {
  const [, setLocation] = useLocation()
  const sessionId = useSession()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const { data: authStatus, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/auth/status', sessionId],
    queryFn: async () => {
      if (!sessionId) return { configured: false }
      const res = await fetch(`/api/auth/status?sessionId=${encodeURIComponent(sessionId)}`)
      return res.json() as Promise<{ configured: boolean }>
    },
    enabled: !!sessionId,
    retry: false
  })

  const { data: agents = [], isLoading: isAgentsLoading } = useGetAgents({
    query: {
      refetchInterval: 3000,
      enabled: !!(authStatus?.configured)
    }
  })

  useEffect(() => {
    if (!sessionId) return
    if (!isAuthLoading && authStatus && !authStatus.configured) {
      setLocation('/setup')
    }
  }, [authStatus, isAuthLoading, sessionId, setLocation])

  if (!sessionId || isAuthLoading || (authStatus?.configured && isAgentsLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="font-semibold text-xl">Loading Startup Office...</h2>
      </div>
    )
  }

  if (!authStatus?.configured) return null

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
