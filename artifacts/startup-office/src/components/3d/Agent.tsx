import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent as AgentType } from '@workspace/api-client-react'

interface AgentProps {
  agent: AgentType
  onClick: (id: string) => void
  selected: boolean
}

const SKIN_TONES = ['#f9c784', '#e8956d', '#c8724f', '#a0522d', '#8b4513']
const HAIR_COLORS = ['#1a1a1a', '#4a3728', '#8b6914', '#c0392b', '#6b3a2a']

function getAgentAppearance(agentId: string) {
  const hash = agentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return {
    skin: SKIN_TONES[hash % SKIN_TONES.length],
    hair: HAIR_COLORS[(hash * 3) % HAIR_COLORS.length],
    pantColor: ['#1e3a5f', '#1a2a3a', '#2d1b69', '#0f2027', '#1a3a2a'][hash % 5],
    shoeColor: '#111827',
  }
}

export function Agent3D({ agent, onClick, selected }: AgentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)

  const [targetPos] = useState(() => new THREE.Vector3(agent.position.x, 0, agent.position.z))
  const currentPos = useRef(new THREE.Vector3(agent.position.x, 0, agent.position.z))
  const velocity = useRef(0)
  const [nextMoveTime, setNextMoveTime] = useState(() => Math.random() * 4)

  const appearance = useMemo(() => getAgentAppearance(agent.id), [agent.id])

  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color,
    roughness: 0.8,
    metalness: 0,
    emissive: selected ? new THREE.Color(agent.color).multiplyScalar(0.4) : new THREE.Color(0x000000),
  }), [agent.color, selected])

  const thinkingShirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color,
    emissive: new THREE.Color(agent.color),
    emissiveIntensity: 0.6,
    roughness: 0.5,
  }), [agent.color])

  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: appearance.skin,
    roughness: 0.85,
  }), [appearance.skin])

  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: appearance.hair,
    roughness: 0.9,
  }), [appearance.hair])

  const pantMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: appearance.pantColor,
    roughness: 0.9,
  }), [appearance.pantColor])

  const shoeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: appearance.shoeColor,
    roughness: 0.5,
    metalness: 0.1,
  }), [appearance.shoeColor])

  useFrame((state) => {
    if (!groupRef.current || !modelRef.current) return
    const time = state.clock.elapsedTime
    const seed = agent.id.charCodeAt(0)

    /* ─ Thinking pulse ─ */
    if (agent.status === 'thinking') {
      const pulse = (Math.sin(time * 6) + 1) / 2
      thinkingShirtMaterial.emissiveIntensity = 0.3 + pulse * 0.8
    }

    /* ─ Movement ─ */
    const isMoving = agent.status === 'idle' || agent.status === 'walking'

    if (isMoving) {
      if (time > nextMoveTime) {
        const spread = 8
        targetPos.set(
          agent.position.x + (Math.random() - 0.5) * spread,
          0,
          agent.position.z + (Math.random() - 0.5) * spread,
        )
        setNextMoveTime(time + 3 + Math.random() * 5)
      }
      const dist = currentPos.current.distanceTo(targetPos)
      const speed = Math.min(dist * 0.04, 0.06)
      velocity.current = speed

      currentPos.current.lerp(targetPos, speed)
      groupRef.current.position.copy(currentPos.current)

      if (dist > 0.15) {
        groupRef.current.lookAt(new THREE.Vector3(targetPos.x, groupRef.current.position.y, targetPos.z))
      }
    } else {
      velocity.current *= 0.9
      targetPos.set(agent.position.x, 0, agent.position.z)
      currentPos.current.lerp(targetPos, 0.05)
      groupRef.current.position.copy(currentPos.current)
    }

    const walkSpeed = velocity.current * 30
    const walkAmp = Math.min(velocity.current * 80, 0.55)

    /* ─ Leg walking animation ─ */
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(time * walkSpeed + seed) * walkAmp
      rightLegRef.current.rotation.x = -Math.sin(time * walkSpeed + seed) * walkAmp
    }

    /* ─ Arm swing ─ */
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -Math.sin(time * walkSpeed + seed) * walkAmp * 0.6
      rightArmRef.current.rotation.x = Math.sin(time * walkSpeed + seed) * walkAmp * 0.6
    }

    /* ─ Idle breathing sway ─ */
    if (!isMoving && modelRef.current) {
      modelRef.current.rotation.y = Math.sin(time * 0.8 + seed) * 0.03
      modelRef.current.position.y = Math.sin(time * 1.2 + seed) * 0.01
    }

    /* ─ Working typing animation ─ */
    if (agent.status === 'working' && rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(time * 8) * 0.12 - 0.6
      leftArmRef.current!.rotation.x = Math.sin(time * 8 + 1) * 0.12 - 0.6
    }
  })

  const activeShirt = agent.status === 'thinking' ? thinkingShirtMaterial : shirtMaterial

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-blue-500'
      case 'meeting': return 'bg-purple-500'
      case 'thinking': return 'bg-amber-500 animate-pulse'
      case 'walking': return 'bg-emerald-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <group
      ref={groupRef}
      position={[agent.position.x, 0, agent.position.z]}
      onClick={(e) => { e.stopPropagation(); onClick(agent.id) }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      {/* Selection glow ring */}
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.7} />
        </mesh>
      )}

      <group ref={modelRef}>
        {/* ── SHOES ── */}
        <mesh position={[0.14, 0.07, 0.08]} material={shoeMaterial} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.28]} />
        </mesh>
        <mesh position={[-0.14, 0.07, 0.08]} material={shoeMaterial} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.28]} />
        </mesh>

        {/* ── LEGS (with knee pivot) ── */}
        <group ref={leftLegRef} position={[0.14, 0.5, 0]}>
          {/* Upper leg */}
          <mesh position={[0, -0.25, 0]} material={pantMaterial} castShadow>
            <boxGeometry args={[0.18, 0.5, 0.2]} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.55, 0.02]} material={pantMaterial} castShadow>
            <boxGeometry args={[0.16, 0.3, 0.18]} />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[-0.14, 0.5, 0]}>
          <mesh position={[0, -0.25, 0]} material={pantMaterial} castShadow>
            <boxGeometry args={[0.18, 0.5, 0.2]} />
          </mesh>
          <mesh position={[0, -0.55, 0.02]} material={pantMaterial} castShadow>
            <boxGeometry args={[0.16, 0.3, 0.18]} />
          </mesh>
        </group>

        {/* ── TORSO (shirt) ── */}
        <mesh position={[0, 0.88, 0]} material={activeShirt} castShadow>
          <boxGeometry args={[0.52, 0.6, 0.28]} />
        </mesh>

        {/* Collar */}
        <mesh position={[0, 1.15, 0.1]} material={activeShirt} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.06]} />
        </mesh>

        {/* Shirt pocket */}
        <mesh position={[0.15, 0.95, 0.145]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={new THREE.Color(agent.color).lerp(new THREE.Color('#ffffff'), 0.2).getHexString()} roughness={0.8} />
        </mesh>

        {/* Belt */}
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.52, 0.05, 0.3]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, 0.62, 0.155]}>
          <boxGeometry args={[0.07, 0.04, 0.01]} />
          <meshStandardMaterial color="#6b7280" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* ── ARMS ── */}
        <group ref={leftArmRef} position={[0.34, 1.08, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.18, 0]} material={activeShirt} castShadow>
            <boxGeometry args={[0.16, 0.36, 0.18]} />
          </mesh>
          {/* Lower arm (skin) */}
          <mesh position={[0, -0.42, 0.02]} material={skinMaterial} castShadow>
            <boxGeometry args={[0.14, 0.28, 0.15]} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.6, 0.02]} material={skinMaterial} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.1]} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[-0.34, 1.08, 0]}>
          <mesh position={[0, -0.18, 0]} material={activeShirt} castShadow>
            <boxGeometry args={[0.16, 0.36, 0.18]} />
          </mesh>
          <mesh position={[0, -0.42, 0.02]} material={skinMaterial} castShadow>
            <boxGeometry args={[0.14, 0.28, 0.15]} />
          </mesh>
          <mesh position={[0, -0.6, 0.02]} material={skinMaterial} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.1]} />
          </mesh>
        </group>

        {/* ── NECK ── */}
        <mesh position={[0, 1.21, 0]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[0.1, 0.11, 0.18, 12]} />
        </mesh>

        {/* ── HEAD ── */}
        <mesh position={[0, 1.48, 0]} material={skinMaterial} castShadow>
          <boxGeometry args={[0.38, 0.42, 0.36]} />
        </mesh>

        {/* ── FACE ── */}
        {/* Eyes */}
        <mesh position={[0.1, 1.5, 0.185]}>
          <boxGeometry args={[0.07, 0.055, 0.01]} />
          <meshStandardMaterial color="#111827" roughness={0.2} />
        </mesh>
        <mesh position={[-0.1, 1.5, 0.185]}>
          <boxGeometry args={[0.07, 0.055, 0.01]} />
          <meshStandardMaterial color="#111827" roughness={0.2} />
        </mesh>
        {/* Eye whites */}
        <mesh position={[0.1, 1.505, 0.187]}>
          <boxGeometry args={[0.03, 0.025, 0.005]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.1, 1.505, 0.187]}>
          <boxGeometry args={[0.03, 0.025, 0.005]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, 1.38, 0.186]}>
          <boxGeometry args={[0.1, 0.025, 0.005]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.8} />
        </mesh>
        {/* Eyebrows */}
        <mesh position={[0.1, 1.56, 0.184]}>
          <boxGeometry args={[0.08, 0.02, 0.005]} />
          <meshStandardMaterial color={appearance.hair} roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, 1.56, 0.184]}>
          <boxGeometry args={[0.08, 0.02, 0.005]} />
          <meshStandardMaterial color={appearance.hair} roughness={0.9} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 1.46, 0.192]}>
          <boxGeometry args={[0.04, 0.05, 0.03]} />
          <meshStandardMaterial color={new THREE.Color(appearance.skin).lerp(new THREE.Color('#7c4f2a'), 0.2).getHexString()} roughness={0.9} />
        </mesh>

        {/* ── HAIR ── */}
        <mesh position={[0, 1.72, 0]} material={hairMaterial} castShadow>
          <boxGeometry args={[0.4, 0.14, 0.38]} />
        </mesh>
        <mesh position={[0, 1.65, -0.185]} material={hairMaterial} castShadow>
          <boxGeometry args={[0.38, 0.28, 0.05]} />
        </mesh>
        <mesh position={[0.196, 1.62, 0]} material={hairMaterial} castShadow>
          <boxGeometry args={[0.05, 0.22, 0.36]} />
        </mesh>
        <mesh position={[-0.196, 1.62, 0]} material={hairMaterial} castShadow>
          <boxGeometry args={[0.05, 0.22, 0.36]} />
        </mesh>

        {/* ── THINKING PARTICLES ── */}
        {agent.status === 'thinking' && (
          <group>
            {[0, 1, 2].map((i) => (
              <ThinkingDot key={i} index={i} color={agent.color} />
            ))}
          </group>
        )}
      </group>

      {/* ── NAME BADGE ── */}
      <Html position={[0, 2.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none">
          <div className="bg-background/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 shadow-xl whitespace-nowrap flex items-center gap-1.5">
            <span className="text-base">{agent.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground leading-none">{agent.name}</span>
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{agent.role}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ml-1 ${getStatusColor(agent.status)}`} />
          </div>
          {/* Click hint */}
          <div className="mt-1 text-[8px] text-white/40 font-medium">click to chat</div>
        </div>
      </Html>
    </group>
  )
}

/* ─── Thinking bubble dots ─── */
function ThinkingDot({ index, color }: { index: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const phase = (index / 3) * Math.PI * 2
    ref.current.position.set(
      Math.cos(t * 2 + phase) * 0.22,
      2.0 + Math.sin(t * 3 + phase) * 0.12,
      Math.sin(t * 2 + phase) * 0.22,
    )
    const scale = 0.5 + Math.sin(t * 4 + phase) * 0.3
    ref.current.scale.setScalar(scale)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.9} />
    </mesh>
  )
}
