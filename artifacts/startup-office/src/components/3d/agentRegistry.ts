/* Shared live registry so agents can query each other's real-time positions */
export interface AgentLiveState {
  x: number
  z: number
  state: string
  targetAgentId: string | null
}

const registry = new Map<string, AgentLiveState>()

export function registerAgent(id: string, state: AgentLiveState) {
  registry.set(id, state)
}

export function getAgentLive(id: string): AgentLiveState | undefined {
  return registry.get(id)
}

export function getAllAgentLive(): Map<string, AgentLiveState> {
  return registry
}
