import { Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Sky } from '@react-three/drei'
import { OfficeEnvironment } from './Environment'
import { Agent3D } from './Agent'
import type { Agent } from '@workspace/api-client-react'

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return this.props.fallback
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
    <div className="w-full h-full absolute inset-0 bg-[#09090b]">
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          shadows="soft"
          camera={{ position: [28, 22, 28], fov: 45, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#09090b']} />
          <fog attach="fog" args={['#09090b', 45, 90]} />

          {/* Sky for ambient light tone */}
          <Sky distance={450} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />

          {/* Primary directional (sun) light */}
          <directionalLight
            castShadow
            position={[15, 25, 15]}
            intensity={1.2}
            color="#e0e7ff"
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-camera-near={0.1}
            shadow-camera-far={80}
            shadow-bias={-0.001}
          />

          {/* Soft fill from opposite direction */}
          <directionalLight position={[-10, 12, -10]} intensity={0.4} color="#c7d2fe" />

          {/* Warm ambient */}
          <ambientLight intensity={0.35} color="#1e1b4b" />

          <OfficeEnvironment />

          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.5}
            scale={60}
            blur={2.5}
            far={5}
            color="#000000"
          />

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
            enablePan
            enableZoom
            enableRotate
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 6}
            minDistance={8}
            maxDistance={55}
            target={[0, 0, 0]}
            zoomSpeed={0.8}
            panSpeed={0.8}
            rotateSpeed={0.5}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  )
}
