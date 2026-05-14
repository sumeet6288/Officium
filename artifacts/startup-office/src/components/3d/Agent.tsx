import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent as AgentType } from '@workspace/api-client-react'
import {
  clampMovement,
  DESK_SEATS,
  MEETING_SEATS,
  LOUNGE_SPOTS,
  COFFEE_SPOT,
  WHITEBOARD_SPOTS,
  PRESENTING_SPOT,
  PHONE_BOOTH_SPOT,
  SERVER_SPOTS,
  PING_PONG_SPOTS,
  PATH_TO_MEETING,
  PATH_TO_LOUNGE,
  PATH_TO_DESK_FROM_MEETING,
  PATH_TO_DESK_FROM_LOUNGE,
  PATH_CEO_TO_MEETING,
  PATH_CEO_TO_LOUNGE,
  PATH_CEO_RETURN,
  PATH_TO_COFFEE,
  PATH_TO_WHITEBOARD,
  PATH_TO_PHONE_BOOTH,
  PATH_TO_SERVER,
  PATH_TO_PING_PONG,
  PATH_FROM_COFFEE,
  PATH_FROM_WHITEBOARD,
  PATH_FROM_PHONE_BOOTH,
  PATH_FROM_SERVER,
  PATH_FROM_PING_PONG,
  PATH_CEO_TO_COFFEE,
  PATH_CEO_TO_SERVER,
  PATH_CEO_FROM_COFFEE,
  PATH_CEO_FROM_SERVER,
} from './navigation'
import { registerAgent, getAllAgentLive } from './agentRegistry'

/* ─────────────────────────────────────────────────────── *
 *  BRAIN STATE MACHINE                                     *
 * ─────────────────────────────────────────────────────── */

type BrainState =
  | 'AT_DESK'
  | 'WALKING'
  | 'AT_MEETING'
  | 'AT_LOUNGE'
  | 'CHATTING'
  | 'IDLE_STANDING'
  | 'RETURNING'
  | 'AT_COFFEE'
  | 'AT_WHITEBOARD'
  | 'PRESENTING'
  | 'AT_PHONE_BOOTH'
  | 'AT_SERVER'
  | 'PING_PONG'
  | 'STRETCHING'
  | 'PHONE_CALL'
  | 'SOCIAL_VISIT'

interface BrainData {
  state: BrainState
  waypoints: { x: number; z: number }[]
  waypointIdx: number
  targetPos: THREE.Vector3
  seatPos: { x: number; z: number; rot: number } | null
  stateTimer: number
  chatTargetId: string | null
  chatPos: { x: number; z: number } | null
  isCEO: boolean
  returnPath: { x: number; z: number }[]
  activityPhase: number
  _destState?: BrainState
  _destDuration?: number
}

const AGENT_SPEEDS = { walking: 0.055, returning: 0.07 }
const ARRIVAL_DIST = 0.25

/* Per-agent activity probability boosts — keys are activity states */
const PERSONALITY: Record<string, Partial<Record<string, number>>> = {
  cto:       { AT_SERVER: 0.18, AT_WHITEBOARD: 0.14, PHONE_CALL: 0.10, SOCIAL_VISIT: 0.08 },
  cfo:       { PHONE_CALL: 0.14, AT_COFFEE: 0.16, SOCIAL_VISIT: 0.16, STRETCHING: 0.10 },
  marketing: { PRESENTING: 0.14, AT_WHITEBOARD: 0.18, AT_COFFEE: 0.12, SOCIAL_VISIT: 0.16 },
  pm:        { SOCIAL_VISIT: 0.22, AT_WHITEBOARD: 0.18, AT_COFFEE: 0.12, PRESENTING: 0.08 },
  analyst:   { AT_SERVER: 0.12, AT_PHONE_BOOTH: 0.18, STRETCHING: 0.14, PHONE_CALL: 0.08 },
}

function weightedPick(agentId: string, options: { state: BrainState; base: number }[]): BrainState {
  const persona = PERSONALITY[agentId] ?? {}
  const weighted = options.map(o => ({
    state: o.state,
    w: o.base + (persona[o.state] ?? 0),
  }))
  const total = weighted.reduce((s, o) => s + o.w, 0)
  let r = Math.random() * total
  for (const o of weighted) {
    r -= o.w
    if (r <= 0) return o.state
  }
  return weighted[weighted.length - 1].state
}

function pickNextState(
  current: BrainState,
  isCEO: boolean,
  agentId: string,
): { state: BrainState; toPath: { x: number; z: number }[]; fromPath: { x: number; z: number }[]; duration: number } {

  const noPath: { x: number; z: number }[] = []

  switch (current) {
    case 'AT_DESK':
    case 'RETURNING':
    case 'IDLE_STANDING':
    case 'STRETCHING': {
      const next = weightedPick(agentId, [
        { state: 'AT_MEETING',    base: 0.12 },
        { state: 'AT_LOUNGE',     base: 0.10 },
        { state: 'AT_COFFEE',     base: 0.08 },
        { state: 'AT_WHITEBOARD', base: 0.06 },
        { state: 'PRESENTING',    base: 0.04 },
        { state: 'AT_PHONE_BOOTH',base: 0.05 },
        { state: 'AT_SERVER',     base: 0.04 },
        { state: 'PING_PONG',     base: 0.05 },
        { state: 'SOCIAL_VISIT',  base: 0.08 },
        { state: 'CHATTING',      base: 0.06 },
        { state: 'IDLE_STANDING', base: 0.08 },
        { state: 'STRETCHING',    base: 0.06 },
        { state: 'PHONE_CALL',    base: 0.06 },
        { state: 'AT_DESK',       base: 0.12 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'AT_MEETING':
    case 'AT_WHITEBOARD':
    case 'PRESENTING': {
      const next = weightedPick(agentId, [
        { state: 'RETURNING',  base: 0.40 },
        { state: 'AT_LOUNGE',  base: 0.20 },
        { state: 'AT_COFFEE',  base: 0.15 },
        { state: 'AT_MEETING', base: 0.12 },
        { state: 'PRESENTING', base: 0.08 },
        { state: 'SOCIAL_VISIT', base: 0.05 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'AT_LOUNGE':
    case 'AT_COFFEE':
    case 'PING_PONG': {
      const next = weightedPick(agentId, [
        { state: 'RETURNING',  base: 0.45 },
        { state: 'AT_MEETING', base: 0.18 },
        { state: 'SOCIAL_VISIT', base: 0.12 },
        { state: 'AT_LOUNGE',  base: 0.12 },
        { state: 'PING_PONG',  base: 0.08 },
        { state: 'AT_COFFEE',  base: 0.05 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'CHATTING':
    case 'SOCIAL_VISIT': {
      const next = weightedPick(agentId, [
        { state: 'AT_DESK',       base: 0.40 },
        { state: 'IDLE_STANDING', base: 0.20 },
        { state: 'AT_COFFEE',     base: 0.15 },
        { state: 'AT_MEETING',    base: 0.10 },
        { state: 'SOCIAL_VISIT',  base: 0.10 },
        { state: 'STRETCHING',    base: 0.05 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'AT_SERVER': {
      const next = weightedPick(agentId, [
        { state: 'RETURNING',     base: 0.45 },
        { state: 'AT_COFFEE',     base: 0.25 },
        { state: 'SOCIAL_VISIT',  base: 0.15 },
        { state: 'AT_SERVER',     base: 0.15 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'AT_PHONE_BOOTH': {
      return stateConfig('RETURNING', isCEO, agentId)
    }
    case 'PHONE_CALL': {
      const next = weightedPick(agentId, [
        { state: 'AT_DESK',       base: 0.50 },
        { state: 'IDLE_STANDING', base: 0.25 },
        { state: 'SOCIAL_VISIT',  base: 0.15 },
        { state: 'AT_COFFEE',     base: 0.10 },
      ])
      return stateConfig(next, isCEO, agentId)
    }
    case 'WALKING':
      return stateConfig('AT_MEETING', isCEO, agentId)
    default:
      return stateConfig('AT_DESK', isCEO, agentId)
  }
}

function stateConfig(
  state: BrainState,
  isCEO: boolean,
  _agentId: string,
): { state: BrainState; toPath: { x: number; z: number }[]; fromPath: { x: number; z: number }[]; duration: number } {
  const noPath: { x: number; z: number }[] = []
  switch (state) {
    case 'AT_MEETING':
      return { state, toPath: isCEO ? PATH_CEO_TO_MEETING : PATH_TO_MEETING, fromPath: isCEO ? PATH_CEO_RETURN : PATH_TO_DESK_FROM_MEETING, duration: 25 + Math.random() * 35 }
    case 'AT_LOUNGE':
      return { state, toPath: isCEO ? PATH_CEO_TO_LOUNGE : PATH_TO_LOUNGE, fromPath: isCEO ? PATH_CEO_RETURN : PATH_TO_DESK_FROM_LOUNGE, duration: 15 + Math.random() * 20 }
    case 'AT_COFFEE':
      return { state, toPath: isCEO ? PATH_CEO_TO_COFFEE : PATH_TO_COFFEE, fromPath: isCEO ? PATH_CEO_FROM_COFFEE : PATH_FROM_COFFEE, duration: 10 + Math.random() * 15 }
    case 'AT_WHITEBOARD':
      return { state, toPath: isCEO ? PATH_CEO_TO_MEETING : PATH_TO_WHITEBOARD, fromPath: isCEO ? PATH_CEO_RETURN : PATH_FROM_WHITEBOARD, duration: 15 + Math.random() * 20 }
    case 'PRESENTING':
      return { state, toPath: isCEO ? PATH_CEO_TO_MEETING : PATH_TO_WHITEBOARD, fromPath: isCEO ? PATH_CEO_RETURN : PATH_FROM_WHITEBOARD, duration: 20 + Math.random() * 25 }
    case 'AT_PHONE_BOOTH':
      return { state, toPath: PATH_TO_PHONE_BOOTH, fromPath: PATH_FROM_PHONE_BOOTH, duration: 20 + Math.random() * 30 }
    case 'AT_SERVER':
      return { state, toPath: isCEO ? PATH_CEO_TO_SERVER : PATH_TO_SERVER, fromPath: isCEO ? PATH_CEO_FROM_SERVER : PATH_FROM_SERVER, duration: 15 + Math.random() * 20 }
    case 'PING_PONG':
      return { state, toPath: isCEO ? PATH_CEO_TO_LOUNGE : PATH_TO_PING_PONG, fromPath: isCEO ? PATH_CEO_RETURN : PATH_FROM_PING_PONG, duration: 20 + Math.random() * 25 }
    case 'RETURNING':
      return { state, toPath: noPath, fromPath: noPath, duration: 0 }
    case 'CHATTING':
      return { state, toPath: noPath, fromPath: noPath, duration: 12 + Math.random() * 18 }
    case 'SOCIAL_VISIT':
      return { state, toPath: noPath, fromPath: noPath, duration: 10 + Math.random() * 15 }
    case 'IDLE_STANDING':
      return { state, toPath: noPath, fromPath: noPath, duration: 6 + Math.random() * 10 }
    case 'STRETCHING':
      return { state, toPath: noPath, fromPath: noPath, duration: 6 + Math.random() * 8 }
    case 'PHONE_CALL':
      return { state, toPath: noPath, fromPath: noPath, duration: 10 + Math.random() * 15 }
    case 'AT_DESK':
    default:
      return { state: 'AT_DESK', toPath: noPath, fromPath: noPath, duration: 20 + Math.random() * 40 }
  }
}

/* ─────────────────────────────────────────────────────── *
 *  APPEARANCE                                             *
 * ─────────────────────────────────────────────────────── */

const SKIN_TONES = ['#f9c784', '#e8956d', '#c8724f', '#a0522d', '#8b4513']
const HAIR_COLORS = ['#1a1a1a', '#4a3728', '#8b6914', '#b5651d', '#3d2b1f']

function getAppearance(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    hair: HAIR_COLORS[(h * 3) % HAIR_COLORS.length],
    pants: ['#1e3a5f', '#1a2a3a', '#2d1b69', '#0f2027', '#1a3a2a'][h % 5],
  }
}

function getStatusLabel(state: BrainState): { label: string; cls: string; icon: string } {
  switch (state) {
    case 'AT_DESK':        return { label: 'working',      cls: 'bg-blue-500',    icon: '💻' }
    case 'WALKING':
    case 'RETURNING':      return { label: 'walking',      cls: 'bg-emerald-500', icon: '🚶' }
    case 'AT_MEETING':     return { label: 'in meeting',   cls: 'bg-purple-500',  icon: '📋' }
    case 'AT_LOUNGE':      return { label: 'on break',     cls: 'bg-orange-400',  icon: '🛋️' }
    case 'CHATTING':       return { label: 'chatting',     cls: 'bg-pink-500',    icon: '💬' }
    case 'SOCIAL_VISIT':   return { label: 'visiting',     cls: 'bg-pink-400',    icon: '🤝' }
    case 'IDLE_STANDING':  return { label: 'thinking',     cls: 'bg-gray-400',    icon: '🤔' }
    case 'AT_COFFEE':      return { label: 'coffee break', cls: 'bg-amber-500',   icon: '☕' }
    case 'AT_WHITEBOARD':  return { label: 'brainstorming',cls: 'bg-violet-500',  icon: '✍️' }
    case 'PRESENTING':     return { label: 'presenting',   cls: 'bg-orange-500',  icon: '📊' }
    case 'AT_PHONE_BOOTH': return { label: 'deep focus',   cls: 'bg-purple-700',  icon: '🎯' }
    case 'AT_SERVER':      return { label: 'infra check',  cls: 'bg-blue-700',    icon: '🖥️' }
    case 'PING_PONG':      return { label: 'ping pong',    cls: 'bg-green-500',   icon: '🏓' }
    case 'STRETCHING':     return { label: 'stretching',   cls: 'bg-teal-400',    icon: '🙆' }
    case 'PHONE_CALL':     return { label: 'on a call',    cls: 'bg-indigo-500',  icon: '📞' }
  }
}

/* ─────────────────────────────────────────────────────── *
 *  AGENT 3D COMPONENT                                     *
 * ─────────────────────────────────────────────────────── */

interface AgentProps {
  agent: AgentType
  agents: AgentType[]
  onClick: (id: string) => void
  selected: boolean
}

export function Agent3D({ agent, agents, onClick, selected }: AgentProps) {
  const groupRef    = useRef<THREE.Group>(null)
  const modelRef    = useRef<THREE.Group>(null)
  const leftLegRef  = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef  = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const headRef     = useRef<THREE.Mesh>(null)

  const isCEO = agent.id === 'cto'
  const desk = DESK_SEATS[agent.id] ?? DESK_SEATS['analyst']

  const brain = useRef<BrainData>({
    state: 'AT_DESK',
    waypoints: [],
    waypointIdx: 0,
    targetPos: new THREE.Vector3(desk.x, 0, desk.z),
    seatPos: { ...desk },
    stateTimer: 10 + Math.random() * 20,
    chatTargetId: null,
    chatPos: null,
    isCEO,
    returnPath: [],
    activityPhase: 0,
  })

  const currentPos      = useRef(new THREE.Vector3(desk.x, 0, desk.z))
  const facingAngle     = useRef(desk.rot)
  const velocity        = useRef(0)
  const nearbyAgent     = useRef(false)
  const stuckCheckPos   = useRef(new THREE.Vector3(desk.x, 0, desk.z))
  const stuckCheckTime  = useRef(0)

  const app = useMemo(() => getAppearance(agent.id), [agent.id])

  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color, roughness: 0.8,
    emissive: selected ? new THREE.Color(agent.color).multiplyScalar(0.35) : new THREE.Color(0),
  }), [agent.color, selected])

  const thinkShirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color, emissive: new THREE.Color(agent.color), emissiveIntensity: 0.6, roughness: 0.5,
  }), [agent.color])

  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: app.skin, roughness: 0.85 }), [app.skin])
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: app.hair, roughness: 0.9 }), [app.hair])
  const pantMat = useMemo(() => new THREE.MeshStandardMaterial({ color: app.pants, roughness: 0.9 }), [app.pants])
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 }), [])

  const [displayState, setDisplayState] = useState<BrainState>('AT_DESK')
  const [showNearby,   setShowNearby]   = useState(false)

  const isSitting = useCallback((s: BrainState) =>
    s === 'AT_DESK' || s === 'AT_MEETING' || s === 'AT_LOUNGE', [])

  const claimMeetingSeat = useCallback(() => {
    const taken = new Set<number>()
    getAllAgentLive().forEach((liv) => {
      if (liv.state === 'AT_MEETING') {
        MEETING_SEATS.forEach((s, i) => {
          if (Math.abs(liv.x - s.x) < 0.5 && Math.abs(liv.z - s.z) < 0.5) taken.add(i)
        })
      }
    })
    const free = MEETING_SEATS.filter((_, i) => !taken.has(i))
    return free.length ? free[Math.floor(Math.random() * free.length)] : MEETING_SEATS[Math.floor(Math.random() * MEETING_SEATS.length)]
  }, [])

  const claimLoungeSeat = useCallback(() => {
    const taken = new Set<number>()
    getAllAgentLive().forEach((liv) => {
      if (liv.state === 'AT_LOUNGE') {
        LOUNGE_SPOTS.forEach((s, i) => {
          if (Math.abs(liv.x - s.x) < 0.5 && Math.abs(liv.z - s.z) < 0.5) taken.add(i)
        })
      }
    })
    const free = LOUNGE_SPOTS.filter((_, i) => !taken.has(i))
    return free.length ? free[Math.floor(Math.random() * free.length)] : LOUNGE_SPOTS[0]
  }, [])

  /* ─ Main frame loop ─ */
  useFrame((state) => {
    if (!groupRef.current || !modelRef.current) return
    const t   = state.clock.elapsedTime
    const b   = brain.current
    const pid = agent.id.charCodeAt(0) // phase offset per agent

    /* ── Thinking pulse ── */
    if (b.state === 'AT_DESK') {
      thinkShirtMat.emissiveIntensity = 0.15 + Math.sin(t * 4 + pid) * 0.1
    }

    /* ── Nearby social detection ── */
    const allLive = getAllAgentLive()
    let found = false
    allLive.forEach((liv, id) => {
      if (id === agent.id) return
      const dx = liv.x - currentPos.current.x
      const dz = liv.z - currentPos.current.z
      if (Math.sqrt(dx * dx + dz * dz) < 2.2) found = true
    })
    if (found !== nearbyAgent.current) {
      nearbyAgent.current = found
      setShowNearby(found)
    }

    /* ── State timer / transition ── */
    if (t > b.stateTimer) {
      const next = pickNextState(b.state, b.isCEO, agent.id)
      b.waypointIdx = 0

      /* ── Handle RETURNING — use stored returnPath ── */
      if (next.state === 'RETURNING' && b.returnPath.length > 0) {
        b.waypoints  = [...b.returnPath]
        b.waypointIdx = 0
        b.targetPos.set(b.waypoints[0].x, 0, b.waypoints[0].z)
        b.returnPath = []
        b.chatTargetId = null
        b.state = 'RETURNING'
        b.stateTimer = t + 60
        setDisplayState('RETURNING')
        return
      }

      /* ── SOCIAL_VISIT — walk to a colleague's desk ── */
      if (next.state === 'SOCIAL_VISIT' || next.state === 'CHATTING') {
        const others = agents.filter(a => a.id !== agent.id)
        const pick   = others[Math.floor(Math.random() * others.length)]
        if (pick) {
          const targetDesk = DESK_SEATS[pick.id] ?? DESK_SEATS['analyst']
          const midX = Math.max(-4, Math.min(17, targetDesk.x))
          b.chatTargetId = pick.id
          b.chatPos = {
            x: targetDesk.x + (Math.random() > 0.5 ? 1.2 : -1.2),
            z: targetDesk.z + 1.5,
          }
          b.returnPath = [{ x: midX, z: -4 }]
          b.waypoints  = [{ x: midX, z: -4 }, b.chatPos]
          b.waypointIdx = 0
          b.targetPos.set(b.waypoints[0].x, 0, b.waypoints[0].z)
          b.state = 'WALKING'
          b.stateTimer = t + next.duration
          setDisplayState('WALKING')
          return
        }
      }

      /* ── Activities with toPath ── */
      if (next.toPath.length > 0) {
        b.waypoints   = next.toPath
        b.waypointIdx = 0
        b.targetPos.set(b.waypoints[0].x, 0, b.waypoints[0].z)
        b.returnPath = next.fromPath
        b.state = 'WALKING'
        b.stateTimer = t + 90 // will be overridden on arrival
        b._destState = next.state
        b._destDuration = next.duration
        setDisplayState('WALKING')
        return
      }

      /* ── Inline states (no walking needed) ── */
      if (next.state === 'AT_DESK') {
        b.seatPos = { ...desk }
        b.targetPos.set(desk.x, 0, desk.z)
        b.waypoints = []
        b.chatTargetId = null
      }

      b.state = next.state
      b.stateTimer = t + next.duration
      setDisplayState(next.state)
    }

    /* ── Stuck detection — if agent hasn't moved in 3s while walking, snap back to desk ── */
    const isWalking = b.state === 'WALKING' || b.state === 'RETURNING'
    if (isWalking) {
      if (t - stuckCheckTime.current > 3.0) {
        const moved = currentPos.current.distanceTo(stuckCheckPos.current)
        if (moved < 0.08) {
          // Teleport back to desk and reset state
          currentPos.current.set(desk.x, 0, desk.z)
          b.state = 'AT_DESK'
          b.waypoints = []
          b.waypointIdx = 0
          b.returnPath = []
          b._destState = undefined
          b.seatPos = { ...desk }
          b.chatTargetId = null
          b.stateTimer = t + 5 + Math.random() * 10
          setDisplayState('AT_DESK')
        }
        stuckCheckPos.current.copy(currentPos.current)
        stuckCheckTime.current = t
      }
    } else {
      stuckCheckPos.current.copy(currentPos.current)
      stuckCheckTime.current = t
    }

    /* ── Movement ── */
    const sitting  = isSitting(b.state)

    if (isWalking && b.waypoints.length > 0) {
      const wp = b.waypoints[b.waypointIdx]
      if (!wp) {
        b.state = 'IDLE_STANDING'; b.stateTimer = t + 5; setDisplayState(b.state); return
      }
      b.targetPos.set(wp.x, 0, wp.z)

      const dx   = b.targetPos.x - currentPos.current.x
      const dz   = b.targetPos.z - currentPos.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ARRIVAL_DIST) {
        if (b.waypointIdx < b.waypoints.length - 1) {
          b.waypointIdx++
        } else {
          // Reached final waypoint
          let dest: BrainState = b._destState ?? (b.state === 'RETURNING' ? 'AT_DESK' :
            b.chatTargetId ? (b.chatPos ? 'SOCIAL_VISIT' : 'CHATTING') :
            'AT_MEETING')

          // Resolve seat/position for destination
          if (dest === 'AT_MEETING') { b.seatPos = claimMeetingSeat() }
          else if (dest === 'AT_LOUNGE') { b.seatPos = claimLoungeSeat() }
          else if (dest === 'AT_DESK' || dest === 'RETURNING') {
            b.seatPos = { ...desk }; b.chatTargetId = null; dest = 'AT_DESK'
          }
          else if (dest === 'AT_WHITEBOARD') {
            const ws = WHITEBOARD_SPOTS[Math.floor(Math.random() * WHITEBOARD_SPOTS.length)]
            b.seatPos = ws
          }
          else if (dest === 'PRESENTING') { b.seatPos = PRESENTING_SPOT }
          else if (dest === 'AT_COFFEE') { b.seatPos = COFFEE_SPOT }
          else if (dest === 'AT_PHONE_BOOTH') { b.seatPos = PHONE_BOOTH_SPOT }
          else if (dest === 'AT_SERVER') {
            b.seatPos = SERVER_SPOTS[Math.floor(Math.random() * SERVER_SPOTS.length)]
          }
          else if (dest === 'PING_PONG') {
            b.seatPos = PING_PONG_SPOTS[Math.floor(Math.random() * PING_PONG_SPOTS.length)]
          }
          else if (dest === 'SOCIAL_VISIT' || dest === 'CHATTING') {
            b.seatPos = null
          }

          b.state = dest
          b._destState = undefined
          const dur = b._destDuration ?? (dest === 'AT_MEETING' ? 25 + Math.random() * 35 :
            dest === 'AT_LOUNGE' ? 15 + Math.random() * 20 : 12 + Math.random() * 18)
          b._destDuration = undefined
          b.stateTimer = t + dur
          b.waypoints  = []
          b.waypointIdx = 0
          setDisplayState(dest)
        }
      } else {
        velocity.current = AGENT_SPEEDS.walking
        const nx = currentPos.current.x + (dx / dist) * AGENT_SPEEDS.walking
        const nz = currentPos.current.z + (dz / dist) * AGENT_SPEEDS.walking
        const [cx, cz] = clampMovement(currentPos.current.x, currentPos.current.z, nx, nz)
        currentPos.current.set(cx, 0, cz)
        facingAngle.current = Math.atan2(dx, dz)
      }

    } else if ((b.state === 'CHATTING' || b.state === 'SOCIAL_VISIT') && b.chatPos) {
      const live = b.chatTargetId ? allLive.get(b.chatTargetId) : null
      if (live) {
        const dx = live.x - currentPos.current.x
        const dz = live.z - currentPos.current.z
        if (Math.abs(dx) + Math.abs(dz) > 0.01) facingAngle.current = Math.atan2(dx, dz)
        if (modelRef.current) modelRef.current.rotation.y = Math.sin(t * 0.9 + pid) * 0.1
      }
      velocity.current *= 0.8

    } else if (sitting && b.seatPos) {
      currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, b.seatPos.x, 0.08)
      currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, b.seatPos.z, 0.08)
      facingAngle.current  = THREE.MathUtils.lerp(facingAngle.current, b.seatPos.rot, 0.08)
      velocity.current *= 0.7

    } else if (b.seatPos && (
      b.state === 'AT_WHITEBOARD' || b.state === 'PRESENTING' ||
      b.state === 'AT_COFFEE' || b.state === 'AT_PHONE_BOOTH' ||
      b.state === 'AT_SERVER' || b.state === 'PING_PONG'
    )) {
      currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, b.seatPos.x, 0.07)
      currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, b.seatPos.z, 0.07)
      facingAngle.current  = THREE.MathUtils.lerp(facingAngle.current, b.seatPos.rot, 0.07)
      velocity.current *= 0.7

    } else {
      if (modelRef.current) modelRef.current.rotation.y = Math.sin(t * 0.6 + pid) * 0.1
      velocity.current *= 0.8
    }

    /* ── Apply position + rotation ── */
    groupRef.current.position.copy(currentPos.current)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, facingAngle.current, 0.12)

    /* ── Body Y (sitting crouches) ── */
    const targetBodyY = sitting ? -0.28 : 0
    if (modelRef.current) {
      modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, targetBodyY, 0.08)
    }

    /* ── Limb animations ── */
    const walkAmp   = Math.min(velocity.current * 70, 0.55)
    const walkSpeed = 18

    if (leftLegRef.current && rightLegRef.current) {
      if (sitting) {
        leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x,  -Math.PI / 2.8, 0.1)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -Math.PI / 2.8, 0.1)
      } else if (b.state === 'STRETCHING') {
        leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x,  0.15 * Math.sin(t * 0.8 + pid), 0.1)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.15 * Math.sin(t * 0.8 + pid), 0.1)
      } else if (b.state === 'PING_PONG') {
        leftLegRef.current.rotation.x  = Math.sin(t * 3 + pid) * 0.25
        rightLegRef.current.rotation.x = -Math.sin(t * 3 + pid) * 0.25
      } else {
        leftLegRef.current.rotation.x  = Math.sin(t * walkSpeed) * walkAmp
        rightLegRef.current.rotation.x = -Math.sin(t * walkSpeed) * walkAmp
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      const la = leftArmRef.current
      const ra = rightArmRef.current
      la.rotation.z = 0; ra.rotation.z = 0

      switch (b.state) {
        case 'AT_DESK':
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.9 + Math.sin(t * 9 + pid) * 0.08, 0.1)
          ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -0.9 + Math.sin(t * 9 + pid + 1) * 0.08, 0.1)
          break

        case 'CHATTING':
        case 'SOCIAL_VISIT':
          la.rotation.x  = -0.3 + Math.sin(t * 2.5 + pid) * 0.45
          ra.rotation.x  = -0.3 + Math.cos(t * 2.5 + pid) * 0.35
          la.rotation.z  =  0.2 + Math.sin(t * 2.5 + pid) * 0.18
          ra.rotation.z  = -0.2 + Math.cos(t * 2.5 + pid) * 0.18
          break

        case 'AT_COFFEE':
          // right arm raises mug to mouth rhythmically
          ra.rotation.x = -0.7 + Math.sin(t * 1.2 + pid) * 0.35
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.3, 0.08)
          break

        case 'AT_WHITEBOARD':
          // right arm writes on board
          ra.rotation.x = -1.1 + Math.sin(t * 4 + pid) * 0.15
          ra.rotation.z = -0.1 + Math.cos(t * 3.5 + pid) * 0.12
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.5, 0.08)
          break

        case 'PRESENTING':
          // right arm sweeps, left arm on hip
          ra.rotation.x = -0.6 + Math.sin(t * 0.8 + pid) * 0.5
          ra.rotation.z = -0.15 + Math.cos(t * 0.6 + pid) * 0.2
          la.rotation.x = -0.4 + Math.cos(t * 1.0 + pid) * 0.25
          la.rotation.z =  0.3
          if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5 + pid) * 0.15
          break

        case 'AT_PHONE_BOOTH':
          // calm focus — arms slightly down, barely moving
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.15, 0.05)
          ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -0.15 + Math.sin(t * 0.5 + pid) * 0.05, 0.05)
          break

        case 'AT_SERVER':
          // one arm reaches out to touch rack, other on chin
          ra.rotation.x = -0.9 + Math.sin(t * 2 + pid) * 0.2
          ra.rotation.z = -0.15
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.55, 0.06)
          la.rotation.z =  0.25
          break

        case 'PING_PONG':
          // alternate arm swings (hitting paddle)
          la.rotation.x = -0.5 + Math.sin(t * 4 + pid) * 0.7
          ra.rotation.x = -0.5 + Math.sin(t * 4 + pid + Math.PI) * 0.6
          la.rotation.z =  0.1 + Math.sin(t * 4 + pid) * 0.15
          ra.rotation.z = -0.1 + Math.sin(t * 4 + pid + Math.PI) * 0.15
          break

        case 'STRETCHING':
          // both arms reach up and sway
          la.rotation.x = -1.6 + Math.sin(t * 0.7 + pid) * 0.3
          ra.rotation.x = -1.6 + Math.cos(t * 0.7 + pid) * 0.3
          la.rotation.z =  0.3 + Math.sin(t * 0.7 + pid) * 0.2
          ra.rotation.z = -0.3 + Math.cos(t * 0.7 + pid) * 0.2
          if (modelRef.current) modelRef.current.rotation.y = Math.sin(t * 0.5 + pid) * 0.18
          break

        case 'PHONE_CALL':
          // right arm held up to ear
          ra.rotation.x = -1.3 + Math.sin(t * 0.3 + pid) * 0.06
          ra.rotation.z = -0.55
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.2, 0.06)
          if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.4 + pid) * 0.1
          break

        case 'IDLE_STANDING':
          la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.1 + Math.sin(t * 0.4 + pid) * 0.1, 0.05)
          ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -0.1 + Math.cos(t * 0.4 + pid) * 0.1, 0.05)
          if (modelRef.current) modelRef.current.rotation.y = Math.sin(t * 0.5 + pid) * 0.12
          break

        default:
          if (sitting) {
            la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.5, 0.08)
            ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -0.5, 0.08)
          } else {
            la.rotation.x = -Math.sin(t * walkSpeed) * walkAmp * 0.6
            ra.rotation.x =  Math.sin(t * walkSpeed) * walkAmp * 0.6
          }
      }
    }

    /* ── Update registry ── */
    registerAgent(agent.id, {
      x: currentPos.current.x,
      z: currentPos.current.z,
      state: b.state,
      targetAgentId: b.chatTargetId,
    })
  })

  const { label: statusLabel, cls: statusCls, icon: statusIcon } = getStatusLabel(displayState)
  const activeShirt = displayState === 'AT_DESK' ? thinkShirtMat : shirtMat

  return (
    <group
      ref={groupRef}
      position={[desk.x, 0, desk.z]}
      onClick={(e) => { e.stopPropagation(); onClick(agent.id) }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.75} />
        </mesh>
      )}

      {/* Nearby glow when social */}
      {showNearby && !selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.6, 32]} />
          <meshBasicMaterial color="#f9c784" transparent opacity={0.45} />
        </mesh>
      )}

      <group ref={modelRef}>
        {/* ── SHOES ── */}
        <mesh position={[ 0.14, 0.07, 0.09]} material={shoeMat} castShadow><boxGeometry args={[0.16, 0.08, 0.28]} /></mesh>
        <mesh position={[-0.14, 0.07, 0.09]} material={shoeMat} castShadow><boxGeometry args={[0.16, 0.08, 0.28]} /></mesh>

        {/* ── LEGS ── */}
        <group ref={leftLegRef} position={[ 0.14, 0.52, 0]}>
          <mesh position={[0, -0.25, 0]} material={pantMat} castShadow><boxGeometry args={[0.18, 0.5, 0.2]} /></mesh>
          <mesh position={[0, -0.55, 0.02]} material={pantMat} castShadow><boxGeometry args={[0.16, 0.3, 0.18]} /></mesh>
        </group>
        <group ref={rightLegRef} position={[-0.14, 0.52, 0]}>
          <mesh position={[0, -0.25, 0]} material={pantMat} castShadow><boxGeometry args={[0.18, 0.5, 0.2]} /></mesh>
          <mesh position={[0, -0.55, 0.02]} material={pantMat} castShadow><boxGeometry args={[0.16, 0.3, 0.18]} /></mesh>
        </group>

        {/* ── TORSO ── */}
        <mesh position={[0, 0.9, 0]} material={activeShirt} castShadow><boxGeometry args={[0.52, 0.6, 0.28]} /></mesh>
        <mesh position={[0, 1.16, 0.1]} material={activeShirt}><boxGeometry args={[0.2, 0.1, 0.06]} /></mesh>
        <mesh position={[0.15, 0.96, 0.148]}><boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={'#' + new THREE.Color(agent.color).lerp(new THREE.Color('#ffffff'), 0.25).getHexString()} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.63, 0]}><boxGeometry args={[0.52, 0.05, 0.3]} /><meshStandardMaterial color="#111827" roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0, 0.63, 0.156]}><boxGeometry args={[0.07, 0.04, 0.01]} /><meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.8} /></mesh>

        {/* ── ARMS ── */}
        <group ref={leftArmRef} position={[0.34, 1.1, 0]}>
          <mesh position={[0, -0.18, 0]} material={activeShirt} castShadow><boxGeometry args={[0.16, 0.36, 0.18]} /></mesh>
          <mesh position={[0, -0.42, 0.02]} material={skinMat} castShadow><boxGeometry args={[0.14, 0.28, 0.15]} /></mesh>
          <mesh position={[0, -0.61, 0.02]} material={skinMat} castShadow><boxGeometry args={[0.13, 0.12, 0.1]} /></mesh>
        </group>
        <group ref={rightArmRef} position={[-0.34, 1.1, 0]}>
          <mesh position={[0, -0.18, 0]} material={activeShirt} castShadow><boxGeometry args={[0.16, 0.36, 0.18]} /></mesh>
          <mesh position={[0, -0.42, 0.02]} material={skinMat} castShadow><boxGeometry args={[0.14, 0.28, 0.15]} /></mesh>
          <mesh position={[0, -0.61, 0.02]} material={skinMat} castShadow><boxGeometry args={[0.13, 0.12, 0.1]} /></mesh>
        </group>

        {/* ── NECK ── */}
        <mesh position={[0, 1.22, 0]} material={skinMat} castShadow><cylinderGeometry args={[0.1, 0.11, 0.18, 12]} /></mesh>

        {/* ── HEAD ── */}
        <mesh ref={headRef} position={[0, 1.49, 0]} material={skinMat} castShadow><boxGeometry args={[0.38, 0.42, 0.36]} /></mesh>

        {/* Eyes */}
        <mesh position={[ 0.1, 1.5, 0.185]}><boxGeometry args={[0.07, 0.055, 0.01]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[-0.1, 1.5, 0.185]}><boxGeometry args={[0.07, 0.055, 0.01]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[ 0.1, 1.505, 0.187]}><boxGeometry args={[0.03, 0.025, 0.005]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} /></mesh>
        <mesh position={[-0.1, 1.505, 0.187]}><boxGeometry args={[0.03, 0.025, 0.005]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} /></mesh>
        <mesh position={[ 0.1, 1.57, 0.184]}><boxGeometry args={[0.08, 0.02, 0.005]} /><meshStandardMaterial color={app.hair} roughness={0.9} /></mesh>
        <mesh position={[-0.1, 1.57, 0.184]}><boxGeometry args={[0.08, 0.02, 0.005]} /><meshStandardMaterial color={app.hair} roughness={0.9} /></mesh>
        <mesh position={[0, 1.47, 0.192]}><boxGeometry args={[0.04, 0.05, 0.03]} /><meshStandardMaterial color={app.skin} roughness={0.9} /></mesh>
        <mesh position={[0, 1.38, 0.186]}><boxGeometry args={[0.1, 0.025, 0.005]} /><meshStandardMaterial color="#7c2d12" roughness={0.8} /></mesh>

        {/* ── HAIR ── */}
        <mesh position={[0, 1.73, 0]} material={hairMat} castShadow><boxGeometry args={[0.4, 0.14, 0.38]} /></mesh>
        <mesh position={[0, 1.66, -0.186]} material={hairMat} castShadow><boxGeometry args={[0.38, 0.28, 0.05]} /></mesh>
        <mesh position={[ 0.197, 1.63, 0]} material={hairMat} castShadow><boxGeometry args={[0.05, 0.22, 0.36]} /></mesh>
        <mesh position={[-0.197, 1.63, 0]} material={hairMat} castShadow><boxGeometry args={[0.05, 0.22, 0.36]} /></mesh>

        {/* ── Speech bubble (chatting / social) ── */}
        {(displayState === 'CHATTING' || displayState === 'SOCIAL_VISIT') && <TalkingBubble color={agent.color} />}

        {/* ── Social proximity indicator ── */}
        {showNearby && displayState !== 'CHATTING' && displayState !== 'SOCIAL_VISIT' && (
          <Html position={[0, 2.1, 0]} center style={{ pointerEvents: 'none', fontSize: '14px' }}>👋</Html>
        )}

        {/* ── Thinking dots ── */}
        {displayState === 'AT_DESK' && (
          <group>{[0, 1, 2].map(i => <ThinkingDot key={i} index={i} color={agent.color} />)}</group>
        )}

        {/* ── Activity icon above head ── */}
        {displayState !== 'AT_DESK' && displayState !== 'WALKING' && displayState !== 'RETURNING' && (
          <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none', fontSize: '13px' }}>
            {statusIcon}
          </Html>
        )}
      </group>

      {/* ── NAME BADGE ── */}
      <Html position={[0, 2.55, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none gap-0.5">
          <div className="bg-background/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 shadow-xl whitespace-nowrap flex items-center gap-1.5">
            <span className="text-base">{agent.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground leading-none">{agent.name}</span>
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{agent.role}</span>
            </div>
          </div>
          <div className={`${statusCls} px-2 py-0.5 rounded-full text-[9px] font-semibold text-white uppercase tracking-wide shadow`}>
            {statusLabel}
          </div>
        </div>
      </Html>
    </group>
  )
}

/* ─── Speech bubble ─── */
function TalkingBubble({ color }: { color: string }) {
  return (
    <Html position={[0.45, 2.05, 0]} center style={{ pointerEvents: 'none' }}>
      <div
        style={{ background: color, borderRadius: '10px 10px 10px 2px', padding: '3px 7px', fontSize: '11px', color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'pulse 1s infinite' }}
      >
        💬
      </div>
    </Html>
  )
}

/* ─── Thinking dots ─── */
function ThinkingDot({ index, color }: { index: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    meshRef.current.position.y = 1.95 + Math.sin(t * 3 + index * 1.05) * 0.06
    const s = 0.5 + Math.sin(t * 3 + index * 1.05) * 0.35
    meshRef.current.scale.setScalar(s)
  })
  return (
    <mesh ref={meshRef} position={[-0.08 + index * 0.08, 1.95, 0.2]}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  )
}

