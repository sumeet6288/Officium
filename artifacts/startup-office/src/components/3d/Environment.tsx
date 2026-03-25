import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Reusable primitive ─── */
function Box({ pos, size, color, roughness = 0.7, metalness = 0, castShadow = false, receiveShadow = false }: {
  pos: [number, number, number]; size: [number, number, number]; color: string
  roughness?: number; metalness?: number; castShadow?: boolean; receiveShadow?: boolean
}) {
  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

/* ─── Monitor ─── */
function Monitor({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0.05, 0]} size={[0.15, 0.1, 0.15]} color="#9ca3af" roughness={0.3} metalness={0.5} />
      <Box pos={[0, 0.12, 0]} size={[0.04, 0.3, 0.04]} color="#9ca3af" roughness={0.3} metalness={0.5} />
      <Box pos={[0, 0.42, 0]} size={[0.85, 0.5, 0.04]} color="#374151" roughness={0.2} metalness={0.3} />
      <mesh position={[0, 0.42, 0.025]}>
        <boxGeometry args={[0.79, 0.44, 0.005]} />
        <meshStandardMaterial color="#0d1b2a" emissive="#4f46e5" emissiveIntensity={0.7} roughness={0} />
      </mesh>
      {[0.1, 0.02, -0.06, -0.14].map((y, i) => (
        <mesh key={i} position={[-0.15 + (i % 2) * 0.05, 0.42 + y, 0.032]}>
          <boxGeometry args={[0.3 + (i % 3) * 0.1, 0.018, 0.001]} />
          <meshStandardMaterial emissive={i % 2 === 0 ? '#818cf8' : '#34d399'} emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Office Chair – colourful ─── */
function OfficeChair({ pos, rot = 0, color = '#e07b54' }: { pos: [number, number, number]; rot?: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0.4,  0]} size={[0.55, 0.07, 0.55]} color={color} roughness={0.75} castShadow />
      <Box pos={[0, 0.78, -0.24]} size={[0.53, 0.65, 0.07]} color={color} roughness={0.75} castShadow />
      <Box pos={[ 0.28, 0.56, 0]} size={[0.05, 0.07, 0.4]} color={color} roughness={0.6} castShadow />
      <Box pos={[-0.28, 0.56, 0]} size={[0.05, 0.07, 0.4]} color={color} roughness={0.6} castShadow />
      <Box pos={[0, 0.22, 0]} size={[0.06, 0.38, 0.06]} color="#9ca3af" roughness={0.3} metalness={0.7} castShadow />
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        return <Box key={i} pos={[Math.sin(rad) * 0.23, 0.04, Math.cos(rad) * 0.23]}
          size={[0.08, 0.05, 0.3]} color="#d1d5db" roughness={0.4} metalness={0.4} />
      })}
    </group>
  )
}

/* ─── Desk – warm oak wood ─── */
function Desk({ pos, rot = 0, color = '#c4956a', hasMonitor = true }: {
  pos: [number, number, number]; rot?: number; color?: string; hasMonitor?: boolean
}) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0.75, 0]} size={[1.8, 0.06, 0.9]} color={color} roughness={0.4} castShadow receiveShadow />
      <Box pos={[ 0.82, 0.37,  0.38]} size={[0.06, 0.75, 0.06]} color="#a07850" roughness={0.4} metalness={0.1} castShadow />
      <Box pos={[-0.82, 0.37,  0.38]} size={[0.06, 0.75, 0.06]} color="#a07850" roughness={0.4} metalness={0.1} castShadow />
      <Box pos={[ 0.82, 0.37, -0.38]} size={[0.06, 0.75, 0.06]} color="#a07850" roughness={0.4} metalness={0.1} castShadow />
      <Box pos={[-0.82, 0.37, -0.38]} size={[0.06, 0.75, 0.06]} color="#a07850" roughness={0.4} metalness={0.1} castShadow />
      <Box pos={[0, 0.43, -0.38]} size={[1.6, 0.6, 0.04]} color="#b8855a" roughness={0.6} />
      <Box pos={[0.6, 0.8, 0]} size={[0.3, 0.02, 0.2]} color="#e8ddd0" roughness={0.3} />
      <Box pos={[-0.45, 0.79, 0.1]} size={[0.35, 0.02, 0.25]} color="#f5f0e8" roughness={0.2} metalness={0.1} />
      <mesh position={[0.55, 0.82, 0.15]}>
        <cylinderGeometry args={[0.045, 0.04, 0.1, 16]} />
        <meshStandardMaterial color="#e07b54" roughness={0.5} />
      </mesh>
      {hasMonitor && <Monitor pos={[0, 0.78, -0.2]} rot={Math.PI} />}
    </group>
  )
}

/* ─── Desk Lamp ─── */
function DeskLamp({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.04, 0]} size={[0.12, 0.04, 0.12]} color="#9ca3af" roughness={0.3} metalness={0.6} />
      <Box pos={[0, 0.22, 0]} size={[0.03, 0.36, 0.03]} color="#9ca3af" roughness={0.3} metalness={0.6} />
      <mesh position={[0, 0.42, 0.06]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.1, 0.16, 16, 1, true]} />
        <meshStandardMaterial color="#f5d47a" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.42, 0.06]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial emissive="#fef3c7" emissiveIntensity={3} color="#fef3c7" />
      </mesh>
      <pointLight position={[0, 0.38, 0.1]} intensity={1.2} color="#fef3c7" distance={4} decay={2} />
    </group>
  )
}

/* ─── Meeting Table – walnut ─── */
function MeetingTable({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.76, 0]} size={[4.5, 0.08, 1.8]} color="#8b5e3c" roughness={0.35} castShadow receiveShadow />
      {[[-1.9, 0], [1.9, 0]].map(([x], i) => (
        <Box key={i} pos={[x, 0.38, 0]} size={[0.08, 0.76, 1.6]} color="#7a5230" roughness={0.35} castShadow />
      ))}
      {[-1.5, 0, 1.5].map((x, i) => (
        <group key={i} position={[x, 0.81, 0]}>
          <mesh><cylinderGeometry args={[0.07, 0.07, 0.01, 16]} /><meshStandardMaterial color="#d4a85a" roughness={0.4} /></mesh>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.04, 0.035, 0.1, 16]} /><meshStandardMaterial color="#f5c842" roughness={0.5} /></mesh>
        </group>
      ))}
    </group>
  )
}

/* ─── Plant – vivid green ─── */
function Plant({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.25, 12]} />
        <meshStandardMaterial color="#c2410c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.255, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={1} />
      </mesh>
      <Box pos={[0, 0.55, 0]} size={[0.04, 0.55, 0.04]} color="#15803d" roughness={0.9} castShadow />
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.78, 0.1]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.82, -0.12]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ─── Sofa – warm peach/tan ─── */
function Sofa({ pos, rot = 0, color = '#e8b895' }: { pos: [number, number, number]; rot?: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0.32,    0]} size={[2.2, 0.22, 0.85]} color={color} roughness={0.85} castShadow receiveShadow />
      <Box pos={[0, 0.68,  -0.38]} size={[2.2, 0.5,  0.2]}  color={color} roughness={0.85} castShadow />
      <Box pos={[ 1.05, 0.54, 0]} size={[0.2, 0.4, 0.85]} color="#d4956a" roughness={0.85} castShadow />
      <Box pos={[-1.05, 0.54, 0]} size={[0.2, 0.4, 0.85]} color="#d4956a" roughness={0.85} castShadow />
      {[[-0.95, 0.35], [0.95, 0.35], [-0.95, -0.35], [0.95, -0.35]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.1, z]} size={[0.08, 0.2, 0.08]} color="#9ca3af" roughness={0.5} metalness={0.3} castShadow />
      ))}
      {[-0.7, 0, 0.7].map((x, i) => (
        <Box key={i} pos={[x, 0.47, -0.05]} size={[0.65, 0.12, 0.75]} color="#f0d0b0" roughness={0.9} castShadow />
      ))}
    </group>
  )
}

/* ─── Coffee Table ─── */
function CoffeeTable({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.42, 0]} size={[1.1, 0.06, 0.6]} color="#c4956a" roughness={0.4} metalness={0.1} castShadow receiveShadow />
      {[[-0.45, 0.25], [0.45, 0.25], [-0.45, -0.25], [0.45, -0.25]].map(([x, z], i) => (
        <Box key={i} pos={[x, 0.2, z]} size={[0.05, 0.4, 0.05]} color="#9ca3af" roughness={0.3} metalness={0.6} castShadow />
      ))}
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.01, 16]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.5} />
      </mesh>
    </group>
  )
}

/* ─── Bookshelf ─── */
function Bookshelf({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  const bookColors = ['#e07b54', '#4a90d9', '#22c55e', '#d4a81a', '#e879a8', '#7c3aed', '#0891b2', '#f59e0b']
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0.9, 0]} size={[1.2, 1.8, 0.3]} color="#c4956a" roughness={0.6} castShadow receiveShadow />
      {[0.15, 0.55, 0.95, 1.35].map((y, si) => (
        <Box key={si} pos={[0, y, 0.01]} size={[1.18, 0.04, 0.28]} color="#b8855a" roughness={0.5} />
      ))}
      {[0.15, 0.55, 0.95, 1.35].map((y, si) =>
        [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((x, bi) => (
          <Box key={`${si}-${bi}`}
            pos={[x, y + 0.12, 0.02]}
            size={[0.1 + Math.sin(si * 7 + bi) * 0.02, 0.2 + Math.sin(si + bi * 3) * 0.04, 0.22]}
            color={bookColors[(si * 6 + bi) % bookColors.length]} roughness={0.8} castShadow />
        ))
      )}
    </group>
  )
}

/* ─── Coffee Machine ─── */
function CoffeeMachine({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.2, 0]} size={[0.3, 0.4, 0.25]} color="#e5e7eb" roughness={0.3} metalness={0.3} castShadow />
      <Box pos={[0, 0.38, 0.1]} size={[0.2, 0.06, 0.06]} color="#9ca3af" roughness={0.4} metalness={0.5} />
      <mesh position={[0, 0.32, 0.14]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0.14]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial emissive="#f97316" emissiveIntensity={1.5} color="#f97316" />
      </mesh>
      <Box pos={[0, 0.08, 0.1]} size={[0.15, 0.03, 0.1]} color="#d1d5db" roughness={0.5} />
    </group>
  )
}

/* ─── Whiteboard ─── */
function Whiteboard({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0, 0]} size={[2.8, 1.5, 0.08]} color="#c4956a" roughness={0.4} castShadow />
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[2.65, 1.38, 0.01]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.08} />
      </mesh>
      {[{ x: -0.6, y: 0.25, w: 1.2 }, { x: -0.6, y: 0.1, w: 0.8 }, { x: -0.6, y: -0.05, w: 1.0 }, { x: -0.6, y: -0.2, w: 0.6 }]
        .map(({ x, y, w }, i) => (
          <mesh key={i} position={[x + w / 2 - 0.6, y, 0.052]}>
            <boxGeometry args={[w, 0.018, 0.001]} />
            <meshStandardMaterial emissive={i % 2 === 0 ? '#4f46e5' : '#0891b2'} emissiveIntensity={1} />
          </mesh>
        ))}
      <mesh position={[0.7, 0, 0.052]}>
        <boxGeometry args={[0.5, 0.5, 0.001]} />
        <meshStandardMaterial color="#fef3c7" transparent opacity={0.7} />
      </mesh>
      <Box pos={[0, -0.76, 0.08]} size={[2.7, 0.05, 0.12]} color="#9ca3af" roughness={0.4} />
    </group>
  )
}

/* ─── Reception Desk ─── */
function ReceptionDesk({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0.6, 0]} size={[3, 1.2, 0.8]} color="#c4956a" roughness={0.4} castShadow receiveShadow />
      <Box pos={[0, 1.2, 0.36]} size={[3, 0.06, 0.08]} color="#b8855a" roughness={0.3} castShadow />
      <Monitor pos={[0.6, 1.25, 0]} rot={0} />
      <Box pos={[-0.6, 1.25, 0.1]} size={[0.4, 0.02, 0.28]} color="#f5f0e8" roughness={0.2} metalness={0.1} />
      <mesh position={[-1.0, 1.25, 0.1]}>
        <cylinderGeometry args={[0.05, 0.04, 0.12, 12]} />
        <meshStandardMaterial color="#e07b54" roughness={0.5} />
      </mesh>
    </group>
  )
}

/* ─── Window ─── */
function Window({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0, 0]} size={[2.0, 2.4, 0.1]} color="#d1c9be" roughness={0.4} metalness={0.1} />
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[1.8, 2.2, 0.04]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.25} roughness={0} metalness={0.05} />
      </mesh>
      <Box pos={[0, 0, 0.06]} size={[1.8, 0.06, 0.04]} color="#d1c9be" roughness={0.4} />
      <Box pos={[0, 0, 0.06]} size={[0.06, 2.2, 0.04]} color="#d1c9be" roughness={0.4} />
      <pointLight position={[0, 0, 1]} intensity={0.6} color="#fef9c3" distance={6} decay={2} />
    </group>
  )
}

/* ─── Door ─── */
function Door({ pos, rot = 0, open = false }: { pos: [number, number, number]; rot?: number; open?: boolean }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[-0.55, 1.15, 0]} size={[0.1, 2.5, 0.15]} color="#d1c9be" roughness={0.5} castShadow />
      <Box pos={[ 0.55, 1.15, 0]} size={[0.1, 2.5, 0.15]} color="#d1c9be" roughness={0.5} castShadow />
      <Box pos={[0, 2.45, 0]}     size={[1.2, 0.1,  0.15]} color="#d1c9be" roughness={0.5} castShadow />
      <group rotation={[0, open ? -Math.PI / 3 : 0, 0]}>
        <Box pos={[0, 1.1, open ? 0.4 : 0]} size={[0.96, 2.2, 0.08]} color="#c4956a" roughness={0.5} castShadow />
        <Box pos={[0.3, 1.05, open ? 0.44 : 0.05]} size={[0.04, 0.04, 0.12]} color="#d1d5db" roughness={0.2} metalness={0.8} />
      </group>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[0.96, 0.5, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.35} roughness={0} />
      </mesh>
    </group>
  )
}

/* ─── Wall with windows ─── */
function WallWithWindows({ pos, size, rot = 0, windowPositions = [] }: {
  pos: [number, number, number]; size: [number, number, number]; rot?: number; windowPositions?: number[]
}) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Box pos={[0, 0, 0]} size={size} color="#ede8de" roughness={0.85} castShadow receiveShadow />
      {windowPositions.map((wx, i) => (
        <mesh key={i} position={[wx, 0.5, 0.05]}>
          <boxGeometry args={[1.8, 2.0, 0.15]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.2} roughness={0} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Rug ─── */
function Rug({ pos, size, color }: { pos: [number, number, number]; size: [number, number]; color: string }) {
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

/* ──────────────────────────────────────────────────────── *
 *  MAIN OFFICE ENVIRONMENT                                *
 * ──────────────────────────────────────────────────────── */
export function OfficeEnvironment() {
  return (
    <group>
      {/* ── Single base floor – warm cream, no z-fighting ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f2ede4" roughness={0.85} />
      </mesh>

      {/* ── Zone rugs (raised to y=0.05 to avoid z-fight) ── */}
      <Rug pos={[-13, 0.05, -13]} size={[9, 8]}   color="#f5c4a4" />   {/* CEO – peach */}
      <Rug pos={[-11, 0.05,  9]}  size={[10, 9]}  color="#c4dff5" />   {/* Meeting – soft blue */}
      <Rug pos={[ 13, 0.05, 12]}  size={[11, 10]} color="#c4f0d4" />   {/* Lounge – mint green */}
      <Rug pos={[  0, 0.05, 14]}  size={[ 8,  6]} color="#fde8c4" />   {/* Reception – warm yellow */}

      {/* ── Exterior Walls – warm off-white ── */}
      <WallWithWindows pos={[0, 1.5, -21]} size={[42, 4, 0.4]} windowPositions={[-15, -5, 5, 15]} />
      <WallWithWindows pos={[-21, 1.5, 0]} size={[0.4, 4, 42]} rot={Math.PI / 2} windowPositions={[-12, -4, 4, 12]} />
      <WallWithWindows pos={[21,  1.5, 0]} size={[0.4, 4, 42]} rot={Math.PI / 2} windowPositions={[-12, -4, 4, 12]} />
      <WallWithWindows pos={[0, 1.5,  21]} size={[42, 4, 0.4]} windowPositions={[-10, 0, 10]} />

      {/* ── Interior Partition Walls ── */}
      <Box pos={[-7.5, 1.5, -10.5]} size={[0.2, 3, 5]}  color="#e0d8cc" roughness={0.8} castShadow />
      <Box pos={[-13.5, 1.5, -8]}   size={[7, 3, 0.2]}  color="#e0d8cc" roughness={0.8} castShadow />
      <Box pos={[-5, 1.5, 4]}       size={[0.2, 3, 10]} color="#e0d8cc" roughness={0.7} castShadow />
      <Box pos={[-11, 1.5, 4]}      size={[12, 3, 0.2]} color="#e0d8cc" roughness={0.7} castShadow />
      {/* Glass meeting-room front */}
      <mesh position={[-11, 1.5, 14.5]}>
        <boxGeometry args={[12, 3, 0.1]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.15} roughness={0} />
      </mesh>

      {/* ── Windows ── */}
      <Window pos={[-21, 1.8, -14]} rot={Math.PI / 2} />
      <Window pos={[-21, 1.8,  -4]} rot={Math.PI / 2} />
      <Window pos={[-21, 1.8,   6]} rot={Math.PI / 2} />
      <Window pos={[ 21, 1.8, -14]} rot={-Math.PI / 2} />
      <Window pos={[ 21, 1.8,   0]} rot={-Math.PI / 2} />
      <Window pos={[ 21, 1.8,  12]} rot={-Math.PI / 2} />
      <Window pos={[-10, 1.8, -21]} />
      <Window pos={[  0, 1.8, -21]} />
      <Window pos={[ 10, 1.8, -21]} />

      {/* ── Doors ── */}
      <Door pos={[-7.5, 0, -13.5]} rot={Math.PI / 2} open />
      <Door pos={[-5,   0,   8]}   rot={Math.PI / 2} open />
      <Door pos={[ 4,   0,  21]}   rot={0}           open />

      {/* ── Zone fill lights ── */}
      <pointLight position={[-13, 2.5, -13]} intensity={2.0} color="#fff7ed" distance={12} decay={2} />
      <pointLight position={[  5, 2.5,  -8]} intensity={2.5} color="#f0f9ff" distance={16} decay={2} />
      <pointLight position={[-11, 2.5,   9]} intensity={2.0} color="#f0f9ff" distance={12} decay={2} />
      <pointLight position={[ 13, 2.5,  12]} intensity={2.0} color="#f0fdf4" distance={14} decay={2} />
      <pointLight position={[  0, 2.5,  15]} intensity={1.5} color="#fffbeb" distance={10} decay={2} />

      {/* ── CEO CABIN ── */}
      <Desk pos={[-14, 0, -14]} color="#8b5e3c" />
      <OfficeChair pos={[-14, 0, -12.6]} color="#4a90d9" />
      <Plant pos={[-18, 0, -18]} scale={1.3} />
      <Plant pos={[-9,  0, -18]} scale={1.0} />
      <Bookshelf pos={[-18.5, 0, -11]} rot={Math.PI / 2} />
      <DeskLamp pos={[-13.1, 0.78, -14.2]} />
      <Box pos={[-14, 0.82, -13.4]} size={[0.4, 0.05, 0.1]} color="#f59e0b" roughness={0.3} metalness={0.4} />

      {/* ── WORKSTATIONS ── */}
      {/* Row 1 */}
      <Desk pos={[-3, 0, -14]} color="#c4956a" />
      <OfficeChair pos={[-3, 0, -12.7]} color="#e07b54" />
      <DeskLamp pos={[-2.1, 0.78, -14.2]} />

      <Desk pos={[3, 0, -14]} color="#c4956a" />
      <OfficeChair pos={[3, 0, -12.7]} color="#2da8a8" />
      <DeskLamp pos={[3.9, 0.78, -14.2]} />

      <Desk pos={[10, 0, -14]} color="#c4956a" />
      <OfficeChair pos={[10, 0, -12.7]} color="#7c3aed" />

      <Desk pos={[16, 0, -14]} color="#c4956a" />
      <OfficeChair pos={[16, 0, -12.7]} color="#d4891a" />

      {/* Row 2 */}
      <Desk pos={[-3, 0, -8]} rot={Math.PI} color="#c4956a" />
      <OfficeChair pos={[-3, 0, -9.3]} rot={Math.PI} color="#e879a8" />

      <Desk pos={[3, 0, -8]} rot={Math.PI} color="#c4956a" />
      <OfficeChair pos={[3, 0, -9.3]} rot={Math.PI} color="#22c55e" />

      <Desk pos={[10, 0, -8]} rot={Math.PI} color="#c4956a" />
      <OfficeChair pos={[10, 0, -9.3]} rot={Math.PI} color="#e07b54" />
      <DeskLamp pos={[10.9, 0.78, -7.8]} />

      <Desk pos={[16, 0, -8]} rot={Math.PI} color="#c4956a" />
      <OfficeChair pos={[16, 0, -9.3]} rot={Math.PI} color="#4a90d9" />

      {/* Workstation extras */}
      <Plant pos={[18.5, 0, -18]} scale={1.2} />
      <Plant pos={[-2,   0, -18]} scale={0.9} />
      <Bookshelf pos={[18.5, 0, -11]} rot={-Math.PI / 2} />

      {/* ── MEETING ROOM ── */}
      <MeetingTable pos={[-11, 0, 9]} />
      {[-1.5, 0, 1.5].map((x, i) => (
        <OfficeChair key={`mt-top-${i}`} pos={[-11 + x, 0, 6.5]} rot={Math.PI} color={['#4a90d9','#e07b54','#22c55e'][i]} />
      ))}
      {[-1.5, 0, 1.5].map((x, i) => (
        <OfficeChair key={`mt-bot-${i}`} pos={[-11 + x, 0, 11.5]} rot={0} color={['#7c3aed','#d4891a','#e879a8'][i]} />
      ))}
      <OfficeChair pos={[-14.5, 0, 9]} rot={ Math.PI / 2} color="#2da8a8" />
      <OfficeChair pos={[ -7.5, 0, 9]} rot={-Math.PI / 2} color="#f59e0b" />
      <Whiteboard pos={[-11, 2, 4.5]} />
      <Plant pos={[-16.5, 0, 4.5]} scale={1.1} />
      <Plant pos={[ -5.5, 0, 4.5]} scale={1.0} />
      <Box pos={[-11, 2, 3.8]} size={[3.5, 2, 0.05]} color="#f8f9fa" roughness={0.05} />

      {/* ── LOUNGE ── */}
      <Sofa pos={[10, 0, 10]} rot={ Math.PI / 2} color="#e8b895" />
      <Sofa pos={[16, 0, 10]} rot={-Math.PI / 2} color="#a8d8ea" />
      <CoffeeTable pos={[13, 0, 10]} />
      <CoffeeMachine pos={[19, 0, 17]} />
      {/* Counter */}
      <Box pos={[18, 0.55, 15]} size={[2, 1.1, 0.6]} color="#c4956a" roughness={0.5} castShadow receiveShadow />
      <Box pos={[18, 1.12, 14.8]} size={[2.1, 0.06, 0.7]} color="#b8855a" roughness={0.35} castShadow />
      {/* Bar stools */}
      {[-0.5, 0.5].map((x, i) => (
        <group key={i} position={[18 + x, 0, 14]}>
          <Box pos={[0, 0.45, 0]} size={[0.35, 0.05, 0.35]} color={i === 0 ? '#e07b54' : '#2da8a8'} roughness={0.7} castShadow />
          <Box pos={[0, 0.22, 0]} size={[0.04, 0.44, 0.04]} color="#9ca3af" roughness={0.3} metalness={0.6} castShadow />
          <Box pos={[0, 0.04, 0]} size={[0.3, 0.04, 0.3]} color="#d1d5db" roughness={0.4} castShadow />
        </group>
      ))}
      {/* Mugs on coffee table */}
      {[[-0.25, 0], [0.25, 0]].map(([x, z], i) => (
        <mesh key={i} position={[13 + x, 0.47, 10 + z]}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
          <meshStandardMaterial color={i === 0 ? '#e07b54' : '#22c55e'} roughness={0.6} />
        </mesh>
      ))}
      <Plant pos={[ 6.5, 0, 18.5]} scale={1.4} />
      <Plant pos={[19.5, 0,  9.5]} scale={1.2} />
      <Plant pos={[ 6.5, 0,  9.5]} scale={1.0} />

      {/* ── RECEPTION ── */}
      <ReceptionDesk pos={[0, 0, 14]} />
      <OfficeChair pos={[0, 0, 12.8]} color="#4a90d9" />
      <Plant pos={[ 4.5, 0, 18.5]} scale={1.5} />
      <Plant pos={[-4.5, 0, 18.5]} scale={1.3} />

      {/* ── Corner plants ── */}
      <Plant pos={[-20, 0, -20]} scale={1.5} />
      <Plant pos={[ 20, 0, -20]} scale={1.2} />
      <Plant pos={[-20, 0,  20]} scale={1.3} />
      <Plant pos={[ 20, 0,  20]} scale={1.4} />
    </group>
  )
}
