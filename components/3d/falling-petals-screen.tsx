'use client'

import { useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FallingPetals } from '@/components/3d/falling-petals'

const FRUSTUM_HEIGHT = 14

function ScreenPetalsCamera() {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    const aspect = size.width / Math.max(size.height, 1)
    const halfH = FRUSTUM_HEIGHT / 2
    const halfW = halfH * aspect
    camera.left = -halfW
    camera.right = halfW
    camera.top = halfH
    camera.bottom = -halfH
    camera.near = 0.1
    camera.far = 100
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

function ScreenFallingPetals() {
  const { size } = useThree()
  const aspect = size.width / Math.max(size.height, 1)
  const halfH = FRUSTUM_HEIGHT / 2
  const halfW = halfH * aspect

  const bounds = useMemo(
    () => ({
      x: halfW * 2.4,
      yMin: -halfH * 1.05,
      yTop: halfH * 1.15,
      z: 3,
    }),
    [halfH, halfW],
  )

  const count = useMemo(() => Math.min(96, Math.round(52 + aspect * 18)), [aspect])

  return <FallingPetals variant="screen" bounds={bounds} count={count} />
}

/** 全屏花瓣装饰层：独立 Canvas，不占用数字人加载流程 */
export function FallingPetalsScreen() {
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none" aria-hidden>
      <Canvas
        className="absolute inset-0 bg-transparent pointer-events-none"
        style={{ pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        frameloop="always"
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
        events={undefined}
      >
        <ScreenPetalsCamera />
        <ScreenFallingPetals />
      </Canvas>
    </div>
  )
}
