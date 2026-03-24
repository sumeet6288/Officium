import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment as DreiEnvironment, ContactShadows } from '@react-three/drei'
import { OfficeEnvironment } from './Environment'
import { Agent3D } from './Agent'
import type { Agent } from '@workspace/api-client-react'

interface OfficeSceneProps {
  agents: Agent[]
  selectedAgentId: string | null
  onAgentClick: (id: string) => void
}

export function OfficeScene({ agents, selectedAgentId, onAgentClick }: OfficeSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 bg-background">
      <Canvas shadows camera={{ position: [25, 25, 25], fov: 40 }}>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 30, 80]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[10, 20, 10]} 
          intensity={1.5} 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        <OfficeEnvironment />
        
        <ContactShadows position={[0, -0.09, 0]} opacity={0.4} scale={50} blur={2} far={4} />

        {agents.map((agent) => (
          <Agent3D 
            key={agent.id} 
            agent={agent} 
            selected={selectedAgentId === agent.id}
            onClick={onAgentClick}
          />
        ))}

        <OrbitControls 
          makeDefault 
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent looking below ground
          minDistance={10}
          maxDistance={50}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
