import * as THREE from 'three'

export type TouchPokeRegion = 'hair' | 'skirt' | 'shoulder'

const HAIR_MESH = /hair|ponytail|twin|twintail|bang|fringe|髪|ahoge|side/i
const SKIRT_MESH = /skirt|dress|cloth|ribbon|tail|裙|摆|cape|coat|bottom|short/i
const SHOULDER_MESH = /shoulder|upperarm|sleeve|clavicle|肩|arm(?!\w*lower)/i

const HAIR_BONE = /hair|ponytail|twin|twintail|bang|髪|ahoge|side/i
const SKIRT_BONE = /skirt|dress|cloth|ribbon|tail|裙|摆|cape|coat/i
const SHOULDER_BONE = /shoulder|upperarm|clavicle|肩|sleeve/i

/** SpringBone 内部 tail 状态（three-vrm 未公开 API，用于施加冲量） */
type SpringBoneJointInternal = {
  bone: THREE.Object3D
  _currentTail: THREE.Vector3
  _prevTail: THREE.Vector3
}

export type SpringBoneManagerLike = {
  joints: Set<SpringBoneJointInternal>
}

const _pokeRay = new THREE.Raycaster()
const _pokeNdc = new THREE.Vector2()
const _impulseDir = new THREE.Vector3()
const _bonePos = new THREE.Vector3()

const POKE_IMPULSE = {
  hair: 0.14,
  skirt: 0.11,
  shoulder: 0.09,
} as const

export function collectVrmRaycastMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.visible && obj.geometry) {
      meshes.push(obj)
    }
  })
  return meshes
}

export function classifyTouchPokeRegion(
  mesh: THREE.Mesh,
  hitPoint: THREE.Vector3,
  metrics: { headY: number; hipsY: number; footY: number },
): TouchPokeRegion {
  const label = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase()

  if (HAIR_MESH.test(label) || hitPoint.y > metrics.headY - 0.12) return 'hair'
  if (SKIRT_MESH.test(label) || hitPoint.y < metrics.hipsY - 0.05) return 'skirt'
  if (SHOULDER_MESH.test(label)) return 'shoulder'

  const mid = (metrics.headY + metrics.hipsY) * 0.5
  if (hitPoint.y > mid) return 'shoulder'
  return 'skirt'
}

function boneLabel(bone: THREE.Object3D) {
  return `${bone.name} ${bone.parent?.name ?? ''}`.toLowerCase()
}

function jointsMatchingRegion(
  manager: SpringBoneManagerLike,
  region: TouchPokeRegion,
): SpringBoneJointInternal[] {
  const pattern =
    region === 'hair' ? HAIR_BONE : region === 'skirt' ? SKIRT_BONE : SHOULDER_BONE

  return [...manager.joints].filter((joint) => pattern.test(boneLabel(joint.bone)))
}

function jointsNearWorldPoint(
  manager: SpringBoneManagerLike,
  point: THREE.Vector3,
  radius: number,
): SpringBoneJointInternal[] {
  return [...manager.joints].filter((joint) => {
    joint.bone.getWorldPosition(_bonePos)
    return _bonePos.distanceTo(point) <= radius
  })
}

/** 给 SpringBone 施加瞬间冲量，利用 tail 速度差产生自然回弹 */
export function applySpringBoneImpulse(
  joint: SpringBoneJointInternal,
  worldDirection: THREE.Vector3,
  strength: number,
) {
  joint._currentTail.addScaledVector(worldDirection, strength)
  joint._prevTail.addScaledVector(worldDirection, -strength * 0.42)
}

export function pokeSpringBonesForRegion(
  manager: SpringBoneManagerLike,
  region: TouchPokeRegion,
  hitPoint: THREE.Vector3,
  camera: THREE.Camera,
) {
  let joints = jointsMatchingRegion(manager, region)
  if (joints.length === 0) {
    const radius = region === 'hair' ? 0.35 : region === 'shoulder' ? 0.28 : 0.4
    joints = jointsNearWorldPoint(manager, hitPoint, radius)
  }

  _impulseDir.copy(hitPoint).sub(camera.position)
  if (_impulseDir.lengthSq() < 1e-8) _impulseDir.set(0, 1, 0.2)
  _impulseDir.normalize()

  if (region === 'hair') {
    _impulseDir.y += 0.45
    _impulseDir.normalize()
  } else if (region === 'skirt') {
    _impulseDir.x += (Math.random() - 0.5) * 0.35
    _impulseDir.normalize()
  }

  const strength = POKE_IMPULSE[region]
  for (const joint of joints) {
    applySpringBoneImpulse(joint, _impulseDir, strength * (0.75 + Math.random() * 0.5))
  }
}

export function raycastVrmTouch(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  meshes: THREE.Mesh[],
): { mesh: THREE.Mesh; point: THREE.Vector3 } | null {
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  _pokeNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1
  _pokeNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1

  _pokeRay.setFromCamera(_pokeNdc, camera)
  const hits = _pokeRay.intersectObjects(meshes, false)
  const hit = hits.find((h) => h.object instanceof THREE.Mesh && h.point)
  if (!hit || !(hit.object instanceof THREE.Mesh)) return null

  return { mesh: hit.object, point: hit.point.clone() }
}

export function touchPokeBubbleText(region: TouchPokeRegion): string {
  switch (region) {
    case 'hair':
      return '哎呀，头发被你弄乱啦（嘟嘴）～快来和灵息一起做拉伸正正形！'
    case 'skirt':
      return '欸——裙摆被你撩起来啦！（脸红）一起做个拉伸，把身形正回来吧～'
    case 'shoulder':
      return '嘿嘿，别闹啦～（躲闪）来，和灵息一起松松肩、拉拉筋！'
  }
}
