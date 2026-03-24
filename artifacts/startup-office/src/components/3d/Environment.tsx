import { Box } from '@react-three/drei'

export function OfficeEnvironment() {
  return (
    <group>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>

      {/* Subtle Grid */}
      <gridHelper args={[60, 60, "#27272a", "#18181b"]} position={[0, -0.09, 0]} />

      {/* CEO Cabin Zone */}
      <Box args={[12, 0.1, 10]} position={[-15, -0.05, -15]} receiveShadow>
        <meshStandardMaterial color="#1e1b4b" roughness={0.4} />
      </Box>
      
      {/* Engineering Workstations */}
      <Box args={[20, 0.1, 15]} position={[5, -0.05, -10]} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </Box>

      {/* Meeting Room */}
      <Box args={[14, 0.1, 12]} position={[-12, -0.05, 10]} receiveShadow>
        <meshStandardMaterial color="#2e1065" roughness={0.3} />
      </Box>

      {/* Cafeteria/Lounge */}
      <Box args={[16, 0.1, 16]} position={[12, -0.05, 12]} receiveShadow>
        <meshStandardMaterial color="#1c1917" roughness={0.7} />
      </Box>

      {/* Decorative Walls (Low walls to keep visibility) */}
      <Box args={[60, 1, 0.5]} position={[0, 0.5, -20]} receiveShadow castShadow>
        <meshStandardMaterial color="#27272a" />
      </Box>
      <Box args={[0.5, 1, 40]} position={[-20, 0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#27272a" />
      </Box>
    </group>
  )
}
