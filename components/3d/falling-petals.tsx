'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PETAL_COUNT = 48
const PETAL_TEXTURE_URL = '/textures/petal.png'

const PETAL_PRESETS = {
  coach: {
    count: 48,
    bounds: { x: 8.5, yMin: -0.2, yTop: 4.6, z: 7 },
    plane: [0.16, 0.23] as const,
    fallSpeed: 0.2,
  },
  screen: {
    count: 72,
    bounds: { x: 18, yMin: -8, yTop: 8, z: 3 },
    plane: [0.22, 0.32] as const,
    fallSpeed: 0.28,
  },
} as const

export type FallingPetalsVariant = keyof typeof PETAL_PRESETS

function textureFromPetalImage(image: HTMLImageElement): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  ctx.drawImage(image, 0, 0)
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3
    if (brightness > 232 && r > g - 8 && g > b - 12) {
      data[i + 3] = 0
    } else if (brightness > 210) {
      data[i + 3] = Math.min(data[i + 3], Math.floor((240 - brightness) * 12))
    } else {
      data[i] = Math.floor(r * 0.78)
      data[i + 1] = Math.floor(g * 0.72)
      data[i + 2] = Math.floor(b * 0.74)
    }
  }

  ctx.putImageData(new ImageData(data, width, height), 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

type PetalState = {
  baseX: Float32Array
  baseY: Float32Array
  baseZ: Float32Array
  rotZ: Float32Array
  spin: Float32Array
  scale: Float32Array
}

function spawnPetal(
  i: number,
  state: PetalState,
  bounds: (typeof PETAL_PRESETS)[FallingPetalsVariant]['bounds'],
) {
  state.baseX[i] = (Math.random() - 0.5) * bounds.x
  state.baseY[i] = bounds.yMin + Math.random() * (bounds.yTop - bounds.yMin)
  state.baseZ[i] = (Math.random() - 0.5) * bounds.z
  state.rotZ[i] = Math.random() * Math.PI * 2
  state.spin[i] = (Math.random() - 0.5) * 1.2
  state.scale[i] = 0.7 + Math.random() * 0.65
}

function initPetalState(count: number, bounds: (typeof PETAL_PRESETS)[FallingPetalsVariant]['bounds']): PetalState {
  const state: PetalState = {
    baseX: new Float32Array(count),
    baseY: new Float32Array(count),
    baseZ: new Float32Array(count),
    rotZ: new Float32Array(count),
    spin: new Float32Array(count),
    scale: new Float32Array(count),
  }
  for (let i = 0; i < count; i++) spawnPetal(i, state, bounds)
  return state
}

/**
 * 独立装饰层：异步加载贴图，不阻塞 VRM 模型加载（不用 useLoader / Suspense）
 */
export function FallingPetals({
  variant = 'coach',
  bounds: boundsOverride,
  count: countOverride,
}: {
  variant?: FallingPetalsVariant
  bounds?: (typeof PETAL_PRESETS)[FallingPetalsVariant]['bounds']
  count?: number
}) {
  const preset = PETAL_PRESETS[variant]
  const bounds = boundsOverride ?? preset.bounds
  const count = countOverride ?? preset.count
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const petalState = useMemo(() => initPetalState(count, bounds), [count, bounds])
  const stateRef = useRef(petalState)
  stateRef.current = petalState
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()

    loader.load(
      PETAL_TEXTURE_URL,
      (loaded) => {
        if (cancelled) {
          loaded.dispose()
          return
        }
        setTexture(textureFromPetalImage(loaded.image as HTMLImageElement))
        loaded.dispose()
      },
      undefined,
      () => {
        if (!cancelled) console.warn('[FallingPetals] 贴图加载失败，跳过花瓣层')
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(preset.plane[0], preset.plane[1]),
    [preset.plane],
  )

  const material = useMemo(() => {
    if (!texture) return null
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: new THREE.Color('#C96B7A'),
    })
  }, [texture])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material?.dispose()
      texture?.dispose()
    }
  }, [geometry, material, texture])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    const petals = stateRef.current
    const elapsed = state.clock.getElapsedTime()
    const { yMin, yTop } = bounds

    for (let i = 0; i < count; i++) {
      petals.baseY[i] -= delta * preset.fallSpeed
      petals.rotZ[i] += petals.spin[i] * delta

      if (petals.baseY[i] < yMin) {
        spawnPetal(i, petals, bounds)
        petals.baseY[i] = yTop + Math.random() * 0.6
      }

      const breeze = Math.sin(elapsed * 0.5 + i) * 0.022
      const s = petals.scale[i]

      dummy.position.set(
        petals.baseX[i] + breeze,
        petals.baseY[i],
        petals.baseZ[i] + breeze * 0.6,
      )
      dummy.rotation.z = petals.rotZ[i]
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  if (!material) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={0}
    />
  )
}
