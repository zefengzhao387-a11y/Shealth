'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Lanyard from './Lanyard'
import './HomeLanyard.css'

const CAMERA_Z = 68
const CAMERA_FOV = 20

function useTopLeftAnchor(cameraZ, cameraFov) {
  const [scenePosition, setScenePosition] = useState([-0.9, 3.5, 0])

  useEffect(() => {
    const update = () => {
      const halfH = cameraZ * Math.tan((cameraFov * Math.PI) / 360)
      const halfW = halfH * (window.innerWidth / window.innerHeight)
      const x = -halfW + Math.min(2.8, halfW * 0.72)
      const y = halfH - 0.06
      setScenePosition([x, y, 0])
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [cameraZ, cameraFov])

  return scenePosition
}

export default function HomeLanyard({ placement = 'landing' }) {
  const [mounted, setMounted] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const scenePosition = useTopLeftAnchor(CAMERA_Z, CAMERA_FOV)

  useEffect(() => {
    const delay = placement === 'landing' ? 1400 : 200
    const timer = window.setTimeout(() => setMounted(true), delay)
    return () => window.clearTimeout(timer)
  }, [placement])

  const handleContextLost = useCallback(() => {
    window.setTimeout(() => setCanvasKey((key) => key + 1), 300)
  }, [])

  if (!mounted) return null

  return (
    <div
      className={`lanyard-shell lanyard-shell--${placement}`}
      aria-label="互动吊牌"
    >
      <Suspense fallback={null}>
        <Lanyard
          key={canvasKey}
          position={[0, 0, CAMERA_Z]}
          gravity={[0, -40, 0]}
          fov={CAMERA_FOV}
          scenePosition={scenePosition}
          onContextLost={handleContextLost}
        />
      </Suspense>
    </div>
  )
}
