declare module 'meshline' {
  import type * as THREE from 'three'

  export class MeshLineGeometry extends THREE.BufferGeometry {
    setPoints(points: THREE.Vector3[] | Float32Array | number[]): void
  }

  export class MeshLineMaterial extends THREE.Material {
    constructor(parameters?: Record<string, unknown>)
  }

  export function raycast(
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[],
  ): void
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: Record<string, unknown>
      meshLineMaterial: Record<string, unknown>
    }
  }
}

export {}
