import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent as AgentType } from '@workspace/api-client-react'
import {
  clampMovement,
  DESK_SEATS,
  MEETING_SEATS,
  LOUNGE_SPOTS,
  PATH_TO_MEETING,
  PATH_TO_LOUNGE,
  PATH_TO_DESK_FROM_MEETING,
  PATH_TO_DESK_FROM_LOUNGE,
  PATH_CEO_TO_MEETING,
  PATH_CEO_TO_LOUNGE,
  PATH_CEO_RETURN,
} from './navigation'
import { registerAgent, getAllAgentLive } from './agentRegistry'

/* ─────────────────────────────────────────────────────── *
 *  BRAIN STATE MACHINE                                    *
 * ─────────────────────────────────────────────────────── */

type BrainState =
  | 'AT_DESK'
  | 'WALKING'
  | 'AT_MEETING'
  | 'AT_LOUNGE'
  | 'CHATTING'
  | 'IDLE_STANDING'
  | 'RETURNING'

interface BrainData {
  state: BrainState
  waypoints: { x: number; z: number }[]    // queue of waypoints to walk through
  waypointIdx: number
  targetPos: THREE.Vector3                  // immediate walk target
  seatPos: { x: number; z: number; rot: number } | null
  stateTimer: number                        // when to transition (elapsed seconds)
  chatTargetId: string | null
  chatPos: { x: number; z: number } | null
  isCEO: boolean
}

const AGENT_SPEEDS = { walking: 0.055, returning: 0.07 }
const ARRIVAL_DIST = 0.25

function pickNextState(current: BrainState, isCEO: boolean): {
  state: BrainState
  waypoints: { x: number; z: number }[]
  duration: number
} {
  const r = Math.random()
  switch (current) {
    case 'AT_DESK':
    case 'RETURNING':
    case 'IDLE_STANDING': {
      if (r < 0.30) return { state: 'WALKING', waypoints: isCEO ? PATH_CEO_TO_MEETING : PATH_TO_MEETING, duration: 0 }
      if (r < 0.50) return { state: 'WALKING', waypoints: isCEO ? PATH_CEO_TO_LOUNGE : PATH_TO_LOUNGE, duration: 0 }
      if (r < 0.65) return { state: 'CHATTING', waypoints: [], duration: 15 + Math.random() * 20 }
      if (r < 0.78) return { state: 'IDLE_STANDING', waypoints: [], duration: 8 + Math.random() * 10 }
      return { state: 'AT_DESK', waypoints: [], duration: 25 + Math.random() * 40 }
    }
    case 'AT_MEETING': {
      if (r < 0.50) return { state: 'RETURNING', waypoints: isCEO ? PATH_CEO_RETURN : PATH_TO_DESK_FROM_MEETING, duration: 0 }
      if (r < 0.75) return { state: 'WALKING', waypoints: isCEO ? PATH_CEO_TO_LOUNGE : PATH_TO_LOUNGE, duration: 0 }
      return { state: 'AT_MEETING', waypoints: [], duration: 30 + Math.random() * 30 }
    }
    case 'AT_LOUNGE': {
      if (r < 0.65) return { state: 'RETURNING', waypoints: isCEO ? PATH_CEO_RETURN : PATH_TO_DESK_FROM_LOUNGE, duration: 0 }
      if (r < 0.80) return { state: 'WALKING', waypoints: isCEO ? PATH_CEO_TO_MEETING : PATH_TO_MEETING, duration: 0 }
      return { state: 'AT_LOUNGE', waypoints: [], duration: 15 + Math.random() * 25 }
    }
    case 'CHATTING': {
      if (r < 0.60) return { state: 'AT_DESK', waypoints: [], duration: 20 + Math.random() * 30 }
      return { state: 'IDLE_STANDING', waypoints: [], duration: 8 + Math.random() * 12 }
    }
    case 'WALKING': return { state: 'AT_MEETING', waypoints: [], duration: 30 + Math.random() * 40 }
    default: return { state: 'AT_DESK', waypoints: [], duration: 20 + Math.random() * 30 }
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

function getStatusLabel(state: BrainState): { label: string; cls: string } {
  switch (state) {
    case 'AT_DESK':       return { label: 'working',  cls: 'bg-blue-500' }
    case 'WALKING':
    case 'RETURNING':     return { label: 'walking',  cls: 'bg-emerald-500' }
    case 'AT_MEETING':    return { label: 'meeting',  cls: 'bg-purple-500' }
    case 'AT_LOUNGE':     return { label: 'on break', cls: 'bg-orange-400' }
    case 'CHATTING':      return { label: 'chatting', cls: 'bg-pink-500' }
    case 'IDLE_STANDING': return { label: 'idle',     cls: 'bg-gray-400' }
  }
}

/* ─────────────────────────────────────────────────────── *
 *  AGENT 3D COMPONENT                                     *
 * ─────────────────────────────────────────────────────── */

interface AgentProps {
  agent: AgentType
  agents: AgentType[]        // all agents for social targeting
  onClick: (id: string) => void
  selected: boolean
}

export function Agent3D({ agent, agents, onClick, selected }: AgentProps) {
  const groupRef   = useRef<THREE.Group>(null)
  const modelRef   = useRef<THREE.Group>(null)
  const leftLegRef  = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef  = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)

  const isCEO = agent.id === 'cto' // treat the CTO as the CEO-cabin dweller

  const desk = DESK_SEATS[agent.id] ?? DESK_SEATS['analyst']

  /* initialise brain */
  const brain = useRef<BrainData>({
    state: 'AT_DESK',
    waypoints: [],
    waypointIdx: 0,
    targetPos: new THREE.Vector3(desk.x, 0, desk.z),
    seatPos: { ...desk },
    stateTimer: 20 + Math.random() * 30,
    chatTargetId: null,
    chatPos: null,
    isCEO,
  })

  const currentPos = useRef(new THREE.Vector3(desk.x, 0, desk.z))
  const facingAngle = useRef(desk.rot)
  const velocity = useRef(0)

  /* ─ Materials ─ */
  const app = useMemo(() => getAppearance(agent.id), [agent.id])

  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color, roughness: 0.8,
    emissive: selected ? new THREE.Color(agent.color).multiplyScalar(0.35) : new THREE.Color(0),
  }), [agent.color, selected])

  const thinkShirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color, emissive: new THREE.Color(agent.color), emissiveIntensity: 0.6, roughness: 0.5,
  }), [agent.color])

  const skinMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: app.skin, roughness: 0.85 }), [app.skin])
  const hairMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: app.hair, roughness: 0.9 }), [app.hair])
  const pantMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: app.pants, roughness: 0.9 }), [app.pants])
  const shoeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 }), [])

  /* ─ State badge ─ */
  const [displayState, setDisplayState] = useState<BrainState>('AT_DESK')

  /* ─ Helpers ─ */
  const isSitting = useCallback((s: BrainState) =>
    s === 'AT_DESK' || s === 'AT_MEETING' || s === 'AT_LOUNGE', [])

  /* ─ Arrive at a meeting seat ─ */
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
    const t = state.clock.elapsedTime
    const dt = state.clock.getDelta?.() ?? 0.016
    const b = brain.current

    /* ── Thinking pulse ── */
    if (b.state === 'AT_DESK') {
      thinkShirtMat.emissiveIntensity = 0.15 + Math.sin(t * 4) * 0.1
    }

    /* ── State timer / transition ── */
    if (t > b.stateTimer) {
      const next = pickNextState(b.state, b.isCEO)
      b.waypointIdx = 0

      if (next.state === 'CHATTING') {
        // Pick a random other agent that isn't chatting already
        const others = agents.filter(a => a.id !== agent.id)
        const pick = others[Math.floor(Math.random() * others.length)]
        if (pick) {
          const live = getAllAgentLive().get(pick.id)
          if (live) {
            const dirX = live.x - currentPos.current.x
            const dirZ = live.z - currentPos.current.z
            const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
            b.chatTargetId = pick.id
            b.chatPos = { x: live.x - (dirX / len) * 1.1, z: live.z - (dirZ / len) * 1.1 }
            b.waypoints = [b.chatPos]
          }
        }
      }

      if (next.waypoints.length > 0) {
        b.waypoints = next.waypoints
        b.waypointIdx = 0
        b.targetPos.set(b.waypoints[0].x, 0, b.waypoints[0].z)
      } else if (next.state === 'AT_DESK') {
        b.seatPos = { ...desk }
        b.targetPos.set(desk.x, 0, desk.z)
        b.waypoints = []
      } else if (next.state === 'RETURNING') {
        b.waypoints = next.waypoints
        b.waypointIdx = 0
        b.targetPos.set(b.waypoints[0].x, 0, b.waypoints[0].z)
      }

      b.state = next.waypoints.length > 0 ? 'WALKING' : next.state
      b.stateTimer = t + next.duration
      setDisplayState(b.state)
    }

    /* ── Movement ── */
    const sitting = isSitting(b.state)
    const isWalking = b.state === 'WALKING' || b.state === 'RETURNING'

    if (isWalking && b.waypoints.length > 0) {
      const wp = b.waypoints[b.waypointIdx]
      if (!wp) {
        b.state = 'IDLE_STANDING'
        b.stateTimer = t + 5
        setDisplayState(b.state)
        return
      }
      b.targetPos.set(wp.x, 0, wp.z)

      const dx = b.targetPos.x - currentPos.current.x
      const dz = b.targetPos.z - currentPos.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ARRIVAL_DIST) {
        // reached this waypoint
        if (b.waypointIdx < b.waypoints.length - 1) {
          b.waypointIdx++
        } else {
          // reached final waypoint – transition to destination state
          const dest = b.state === 'RETURNING' ? 'AT_DESK' :
            (b.chatTargetId ? 'CHATTING' :
              (b.waypoints === PATH_TO_LOUNGE || b.waypoints === PATH_CEO_TO_LOUNGE ||
               b.waypoints === PATH_TO_DESK_FROM_MEETING ? 'AT_LOUNGE' : 'AT_MEETING'))

          if (dest === 'AT_MEETING') b.seatPos = claimMeetingSeat()
          else if (dest === 'AT_LOUNGE') b.seatPos = claimLoungeSeat()
          else if (dest === 'AT_DESK') { b.seatPos = { ...desk }; b.chatTargetId = null }
          else if (dest === 'CHATTING') {
            b.seatPos = null
          }

          b.state = dest as BrainState
          b.stateTimer = t + (dest === 'AT_MEETING' ? 30 + Math.random() * 40 :
            dest === 'AT_LOUNGE' ? 15 + Math.random() * 25 :
            dest === 'CHATTING' ? 12 + Math.random() * 18 : 20 + Math.random() * 30)
          b.waypoints = []
          b.waypointIdx = 0
          setDisplayState(dest as BrainState)
        }
      } else {
        // move toward waypoint
        const speed = AGENT_SPEEDS.walking
        velocity.current = speed
        const nx = currentPos.current.x + (dx / dist) * speed
        const nz = currentPos.current.z + (dz / dist) * speed
        const [cx, cz] = clampMovement(currentPos.current.x, currentPos.current.z, nx, nz)
        currentPos.current.set(cx, 0, cz)

        // Face direction of travel
        const tdx = cx - currentPos.current.x + (dx / dist) * speed
        const tdz = cz - currentPos.current.z + (dz / dist) * speed
        if (Math.abs(tdx) + Math.abs(tdz) > 0.001) {
          facingAngle.current = Math.atan2(dx, dz)
        }
      }
    } else if (b.state === 'CHATTING' && b.chatPos) {
      // face the chat target
      const live = b.chatTargetId ? getAllAgentLive().get(b.chatTargetId) : null
      if (live) {
        const dx = live.x - currentPos.current.x
        const dz = live.z - currentPos.current.z
        if (Math.abs(dx) + Math.abs(dz) > 0.01) {
          facingAngle.current = Math.atan2(dx, dz)
        }
        // Nod occasionally
        if (modelRef.current) {
          modelRef.current.rotation.y = Math.sin(t * 0.8 + agent.id.charCodeAt(0)) * 0.08
        }
      }
      velocity.current *= 0.8
    } else if (sitting && b.seatPos) {
      // Lerp into seat position
      currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, b.seatPos.x, 0.08)
      currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, b.seatPos.z, 0.08)
      facingAngle.current = THREE.MathUtils.lerp(
        facingAngle.current,
        b.seatPos.rot,
        0.08,
      )
      velocity.current *= 0.7
    } else {
      // idle standing – small look-around sway
      if (modelRef.current) {
        modelRef.current.rotation.y = Math.sin(t * 0.6 + agent.id.charCodeAt(0)) * 0.1
      }
      velocity.current *= 0.8
    }

    /* ── Apply position + rotation to group ── */
    groupRef.current.position.copy(currentPos.current)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      facingAngle.current,
      0.12,
    )

    /* ── Sitting pose – crouch body ── */
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
      } else {
        leftLegRef.current.rotation.x  = Math.sin(t * walkSpeed) * walkAmp
        rightLegRef.current.rotation.x = -Math.sin(t * walkSpeed) * walkAmp
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (b.state === 'AT_DESK') {
        // Typing animation
        leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x,  -0.9 + Math.sin(t * 9) * 0.08, 0.1)
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.9 + Math.sin(t * 9 + 1) * 0.08, 0.1)
      } else if (b.state === 'CHATTING') {
        // Gesturing
        leftArmRef.current.rotation.x  = -0.3 + Math.sin(t * 2.5) * 0.4
        rightArmRef.current.rotation.x = -0.3 + Math.cos(t * 2.5) * 0.3
        leftArmRef.current.rotation.z  =  0.2 + Math.sin(t * 2.5) * 0.15
        rightArmRef.current.rotation.z = -0.2 + Math.cos(t * 2.5) * 0.15
      } else if (sitting) {
        leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x,  -0.5, 0.08)
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.5, 0.08)
        leftArmRef.current.rotation.z  = 0
        rightArmRef.current.rotation.z = 0
      } else {
        leftArmRef.current.rotation.x  = -Math.sin(t * walkSpeed) * walkAmp * 0.6
        rightArmRef.current.rotation.x =  Math.sin(t * walkSpeed) * walkAmp * 0.6
        leftArmRef.current.rotation.z  = 0
        rightArmRef.current.rotation.z = 0
      }
    }

    /* ── Update shared registry ── */
    registerAgent(agent.id, {
      x: currentPos.current.x,
      z: currentPos.current.z,
      state: b.state,
      targetAgentId: b.chatTargetId,
    })
  })

  /* ─ Status badge ─ */
  const { label: statusLabel, cls: statusCls } = getStatusLabel(displayState)

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
        {/* Shirt pocket */}
        <mesh position={[0.15, 0.96, 0.148]}><boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={'#' + new THREE.Color(agent.color).lerp(new THREE.Color('#ffffff'), 0.25).getHexString()} roughness={0.8} />
        </mesh>
        {/* Belt */}
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
        <mesh position={[0, 1.49, 0]} material={skinMat} castShadow><boxGeometry args={[0.38, 0.42, 0.36]} /></mesh>

        {/* Eyes */}
        <mesh position={[ 0.1, 1.5, 0.185]}><boxGeometry args={[0.07, 0.055, 0.01]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[-0.1, 1.5, 0.185]}><boxGeometry args={[0.07, 0.055, 0.01]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[ 0.1, 1.505, 0.187]}><boxGeometry args={[0.03, 0.025, 0.005]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} /></mesh>
        <mesh position={[-0.1, 1.505, 0.187]}><boxGeometry args={[0.03, 0.025, 0.005]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} /></mesh>
        {/* Eyebrows */}
        <mesh position={[ 0.1, 1.57, 0.184]}><boxGeometry args={[0.08, 0.02, 0.005]} /><meshStandardMaterial color={app.hair} roughness={0.9} /></mesh>
        <mesh position={[-0.1, 1.57, 0.184]}><boxGeometry args={[0.08, 0.02, 0.005]} /><meshStandardMaterial color={app.hair} roughness={0.9} /></mesh>
        {/* Nose */}
        <mesh position={[0, 1.47, 0.192]}><boxGeometry args={[0.04, 0.05, 0.03]} /><meshStandardMaterial color={app.skin} roughness={0.9} /></mesh>
        {/* Mouth */}
        <mesh position={[0, 1.38, 0.186]}><boxGeometry args={[0.1, 0.025, 0.005]} /><meshStandardMaterial color="#7c2d12" roughness={0.8} /></mesh>

        {/* ── HAIR ── */}
        <mesh position={[0, 1.73, 0]} material={hairMat} castShadow><boxGeometry args={[0.4, 0.14, 0.38]} /></mesh>
        <mesh position={[0, 1.66, -0.186]} material={hairMat} castShadow><boxGeometry args={[0.38, 0.28, 0.05]} /></mesh>
        <mesh position={[ 0.197, 1.63, 0]} material={hairMat} castShadow><boxGeometry args={[0.05, 0.22, 0.36]} /></mesh>
        <mesh position={[-0.197, 1.63, 0]} material={hairMat} castShadow><boxGeometry args={[0.05, 0.22, 0.36]} /></mesh>

        {/* ── CHATTING speech bubble hint ── */}
        {displayState === 'CHATTING' && <TalkingBubble color={agent.color} time={0} />}

        {/* ── THINKING dots ── */}
        {displayState === 'AT_DESK' && (
          <group>
            {[0, 1, 2].map(i => <ThinkingDot key={i} index={i} color={agent.color} />)}
          </group>
        )}
      </group>

      {/* ── NAME BADGE ── */}
      <Html position={[0, 2.45, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none gap-0.5">
          <div className="bg-background/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 shadow-xl whitespace-nowrap flex items-center gap-1.5">
            <span className="text-base">{agent.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground leading-none">{agent.name}</span>
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{agent.role}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ml-1 ${statusCls}`} />
          </div>
          <div className="text-[8px] font-semibold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white/60 capitalize">{statusLabel}</div>
        </div>
      </Html>
    </group>
  )
}

/* ─── Thinking dots ─── */
function ThinkingDot({ index, color }: { index: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const phase = (index / 3) * Math.PI * 2
    ref.current.position.set(Math.cos(t * 2 + phase) * 0.2, 2.05 + Math.sin(t * 3 + phase) * 0.1, Math.sin(t * 2 + phase) * 0.2)
    ref.current.scale.setScalar(0.5 + Math.sin(t * 4 + phase) * 0.3)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.048, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.9} />
    </mesh>
  )
}

/* ─── Speech bubble ─── */
function TalkingBubble({ color }: { color: string; time: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = 2.1 + Math.sin(t * 3) * 0.06
    const s = 0.7 + Math.sin(t * 5) * 0.15
    ref.current.scale.set(s, s, s)
  })
  return (
    <mesh ref={ref} position={[0.35, 2.1, 0]}>
      <sphereGeometry args={[0.14, 12, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.75} />
    </mesh>
  )
}
