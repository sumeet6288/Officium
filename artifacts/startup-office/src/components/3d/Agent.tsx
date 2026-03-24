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

export function Agent3D({ agent, onClick, selected }: AgentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  
  // Local state for wandering behavior
  const [targetPos] = useState(() => new THREE.Vector3(agent.position.x, 0, agent.position.z))
  const currentPos = useRef(new THREE.Vector3(agent.position.x, 0, agent.position.z))
  const [nextMoveTime, setNextMoveTime] = useState(0)

  // Material setup
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: agent.color,
    roughness: 0.2,
    metalness: 0.1,
    emissive: selected ? new THREE.Color(agent.color).multiplyScalar(0.5) : new THREE.Color(0x000000)
  }), [agent.color, selected])

  const thinkingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: agent.color,
    emissive: new THREE.Color(agent.color),
    emissiveIntensity: 0.5,
  }), [agent.color])

  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return

    const time = state.clock.elapsedTime

    // Bobbing animation
    const bobOffset = Math.sin(time * 3 + agent.id.charCodeAt(0)) * 0.1
    bodyRef.current.position.y = 0.5 + bobOffset

    // Thinking pulsing
    if (agent.status === 'thinking') {
      const pulse = (Math.sin(time * 5) + 1) / 2
      thinkingMaterial.emissiveIntensity = 0.2 + pulse * 0.8
    }

    // Wandering logic if idle or walking
    if (agent.status === 'idle' || agent.status === 'walking') {
      if (time > nextMoveTime) {
        // Pick new target within a +/- 5 unit radius of original DB position
        targetPos.set(
          agent.position.x + (Math.random() - 0.5) * 10,
          0,
          agent.position.z + (Math.random() - 0.5) * 10
        )
        setNextMoveTime(time + 3 + Math.random() * 5) // Move every 3-8 seconds
      }

      // Lerp towards target
      currentPos.current.lerp(targetPos, 0.02)
      groupRef.current.position.copy(currentPos.current)
      
      // Look at target
      if (currentPos.current.distanceTo(targetPos) > 0.1) {
        groupRef.current.lookAt(targetPos.x, groupRef.current.position.y, targetPos.z)
      }
    } else {
      // If working/meeting, slowly lerp back to exact DB position
      targetPos.set(agent.position.x, 0, agent.position.z)
      currentPos.current.lerp(targetPos, 0.05)
      groupRef.current.position.copy(currentPos.current)
    }
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'working': return 'bg-blue-500'
      case 'meeting': return 'bg-purple-500'
      case 'thinking': return 'bg-amber-500'
      case 'walking': return 'bg-emerald-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <group 
      ref={groupRef} 
      position={[agent.position.x, 0, agent.position.z]}
      onClick={(e) => {
        e.stopPropagation()
        onClick(agent.id)
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <group ref={bodyRef}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={agent.status === 'thinking' ? thinkingMaterial : material}>
          <boxGeometry args={[0.8, 1, 0.8]} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={agent.status === 'thinking' ? thinkingMaterial : material}>
          <sphereGeometry args={[0.35, 32, 32]} />
        </mesh>
        
        {/* Selection Ring */}
        {selected && (
          <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 32]} />
            <meshBasicMaterial color={agent.color} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* Floating UI Badge */}
      <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center select-none transition-transform duration-300 hover:scale-110">
          <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl whitespace-nowrap flex items-center gap-2">
            <span className="text-lg">{agent.emoji}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">{agent.name}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{agent.role}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} ml-1 ${agent.status === 'thinking' ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </Html>
    </group>
  )
}
