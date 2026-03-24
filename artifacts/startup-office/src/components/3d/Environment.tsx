import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Reusable primitives ─── */

function Box({ pos, size, color, roughness = 0.8, metalness = 0, emissive, emissiveIntensity = 0, castShadow = false, receiveShadow = false }: {
  pos: [number, number, number]; size: [number, number, number]; color: string
  roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number
  castShadow?: boolean; receiveShadow?: boolean
}) {
  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}
        emissive={emissive ?? color} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
}

/* ─── Monitor (glowing screen) ─── */
function Monitor({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 0.5) * 0.05
    }
  })
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Stand */}
      <Box pos={[0, 0.05, 0]} size={[0.15, 0.1, 0.15]} color="#1a1a2e" roughness={0.3} metalness={0.5} />
      <Box pos={[0, 0.12, 0]} size={[0.04, 0.3, 0.04]} color="#1a1a2e" roughness={0.3} metalness={0.5} />
      {/* Frame */}
      <Box pos={[0, 0.42, 0]} size={[0.85, 0.5, 0.04]} color="#111827" roughness={0.2} metalness={0.3} />
      {/* Screen */}
      <mesh position={[0, 0.42, 0.025]}>
        <boxGeometry args={[0.79, 0.44, 0.005]} />
        <meshStandardMaterial ref={screenRef} color="#0d1b2a" emissive="#4f46e5" emissiveIntensity={0.6} roughness={0} metalness={0.1} />
      </mesh>
      {/* Code lines on screen */}
      {[0.1, 0.02, -0.06, -0.14].map((y, i) => (
        <mesh key={i} position={[-0.15 + (i % 2) * 0.05, 0.42 + y, 0.03]}>
          <boxGeometry args={[0.3 + (i % 3) * 0.1, 0.018, 0.001]} />
          <meshStandardMaterial emissive={i % 2 === 0 ? '#818cf8' : '#34d399'} emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Office Chair ─── */
function OfficeChair({ pos, rot = 0, color = '#1e293b' }: { pos: [number, number, number]; rot?: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Seat */}
      <Box pos={[0, 0.4, 0]} size={[0.55, 0.07, 0.55]} color={color} roughness={0.8} castShadow />
      {/* Back */}
      <Box pos={[0, 0.78, -0.24]} size={[0.53, 0.65, 0.07]} color={color} roughness={0.8} castShadow />
      {/* Armrests */}
      <Box pos={[0.28, 0.56, 0]} size={[0.05, 0.07, 0.4]} color={color} roughness={0.6} castShadow />
      <Box pos={[-0.28, 0.56, 0]} size={[0.05, 0.07, 0.4]} color={color} roughness={0.6} castShadow />
      {/* Pole */}
      <Box pos={[0, 0.22, 0]} size={[0.06, 0.38, 0.06]} color="#374151" roughness={0.3} metalness={0.7} castShadow />
      {/* Base star */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        return <Box key={i} pos={[Math.sin(rad) * 0.23, 0.04, Math.cos(rad) * 0.23]}
          size={[0.08, 0.05, 0.3]} color="#1f2937" roughness={0.4} metalness={0.5} />
      })}
    </group>
  )
}

/* ─── Desk ─── */
function Desk({ pos, rot = 0, color = '#1e293b', hasMonitor = true }: {
  pos: [number, number, number]; rot?: number; color?: string; hasMonitor?: boolean
}) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Tabletop */}
      <Box pos={[0, 0.75, 0]} size={[1.8, 0.06, 0.9]} color={color} roughness={0.4} castShadow receiveShadow />
      {/* Legs */}
      <Box pos={[0.82, 0.37, 0.38]} size={[0.06, 0.75, 0.06]} color="#111827" roughness={0.4} metalness={0.5} castShadow />
      <Box pos={[-0.82, 0.37, 0.38]} size={[0.06, 0.75, 0.06]} color="#111827" roughness={0.4} metalness={0.5} castShadow />
      <Box pos={[0.82, 0.37, -0.38]} size={[0.06, 0.75, 0.06]} color="#111827" roughness={0.4} metalness={0.5} castShadow />
      <Box pos={[-0.82, 0.37, -0.38]} size={[0.06, 0.75, 0.06]} color="#111827" roughness={0.4} metalness={0.5} castShadow />
      {/* Modesty panel */}
      <Box pos={[0, 0.43, -0.38]} size={[1.6, 0.6, 0.04]} color="#111827" roughness={0.6} />
      {/* Items on desk */}
      <Box pos={[0.6, 0.8, 0]} size={[0.3, 0.02, 0.2]} color="#374151" roughness={0.3} />
      {/* Laptop/notebook */}
      <Box pos={[-0.45, 0.79, 0.1]} size={[0.35, 0.02, 0.25]} color="#0f172a" roughness={0.2} metalness={0.4} />
      {/* Coffee mug */}
      <mesh position={[0.55, 0.82, 0.15]}>
        <cylinderGeometry args={[0.045, 0.04, 0.1, 16]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.6} />
      </mesh>
      {hasMonitor && <Monitor pos={[0, 0.78, -0.2]} rot={Math.PI} />}
    </group>
  )
}

/* ─── Desk Lamp ─── */
function DeskLamp({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.04, 0]} size={[0.12, 0.04, 0.12]} color="#374151" roughness={0.3} metalness={0.6} />
      <Box pos={[0, 0.22, 0]} size={[0.03, 0.36, 0.03]} color="#374151" roughness={0.3} metalness={0.6} />
      <mesh position={[0, 0.42, 0.06]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.1, 0.16, 16, 1, true]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.42, 0.06]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial emissive="#fbbf24" emissiveIntensity={2} color="#fbbf24" />
      </mesh>
      <pointLight position={[0, 0.38, 0.1]} intensity={0.8} color="#fbbf24" distance={3} decay={2} />
    </group>
  )
}

/* ─── Meeting Table ─── */
function MeetingTable({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.76, 0]} size={[4.5, 0.08, 1.8]} color="#1e1b4b" roughness={0.3} metalness={0.1} castShadow receiveShadow />
      {/* Legs */}
      {[[-1.9, 0], [1.9, 0]].map(([x], i) => (
        <Box key={i} pos={[x, 0.38, 0]} size={[0.08, 0.76, 1.6]} color="#2d2b69" roughness={0.3} metalness={0.3} castShadow />
      ))}
      {/* Table items */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <group key={i} position={[x, 0.81, 0]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
            <meshStandardMaterial color="#4c1d95" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.035, 0.1, 16]} />
            <meshStandardMaterial emissive="#a78bfa" emissiveIntensity={0.5} color="#6d28d9" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ─── Plant ─── */
function Plant({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  return (
    <group position={pos} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.25, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.255, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 12]} />
        <meshStandardMaterial color="#292524" roughness={1} />
      </mesh>
      {/* Stem */}
      <Box pos={[0, 0.55, 0]} size={[0.04, 0.55, 0.04]} color="#166534" roughness={0.9} castShadow />
      {/* Leaves cluster */}
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshStandardMaterial color="#15803d" roughness={1} />
      </mesh>
      <mesh position={[0.18, 0.78, 0.1]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
      <mesh position={[-0.12, 0.82, -0.12]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
    </group>
  )
}

/* ─── Sofa ─── */
function Sofa({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Seat */}
      <Box pos={[0, 0.32, 0]} size={[2.2, 0.22, 0.85]} color="#292524" roughness={0.9} castShadow receiveShadow />
      {/* Back */}
      <Box pos={[0, 0.68, -0.38]} size={[2.2, 0.5, 0.2]} color="#292524" roughness={0.9} castShadow />
      {/* Arms */}
      <Box pos={[1.05, 0.54, 0]} size={[0.2, 0.4, 0.85]} color="#1c1917" roughness={0.9} castShadow />
      <Box pos={[-1.05, 0.54, 0]} size={[0.2, 0.4, 0.85]} color="#1c1917" roughness={0.9} castShadow />
      {/* Legs */}
      {[[-0.95, 0.35], [0.95, 0.35], [-0.95, -0.35], [0.95, -0.35]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.1, z]} size={[0.08, 0.2, 0.08]} color="#1c1917" roughness={0.5} metalness={0.3} castShadow />
      ))}
      {/* Cushions */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <Box key={i} pos={[x, 0.47, -0.05]} size={[0.65, 0.12, 0.75]} color="#44403c" roughness={0.95} castShadow />
      ))}
    </group>
  )
}

/* ─── Coffee Table ─── */
function CoffeeTable({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.42, 0]} size={[1.1, 0.06, 0.6]} color="#292524" roughness={0.4} metalness={0.2} castShadow receiveShadow />
      {[[-0.45, 0.25], [0.45, 0.25], [-0.45, -0.25], [0.45, -0.25]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.2, z]} size={[0.05, 0.4, 0.05]} color="#374151" roughness={0.3} metalness={0.6} castShadow />
      ))}
      {/* Items */}
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.01, 16]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>
    </group>
  )
}

/* ─── Bookshelf ─── */
function Bookshelf({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  const colors = ['#7c2d12', '#1e3a5f', '#14532d', '#581c87', '#92400e', '#1e40af']
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Frame */}
      <Box pos={[0, 0.9, 0]} size={[1.2, 1.8, 0.3]} color="#111827" roughness={0.7} castShadow receiveShadow />
      {/* Shelves */}
      {[0.15, 0.55, 0.95, 1.35].map((y, si) => (
        <Box key={si} pos={[0, y, 0.01]} size={[1.18, 0.04, 0.28]} color="#1f2937" roughness={0.5} />
      ))}
      {/* Books */}
      {[0.15, 0.55, 0.95, 1.35].map((y, si) =>
        [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((x, bi) => (
          <Box key={`${si}-${bi}`}
            pos={[x, y + 0.12, 0.02]}
            size={[0.1 + Math.sin(si * 7 + bi) * 0.02, 0.2 + Math.sin(si + bi * 3) * 0.04, 0.22]}
            color={colors[(si * 6 + bi) % colors.length]} roughness={0.8} castShadow />
        ))
      )}
    </group>
  )
}

/* ─── Coffee Machine ─── */
function CoffeeMachine({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.2, 0]} size={[0.3, 0.4, 0.25]} color="#111827" roughness={0.3} metalness={0.5} castShadow />
      <Box pos={[0, 0.38, 0.1]} size={[0.2, 0.06, 0.06]} color="#1f2937" roughness={0.4} metalness={0.6} />
      <mesh position={[0, 0.32, 0.14]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0.14]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial emissive="#f97316" emissiveIntensity={0.6} color="#f97316" />
      </mesh>
      <Box pos={[0, 0.08, 0.1]} size={[0.15, 0.03, 0.1]} color="#374151" roughness={0.5} />
    </group>
  )
}

/* ─── Ceiling Light Panel ─── */
function CeilingLight({ pos }: { pos: [number, number, number] }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.emissiveIntensity = 0.9 + Math.sin(clock.elapsedTime * 2) * 0.02
    }
  })
  return (
    <group position={pos}>
      <Box pos={[0, 0, 0]} size={[1.2, 0.05, 0.4]} color="#1f2937" roughness={0.3} />
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[1.1, 0.01, 0.35]} />
        <meshStandardMaterial ref={ref} color="#e0e7ff" emissive="#c7d2fe" emissiveIntensity={0.9} roughness={0} />
      </mesh>
      <pointLight position={[0, -0.5, 0]} intensity={2} color="#e0e7ff" distance={8} decay={2} />
    </group>
  )
}

/* ─── Window ─── */
function Window({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Frame */}
      <Box pos={[0, 0, 0]} size={[2.0, 2.4, 0.1]} color="#1f2937" roughness={0.4} metalness={0.3} />
      {/* Glass */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[1.8, 2.2, 0.04]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.15} roughness={0} metalness={0.1} />
      </mesh>
      {/* Cross bar */}
      <Box pos={[0, 0, 0.06]} size={[1.8, 0.06, 0.04]} color="#1f2937" roughness={0.4} />
      <Box pos={[0, 0, 0.06]} size={[0.06, 2.2, 0.04]} color="#1f2937" roughness={0.4} />
      {/* Light streaming in */}
      <pointLight position={[0, 0, 1]} intensity={1.2} color="#bfdbfe" distance={8} decay={2} />
    </group>
  )
}

/* ─── Door ─── */
function Door({ pos, rot = 0, open = false }: { pos: [number, number, number]; rot?: number; open?: boolean }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Frame */}
      <Box pos={[-0.55, 1.15, 0]} size={[0.1, 2.5, 0.15]} color="#1f2937" roughness={0.5} castShadow />
      <Box pos={[0.55, 1.15, 0]} size={[0.1, 2.5, 0.15]} color="#1f2937" roughness={0.5} castShadow />
      <Box pos={[0, 2.45, 0]} size={[1.2, 0.1, 0.15]} color="#1f2937" roughness={0.5} castShadow />
      {/* Door panel */}
      <group rotation={[0, open ? -Math.PI / 3 : 0, 0]} position={[0, 0, 0]}>
        <Box pos={[0, 1.1, open ? 0.4 : 0]} size={[0.96, 2.2, 0.08]} color="#111827" roughness={0.5} castShadow />
        {/* Handle */}
        <Box pos={[0.3, 1.05, open ? 0.44 : 0.05]} size={[0.04, 0.04, 0.12]} color="#6b7280" roughness={0.2} metalness={0.8} />
      </group>
      {/* Frosted glass panel above */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[0.96, 0.5, 0.05]} />
        <meshStandardMaterial color="#c7d2fe" transparent opacity={0.3} roughness={0} />
      </mesh>
    </group>
  )
}

/* ─── Whiteboard ─── */
function Whiteboard({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Frame */}
      <Box pos={[0, 0, 0]} size={[2.8, 1.5, 0.08]} color="#1f2937" roughness={0.4} castShadow />
      {/* Board surface */}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[2.65, 1.38, 0.01]} />
        <meshStandardMaterial color="#f0f9ff" roughness={0.1} metalness={0} emissive="#e0f2fe" emissiveIntensity={0.05} />
      </mesh>
      {/* Diagram lines */}
      {[
        { x: -0.6, y: 0.25, w: 1.2, h: 0.03 },
        { x: -0.6, y: 0.1, w: 0.8, h: 0.03 },
        { x: -0.6, y: -0.05, w: 1.0, h: 0.03 },
        { x: -0.6, y: -0.2, w: 0.6, h: 0.03 },
      ].map(({ x, y, w, h }, i) => (
        <mesh key={i} position={[x + w / 2 - 0.6, y, 0.052]}>
          <boxGeometry args={[w, h, 0.001]} />
          <meshStandardMaterial emissive={i % 2 === 0 ? '#4f46e5' : '#0891b2'} emissiveIntensity={1} />
        </mesh>
      ))}
      {/* Box diagram */}
      <mesh position={[0.7, 0, 0.052]}>
        <boxGeometry args={[0.5, 0.5, 0.001]} />
        <meshStandardMaterial color="#fef3c7" transparent opacity={0.6} emissive="#f59e0b" emissiveIntensity={0.2} />
      </mesh>
      {/* Tray */}
      <Box pos={[0, -0.76, 0.08]} size={[2.7, 0.05, 0.12]} color="#374151" roughness={0.4} />
    </group>
  )
}

/* ─── Reception Desk ─── */
function ReceptionDesk({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.6, 0]} size={[3, 1.2, 0.8]} color="#1e1b4b" roughness={0.4} castShadow receiveShadow />
      <Box pos={[0, 1.2, 0.36]} size={[3, 0.06, 0.08]} color="#312e81" roughness={0.3} castShadow />
      <Monitor pos={[0.6, 1.25, 0]} rot={0} />
      <Box pos={[-0.6, 1.25, 0.1]} size={[0.4, 0.02, 0.28]} color="#0f172a" roughness={0.2} metalness={0.4} />
      <mesh position={[-1.0, 1.25, 0.1]}>
        <cylinderGeometry args={[0.05, 0.04, 0.12, 12]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.6} />
      </mesh>
    </group>
  )
}

/* ─── Wall with windows ─── */
function WallWithWindows({ pos, size, rot = 0, windowPositions = [] }: {
  pos: [number, number, number]; size: [number, number, number]; rot?: number
  windowPositions?: number[]
}) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0, 0]} size={size} color="#1e293b" roughness={0.8} castShadow receiveShadow />
      {windowPositions.map((wx, i) => (
        <mesh key={i} position={[wx, 0.5, 0.05]}>
          <boxGeometry args={[1.8, 2.0, 0.15]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.12} roughness={0} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Rug ─── */
function Rug({ pos, size, color }: { pos: [number, number, number]; size: [number, number]; color: string }) {
  return (
    <mesh position={[pos[0], pos[1], pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

/* ─── Main Office Environment ─── */
export function OfficeEnvironment() {
  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Zone floors */}
      {/* CEO Cabin */}
      <Box pos={[-13, 0.01, -13]} size={[11, 0.02, 10]} color="#1e1b4b" roughness={0.4} receiveShadow />
      {/* Workstations */}
      <Box pos={[5, 0.01, -8]} size={[18, 0.02, 14]} color="#0f172a" roughness={0.6} receiveShadow />
      {/* Meeting Room */}
      <Box pos={[-11, 0.01, 9]} size={[12, 0.02, 11]} color="#2e1065" roughness={0.3} receiveShadow />
      {/* Lounge */}
      <Box pos={[13, 0.01, 12]} size={[14, 0.02, 13]} color="#1c1917" roughness={0.7} receiveShadow />
      {/* Reception / Entrance */}
      <Box pos={[0, 0.01, 14]} size={[8, 0.02, 6]} color="#1e293b" roughness={0.5} receiveShadow />

      {/* Rugs */}
      <Rug pos={[-13, 0.02, -13]} size={[8, 7]} color="#312e81" />
      <Rug pos={[-11, 0.02, 9]} size={[9, 8]} color="#4a1d96" />
      <Rug pos={[13, 0.02, 12]} size={[10, 9]} color="#1c1917" />

      {/* Grid */}
      <gridHelper args={[60, 60, '#1e293b', '#0f172a']} position={[0, 0.015, 0]} />

      {/* ── Exterior Walls ── */}
      <WallWithWindows pos={[0, 1.5, -21]} size={[42, 4, 0.4]} windowPositions={[-15, -5, 5, 15]} />
      <WallWithWindows pos={[-21, 1.5, 0]} size={[0.4, 4, 42]} rot={Math.PI / 2} windowPositions={[-12, -4, 4, 12]} />
      <WallWithWindows pos={[21, 1.5, 0]} size={[0.4, 4, 42]} rot={Math.PI / 2} windowPositions={[-12, -4, 4, 12]} />
      <WallWithWindows pos={[0, 1.5, 21]} size={[42, 4, 0.4]} windowPositions={[-10, 0, 10]} />

      {/* ── Interior Partition Walls ── */}
      {/* CEO cabin left wall */}
      <Box pos={[-7.5, 1.5, -10.5]} size={[0.2, 3, 5]} color="#1e293b" roughness={0.7} castShadow />
      {/* CEO cabin back */}
      <Box pos={[-13.5, 1.5, -8]} size={[7, 3, 0.2]} color="#1e293b" roughness={0.7} castShadow />
      {/* Meeting room walls */}
      <Box pos={[-5, 1.5, 4]} size={[0.2, 3, 10]} color="#1e293b" roughness={0.6} castShadow />
      <Box pos={[-11, 1.5, 4]} size={[12, 3, 0.2]} color="#1e293b" roughness={0.6} castShadow />
      {/* Glass meeting room front (partial) */}
      <mesh position={[-11, 1.5, 14.5]}>
        <boxGeometry args={[12, 3, 0.1]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.1} roughness={0} metalness={0.1} />
      </mesh>

      {/* ── Windows on walls ── */}
      <Window pos={[-21, 1.8, -14]} rot={Math.PI / 2} />
      <Window pos={[-21, 1.8, -4]} rot={Math.PI / 2} />
      <Window pos={[-21, 1.8, 6]} rot={Math.PI / 2} />
      <Window pos={[21, 1.8, -14]} rot={-Math.PI / 2} />
      <Window pos={[21, 1.8, 0]} rot={-Math.PI / 2} />
      <Window pos={[21, 1.8, 12]} rot={-Math.PI / 2} />
      <Window pos={[-10, 1.8, -21]} rot={0} />
      <Window pos={[0, 1.8, -21]} rot={0} />
      <Window pos={[10, 1.8, -21]} rot={0} />

      {/* ── Doors ── */}
      <Door pos={[-7.5, 0, -13.5]} rot={Math.PI / 2} open />
      <Door pos={[-5, 0, 8]} rot={Math.PI / 2} open />
      <Door pos={[4, 0, 21]} rot={0} open />

      {/* ── Ceiling ── */}
      <Box pos={[0, 3.5, 0]} size={[42, 0.2, 42]} color="#0f172a" roughness={1} />

      {/* ── Ceiling Lights ── */}
      {/* Workstation lights */}
      {[-3, 5, 13].map(x => [-12, -6, 0].map(z => (
        <CeilingLight key={`${x}-${z}`} pos={[x, 3.4, z]} />
      )))}
      {/* CEO cabin */}
      <CeilingLight pos={[-13, 3.4, -13]} />
      <CeilingLight pos={[-13, 3.4, -7]} />
      {/* Meeting room */}
      <CeilingLight pos={[-11, 3.4, 9]} />
      <CeilingLight pos={[-11, 3.4, 14]} />
      {/* Lounge */}
      <CeilingLight pos={[13, 3.4, 9]} />
      <CeilingLight pos={[13, 3.4, 15]} />
      {/* Entrance */}
      <CeilingLight pos={[0, 3.4, 15]} />

      {/* Ambient fill lights for zones */}
      <pointLight position={[-13, 2.5, -13]} intensity={1.5} color="#e0e7ff" distance={10} decay={2} />
      <pointLight position={[5, 2.5, -8]} intensity={2} color="#dbeafe" distance={15} decay={2} />
      <pointLight position={[-11, 2.5, 9]} intensity={1.8} color="#ede9fe" distance={10} decay={2} />
      <pointLight position={[13, 2.5, 12]} intensity={1.2} color="#fef3c7" distance={12} decay={2} />

      {/* ── CEO CABIN ── */}
      <Desk pos={[-14, 0, -14]} rot={Math.PI / 4 * 0} color="#312e81" />
      <OfficeChair pos={[-14, 0, -12.6]} rot={0} color="#1e1b4b" />
      <Plant pos={[-18, 0, -18]} scale={1.3} />
      <Plant pos={[-9, 0, -18]} scale={1.0} />
      <Bookshelf pos={[-18.5, 0, -11]} rot={Math.PI / 2} />
      <DeskLamp pos={[-13.1, 0.78, -14.2]} />
      {/* CEO name plate */}
      <Box pos={[-14, 0.82, -13.4]} size={[0.4, 0.05, 0.1]} color="#4f46e5" roughness={0.3} metalness={0.5} />

      {/* ── WORKSTATIONS ── */}
      {/* Row 1 */}
      <Desk pos={[-3, 0, -14]} rot={0} color="#1e293b" />
      <OfficeChair pos={[-3, 0, -12.7]} rot={0} color="#0f172a" />
      <DeskLamp pos={[-2.1, 0.78, -14.2]} />

      <Desk pos={[3, 0, -14]} rot={0} color="#1e293b" />
      <OfficeChair pos={[3, 0, -12.7]} rot={0} color="#0f172a" />
      <DeskLamp pos={[3.9, 0.78, -14.2]} />

      <Desk pos={[10, 0, -14]} rot={0} color="#1e293b" />
      <OfficeChair pos={[10, 0, -12.7]} rot={0} color="#0f172a" />

      {/* Row 2 */}
      <Desk pos={[-3, 0, -8]} rot={Math.PI} color="#1e293b" />
      <OfficeChair pos={[-3, 0, -9.3]} rot={Math.PI} color="#0f172a" />

      <Desk pos={[3, 0, -8]} rot={Math.PI} color="#1e293b" />
      <OfficeChair pos={[3, 0, -9.3]} rot={Math.PI} color="#0f172a" />

      <Desk pos={[10, 0, -8]} rot={Math.PI} color="#1e293b" />
      <OfficeChair pos={[10, 0, -9.3]} rot={Math.PI} color="#0f172a" />
      <DeskLamp pos={[10.9, 0.78, -7.8]} />

      {/* Row 3 - more desks */}
      <Desk pos={[16, 0, -14]} rot={0} color="#1e293b" />
      <OfficeChair pos={[16, 0, -12.7]} rot={0} color="#0f172a" />

      <Desk pos={[16, 0, -8]} rot={Math.PI} color="#1e293b" />
      <OfficeChair pos={[16, 0, -9.3]} rot={Math.PI} color="#0f172a" />

      {/* Workstation plants */}
      <Plant pos={[18.5, 0, -18]} scale={1.2} />
      <Plant pos={[-2, 0, -18]} scale={0.9} />
      <Bookshelf pos={[18.5, 0, -11]} rot={-Math.PI / 2} />

      {/* ── MEETING ROOM ── */}
      <MeetingTable pos={[-11, 0, 9]} />
      {/* Chairs around meeting table */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <OfficeChair key={`mt-top-${i}`} pos={[-11 + x, 0, 6.5]} rot={Math.PI} color="#2e1065" />
      ))}
      {[-1.5, 0, 1.5].map((x, i) => (
        <OfficeChair key={`mt-bot-${i}`} pos={[-11 + x, 0, 11.5]} rot={0} color="#2e1065" />
      ))}
      <OfficeChair pos={[-14.5, 0, 9]} rot={Math.PI / 2} color="#2e1065" />
      <OfficeChair pos={[-7.5, 0, 9]} rot={-Math.PI / 2} color="#2e1065" />
      <Whiteboard pos={[-11, 2, 4.5]} rot={0} />
      <Plant pos={[-16.5, 0, 4.5]} scale={1.1} />
      <Plant pos={[-5.5, 0, 4.5]} scale={1.0} />
      {/* Projector screen hint */}
      <Box pos={[-11, 2, 3.8]} size={[3.5, 2, 0.05]} color="#f0f9ff" roughness={0.1} emissive="#e0f2fe" emissiveIntensity={0.08} />

      {/* ── LOUNGE / CAFETERIA ── */}
      <Sofa pos={[10, 0, 10]} rot={Math.PI / 2} />
      <Sofa pos={[16, 0, 10]} rot={-Math.PI / 2} />
      <CoffeeTable pos={[13, 0, 10]} />
      <CoffeeMachine pos={[19, 0, 17]} />
      {/* Counter */}
      <Box pos={[18, 0.55, 15]} size={[2, 1.1, 0.6]} color="#292524" roughness={0.6} castShadow receiveShadow />
      <Box pos={[18, 1.12, 14.8]} size={[2.1, 0.06, 0.7]} color="#1c1917" roughness={0.4} castShadow />
      {/* Stools at counter */}
      {[-0.5, 0.5].map((x, i) => (
        <group key={i} position={[18 + x, 0, 14]}>
          <Box pos={[0, 0.45, 0]} size={[0.35, 0.05, 0.35]} color="#1c1917" roughness={0.8} castShadow />
          <Box pos={[0, 0.22, 0]} size={[0.04, 0.44, 0.04]} color="#374151" roughness={0.3} metalness={0.6} castShadow />
          <Box pos={[0, 0.04, 0]} size={[0.3, 0.04, 0.3]} color="#111827" roughness={0.4} castShadow />
        </group>
      ))}
      <Plant pos={[6.5, 0, 18.5]} scale={1.4} />
      <Plant pos={[19.5, 0, 9.5]} scale={1.2} />
      <Plant pos={[6.5, 0, 9.5]} scale={1.0} />
      {/* Coffee mugs on lounge table */}
      {[[-0.25, 0], [0.25, 0]].map(([x, z], i) => (
        <mesh key={i} position={[13 + x, 0.47, 10 + z]}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
          <meshStandardMaterial color={i === 0 ? '#7c3aed' : '#059669'} roughness={0.6} />
        </mesh>
      ))}

      {/* ── RECEPTION / ENTRANCE ── */}
      <ReceptionDesk pos={[0, 0, 14]} />
      <OfficeChair pos={[0, 0, 12.8]} rot={0} color="#1e1b4b" />
      <Plant pos={[4.5, 0, 18.5]} scale={1.5} />
      <Plant pos={[-4.5, 0, 18.5]} scale={1.3} />

      {/* ── Decorative Elements ── */}
      {/* Corner plants at room intersections */}
      <Plant pos={[-20, 0, -20]} scale={1.5} />
      <Plant pos={[20, 0, -20]} scale={1.2} />
      <Plant pos={[-20, 0, 20]} scale={1.3} />
      <Plant pos={[20, 0, 20]} scale={1.4} />
    </group>
  )
}
