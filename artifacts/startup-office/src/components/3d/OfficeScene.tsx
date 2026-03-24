import { Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { OfficeEnvironment } from './Environment'
import { Agent3D } from './Agent'
import type { Agent } from '@workspace/api-client-react'

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

interface OfficeSceneProps {
  agents: Agent[]
  selectedAgentId: string | null
  onAgentClick: (id: string) => void
}

export function OfficeScene({ agents, selectedAgentId, onAgentClick }: OfficeSceneProps) {
  const fallback = (
    <div className="w-full h-full absolute inset-0 bg-background flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-semibold">3D view unavailable</p>
        <p className="text-sm mt-1">Your browser doesn't support WebGL. Use the sidebar to interact with agents.</p>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full absolute inset-0 bg-background">
      <WebGLErrorBoundary fallback={fallback}>
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
            maxPolarAngle={Math.PI / 2 - 0.1}
            minDistance={10}
            maxDistance={50}
            target={[0, 0, 0]}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  )
}
