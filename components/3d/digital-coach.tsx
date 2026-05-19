'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// Camera configs per view mode
const VIEW_CONFIGS = {
  // Landing page circle avatar: shows face + upper chest
  circle:   { pos: [0, 0.65, 1.7]  as const, target: [0, 0.65, 0] as const, fov: 28 },
  // Home page hero: shows waist to top of head
  portrait: { pos: [0, 0.42, 2.1]  as const, target: [0, 0.42, 0] as const, fov: 28 },
  // Full-body view
  full:     { pos: [0, 0.05, 3.6]  as const, target: [0, 0.05, 0] as const, fov: 36 },
}

function VRMScene({ view }: { view: keyof typeof VIEW_CONFIGS }) {
  const groupRef = useRef<THREE.Group>(null!)
  const vrmRef   = useRef<any>(null)
  const cfg = VIEW_CONFIGS[view]

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [gltfMod, vrmMod]: [any, any] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('@pixiv/three-vrm'),
        ])
        const { GLTFLoader } = gltfMod
        const { VRMLoaderPlugin, VRMUtils } = vrmMod
        const loader = new GLTFLoader()
        loader.register((p: any) => new VRMLoaderPlugin(p))
        loader.load(
          '/models/coach.vrm',
          (gltf: any) => {
            if (cancelled || !groupRef.current) return
            const vrm = gltf.userData.vrm
            if (!vrm) return
            VRMUtils.removeUnnecessaryJoints(vrm.scene)
            // VRM models face +Z by default; rotate to face the camera (-Z direction)
            vrm.scene.rotation.y = Math.PI
            groupRef.current.add(vrm.scene)
            vrmRef.current = vrm
          },
          undefined,
          (err: any) => console.error('[VRM] load error:', err),
        )
      } catch (e) {
        console.error('[VRM] system unavailable:', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useFrame((_, delta) => {
    const vrm = vrmRef.current
    if (!vrm) return
    vrm.update(delta)

    const t  = performance.now() / 1000
    const h  = vrm.humanoid

    // Breathing (hips bob)
    const hips = h?.getNormalizedBoneNode('hips')
    if (hips) hips.position.y = Math.sin(t * 0.85) * 0.005

    // Spine sway
    const spine = h?.getNormalizedBoneNode('spine')
    if (spine) spine.rotation.z = Math.sin(t * 0.7) * 0.008

    // Head look-around
    const head = h?.getNormalizedBoneNode('head')
    if (head) {
      head.rotation.y = Math.sin(t * 0.22) * 0.12
      head.rotation.x = -0.03 + Math.sin(t * 0.31) * 0.025
    }

    // Arm idle sway
    const lArm = h?.getNormalizedBoneNode('leftUpperArm')
    const rArm = h?.getNormalizedBoneNode('rightUpperArm')
    if (lArm) lArm.rotation.z = Math.sin(t * 0.38) * 0.03
    if (rArm) rArm.rotation.z = -Math.sin(t * 0.38) * 0.03

    // Blinking (occasional)
    const blink = Math.max(0, Math.sin(t * 1.55 + 2.0) * 20 - 19)
    vrm.expressionManager?.setValue('blink', Math.min(1, blink))
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={cfg.pos} fov={cfg.fov} />
      <OrbitControls
        enableZoom={false} enablePan={false} enableRotate={false}
        target={cfg.target}
      />

      {/* Studio lighting */}
      <ambientLight intensity={0.75} color="#fff9f5" />
      {/* Key light — front-left, warm white */}
      <pointLight position={[-2, 3, 3]}   intensity={2.0} color="#ffffff" />
      {/* Fill light — right side, soft pink */}
      <pointLight position={[2.5, 2, 2]}  intensity={0.8} color="#FFD0DC" />
      {/* Rim light — back, cool lavender */}
      <pointLight position={[0, 1, -3]}   intensity={0.6} color="#D8C8FF" />
      {/* Ground bounce */}
      <pointLight position={[0, -2, 1]}   intensity={0.2} color="#FFE8D0" />

      {/* VRM scene root: offset so VRM y=0 (feet) sits at scene y=-0.95 */}
      <group ref={groupRef} position={[0, -0.95, 0]} />
    </>
  )
}

// Pulsing placeholder shown while VRM loads
function LoadingOrb() {
  const meshRef = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.06)
    }
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial color="#FFB6C1" emissive="#FFB6C1" emissiveIntensity={0.4} transparent opacity={0.35} />
    </mesh>
  )
}

export function DigitalCoach({ view = 'portrait' }: { view?: keyof typeof VIEW_CONFIGS }) {
  return (
    <div className="w-full h-full">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <VRMScene view={view} />
      </Canvas>
    </div>
  )
}
