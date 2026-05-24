'use client'

import { useRef, useEffect, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CoachOutfitId } from '@/lib/coach-outfit'
import { getOutfitPreset } from '@/lib/coach-outfit'
import {
  estimateSpeechDuration,
  getVisemeWeights,
  resetVisemeWeights,
  type VisemeKey,
} from '@/lib/coach-speech'
import { loadMixamoWaveAnimation, createVrmBindPoseClip } from '@/lib/load-mixamo-wave-animation'

export type CoachView = 'portrait' | 'circle' | 'full' | 'hero'

export type CoachSpeechCue = {
  text: string
  token: number
  /** TTS 音频时长（毫秒），有则优先于字数估算 */
  durationMs?: number
  /** 与 TTS 播放进度同步（秒） */
  getElapsedSec?: () => number
}

const VISEME_NAMES: VisemeKey[] = ['aa', 'ih', 'ou', 'ee', 'oh']

type CameraFrame = {
  position: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

type IdleRestPose = {
  hipsY: number
  headRotX: number
  headRotY: number
  lUpperArm: THREE.Quaternion
  rUpperArm: THREE.Quaternion
  lLowerArm: THREE.Quaternion
  rLowerArm: THREE.Quaternion
  rHand: THREE.Quaternion
  lShoulderRotZ: number
  rShoulder: THREE.Quaternion
}

const _tmpQuatA = new THREE.Quaternion()
const _tmpQuatB = new THREE.Quaternion()
const _axisX = new THREE.Vector3(1, 0, 0)
const _axisZ = new THREE.Vector3(0, 0, 1)

const DEFAULT_MODEL = '/models/coach.vrm'
/** Mixamo 招手动画（.fbx / .glb，前端重定向到 VRM） */
const DEFAULT_WAVE_ANIM = '/animations/Waving.fbx'
const USE_MIXAMO_WAVE = true

const WELCOME_VOICE_TEXT = '今天锻炼了吗？'
const MAX_DELTA = 1 / 30

type IdleAction = 'none' | 'stretchLeft' | 'stretchRight' | 'wave'

const SKIN_MESH = /face|skin|head|hair|eye|brow|lash|teeth|body/i
const TOP_MESH = /top|shirt|bra|torso|cloth|wear|jacket|hood/i
const BOTTOM_MESH = /bottom|short|pants|leg|skirt/i
const SHOE_MESH = /shoe|foot|sneaker/i

function applyVisemes(
  expressionManager: { setValue: (name: string, weight: number) => void } | undefined,
  weights: Partial<Record<VisemeKey, number>>,
) {
  if (!expressionManager) return
  VISEME_NAMES.forEach((name) => {
    try {
      expressionManager.setValue(name, weights[name] ?? 0)
    } catch {
      /* 模型缺少该 expression 时忽略 */
    }
  })
}

function applyOutfitToScene(root: THREE.Object3D, outfitId: CoachOutfitId) {
  const preset = getOutfitPreset(outfitId)
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return
    const name = `${obj.name} ${obj.parent?.name ?? ''}`.toLowerCase()
    if (SKIN_MESH.test(name) && !TOP_MESH.test(name) && !BOTTOM_MESH.test(name)) return

    let color = preset.topColor
    if (SHOE_MESH.test(name)) color = preset.shoeColor
    else if (BOTTOM_MESH.test(name)) color = preset.bottomColor
    else if (!TOP_MESH.test(name) && !BOTTOM_MESH.test(name) && !SHOE_MESH.test(name)) {
      const box = new THREE.Box3().setFromObject(obj)
      color = box.getCenter(new THREE.Vector3()).y < 0.55 ? preset.bottomColor : preset.topColor
    }

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((mat) => {
      if ('color' in mat) (mat as THREE.MeshStandardMaterial).color.set(color)
    })
  })
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function pickIdleAction(): IdleAction {
  return 'none'
}

function scheduleNextIdleAction(ref: { current: number }) {
  ref.current = performance.now() + 8000 + Math.random() * 4000
}

/** 只用可见 Mesh 算包围盒，避免骨骼/空节点把范围撑爆 */
function computeMeshBounds(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3()
  const tmp = new THREE.Box3()
  root.updateMatrixWorld(true)

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.visible) return
    const geo = child.geometry
    if (!geo) return
    if (!geo.boundingBox) geo.computeBoundingBox()
    if (!geo.boundingBox || geo.boundingBox.isEmpty()) return
    tmp.copy(geo.boundingBox).applyMatrix4(child.matrixWorld)
    box.union(tmp)
  })

  if (box.isEmpty()) box.setFromObject(root)
  return box
}

function normalizeModelScale(root: THREE.Object3D, targetHeight = 1.65) {
  const box = computeMeshBounds(root)
  const size = box.getSize(new THREE.Vector3())
  if (size.y <= 0) return
  root.scale.multiplyScalar(targetHeight / size.y)
}

function placeModelOnGround(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  const box = computeMeshBounds(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.x -= center.x
  root.position.z -= center.z
  root.position.y -= box.min.y
  root.updateMatrixWorld(true)
}

function prepareModel(root: THREE.Object3D, targetHeight = 1.65) {
  normalizeModelScale(root, targetHeight)
  placeModelOnGround(root)
}

type ModelMetrics = {
  footY: number
  hipsY: number
  headY: number
  bodyHeight: number
  shoulderWidth: number
  handSpan: number
}

function collectModelMetrics(root: THREE.Object3D, humanoid?: {
  getNormalizedBoneNode: (n: string) => THREE.Object3D | null
}): ModelMetrics {
  root.updateMatrixWorld(true)
  const box = computeMeshBounds(root)
  const footY = box.min.y
  const headY = box.max.y
  const bodyHeight = Math.max(box.max.y - box.min.y, 0.001)
  const meshWidth = Math.max(box.max.x - box.min.x, 0.001)

  let hipsY = footY + bodyHeight * 0.55
  let shoulderWidth = meshWidth * 0.52
  let handSpan = meshWidth * 0.75

  if (humanoid) {
    const hips = humanoid.getNormalizedBoneNode('hips')
    const lShoulder = humanoid.getNormalizedBoneNode('leftShoulder')
    const rShoulder = humanoid.getNormalizedBoneNode('rightShoulder')
    const lHand = humanoid.getNormalizedBoneNode('leftHand')
    const rHand = humanoid.getNormalizedBoneNode('rightHand')
    const hipsW = new THREE.Vector3()
    const lW = new THREE.Vector3()
    const rW = new THREE.Vector3()
    const lHW = new THREE.Vector3()
    const rHW = new THREE.Vector3()

    if (hips) {
      hips.getWorldPosition(hipsW)
      hipsY = hipsW.y
    }
    if (lShoulder && rShoulder) {
      lShoulder.getWorldPosition(lW)
      rShoulder.getWorldPosition(rW)
      shoulderWidth = Math.max(Math.abs(rW.x - lW.x), shoulderWidth)
    }
    if (lHand && rHand) {
      lHand.getWorldPosition(lHW)
      rHand.getWorldPosition(rHW)
      handSpan = Math.max(Math.abs(rHW.x - lHW.x), handSpan)
    }
  }

  return {
    footY,
    hipsY,
    headY,
    bodyHeight,
    shoulderWidth,
    handSpan,
  }
}

function computeCameraFrame(
  view: CoachView,
  aspect: number,
  metrics: ModelMetrics,
): CameraFrame {
  const torso = Math.max(metrics.headY - metrics.hipsY, 0.001)

  let targetY: number
  let visibleHeight: number
  let visibleWidth: number
  let fov: number
  let padding: number

  switch (view) {
    case 'circle':
      targetY = metrics.headY - torso * 0.1
      visibleHeight = torso * 1.15
      visibleWidth = metrics.shoulderWidth * 1.4
      fov = 28
      padding = 1.04
      break
    case 'full':
      targetY = metrics.footY + metrics.bodyHeight * 0.46
      visibleHeight = metrics.bodyHeight + 0.14
      visibleWidth = Math.max(metrics.handSpan * 1.28, metrics.shoulderWidth * 1.55, 0.68)
      fov = 32
      padding = 1.12
      break
    case 'hero':
      targetY = metrics.footY + metrics.bodyHeight * 0.46
      visibleHeight = metrics.bodyHeight + 0.24
      visibleWidth = Math.max(metrics.handSpan * 1.32, metrics.shoulderWidth * 1.58, 0.72)
      fov = 31
      padding = 1.02
      break
    case 'portrait':
    default:
      targetY = metrics.hipsY + torso * 0.68
      visibleHeight = metrics.bodyHeight * 0.56
      visibleWidth = metrics.shoulderWidth * 1.5
      fov = 30
      padding = 1.05
      break
  }

  const fovRad = (fov * Math.PI) / 180
  const distV = (visibleHeight / 2 / Math.tan(fovRad / 2)) * padding
  const distH = (visibleWidth / 2 / Math.tan(fovRad / 2) / Math.max(aspect, 0.4)) * padding
  const distance = Math.max(distV, distH)

  return {
    position: new THREE.Vector3(0, targetY, distance),
    target: new THREE.Vector3(0, targetY, 0),
    fov,
  }
}

/** VRM T-Pose → 双手自然下垂（略外展 + 前臂微弯向前，正面可见手） */
function applyNaturalStandPose(humanoid: {
  getNormalizedBoneNode: (n: string) => THREE.Object3D | null
  setNormalizedPose: (pose: Record<string, { rotation?: [number, number, number, number] }>) => void
  update: () => void
}) {
  const q = Math.SQRT1_2
  // 手肘略向前弯（负 X 会弯到身体后面，正面只能看见大臂）
  const elbowForward = 0.09
  const elbowQ = Math.sin(elbowForward / 2)
  const elbowW = Math.cos(elbowForward / 2)

  humanoid.setNormalizedPose({
    leftUpperArm: { rotation: [0, 0, -q, q] },
    rightUpperArm: { rotation: [0, 0, q, q] },
    leftLowerArm: { rotation: [elbowQ, 0, 0, elbowW] },
    rightLowerArm: { rotation: [elbowQ, 0, 0, elbowW] },
  })

  const setRot = (bone: string, x: number, y: number, z: number) => {
    const node = humanoid.getNormalizedBoneNode(bone)
    if (!node) return
    node.rotation.set(x, y, z)
  }

  // 大臂略向前倾，配合肩部外展，让手露在身体两侧前方
  const lUpper = humanoid.getNormalizedBoneNode('leftUpperArm')
  const rUpper = humanoid.getNormalizedBoneNode('rightUpperArm')
  if (lUpper) {
    _tmpQuatA.setFromAxisAngle(_axisX, 0.14)
    lUpper.quaternion.multiply(_tmpQuatA)
  }
  if (rUpper) {
    _tmpQuatA.setFromAxisAngle(_axisX, 0.14)
    rUpper.quaternion.multiply(_tmpQuatA)
  }

  setRot('leftShoulder', 0.03, 0, 0.22)
  setRot('rightShoulder', 0.03, 0, -0.22)
  setRot('chest', 0.015, 0, 0)
  setRot('spine', 0.008, 0, 0)
  setRot('head', -0.03, 0, 0)

  humanoid.update()
}

function cloneBoneQuat(
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null },
  bone: string,
): THREE.Quaternion {
  return humanoid.getNormalizedBoneNode(bone)?.quaternion.clone() ?? new THREE.Quaternion()
}

function applyArmPose(
  bone: THREE.Object3D | null,
  rest: THREE.Quaternion,
  zOffset: number,
  xOffset: number,
) {
  if (!bone) return
  bone.quaternion.copy(rest)
  if (zOffset !== 0) {
    _tmpQuatA.setFromAxisAngle(_axisZ, zOffset)
    bone.quaternion.multiply(_tmpQuatA)
  }
  if (xOffset !== 0) {
    _tmpQuatB.setFromAxisAngle(_axisX, xOffset)
    bone.quaternion.multiply(_tmpQuatB)
  }
}

function captureIdleRestPose(humanoid: {
  getNormalizedBoneNode: (n: string) => THREE.Object3D | null
}): IdleRestPose {
  const hips = humanoid.getNormalizedBoneNode('hips')
  const head = humanoid.getNormalizedBoneNode('head')
  const lShoulder = humanoid.getNormalizedBoneNode('leftShoulder')
  const rShoulder = humanoid.getNormalizedBoneNode('rightShoulder')

  return {
    hipsY: hips?.position.y ?? 0,
    headRotX: head?.rotation.x ?? 0,
    headRotY: head?.rotation.y ?? 0,
    lUpperArm: cloneBoneQuat(humanoid, 'leftUpperArm'),
    rUpperArm: cloneBoneQuat(humanoid, 'rightUpperArm'),
    lLowerArm: cloneBoneQuat(humanoid, 'leftLowerArm'),
    rLowerArm: cloneBoneQuat(humanoid, 'rightLowerArm'),
    rHand: cloneBoneQuat(humanoid, 'rightHand'),
    lShoulderRotZ: lShoulder?.rotation.z ?? 0,
    rShoulder: cloneBoneQuat(humanoid, 'rightShoulder'),
  }
}

function stabilizeVrm(vrm: {
  lookAt?: { autoUpdate: boolean; reset: () => void }
  springBoneManager?: { setInitState: () => void; reset: () => void }
}) {
  if (vrm.lookAt) {
    vrm.lookAt.autoUpdate = false
    vrm.lookAt.reset()
  }
  if (vrm.springBoneManager) {
    vrm.springBoneManager.setInitState()
    vrm.springBoneManager.reset()
  }
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * THREE.MathUtils.clamp(t, 0, 1)) - 1) / 2
}

/** 社区 VRM 标准招手模组（归一化骨骼四元数 [x,y,z,w]） */
const VRM_WAVE_MODULE = [
  {
    rightUpperArm: [0, 0, 0.573, 0.819],
    rightLowerArm: [-0.13, -0.42, 0.06, 0.89],
    rightHand: [0, 0, 0, 1],
  },
  {
    rightUpperArm: [0, 0, 0.573, 0.819],
    rightLowerArm: [-0.13, -0.25, 0.06, 0.95],
    rightHand: [0, 0, -0.15, 0.98],
  },
  {
    rightUpperArm: [0, 0, 0.573, 0.819],
    rightLowerArm: [-0.13, -0.55, 0.06, 0.82],
    rightHand: [0, 0, 0.15, 0.98],
  },
] as const

type WaveFrameQuats = {
  upperArm: THREE.Quaternion
  lowerArm: THREE.Quaternion
  hand: THREE.Quaternion
}

const VRM_WAVE_FRAMES: WaveFrameQuats[] = VRM_WAVE_MODULE.map((frame) => ({
  upperArm: new THREE.Quaternion(...frame.rightUpperArm),
  lowerArm: new THREE.Quaternion(...frame.rightLowerArm),
  hand: new THREE.Quaternion(...frame.rightHand),
}))

const WAVE_PLAYER = {
  /** rest → 帧 0（举手到位） */
  upDurationSec: 0.55,
  /** 帧 1 ↔ 帧 2 每个半摆周期时长 */
  swingHalfSec: 0.28,
  /** 来回摆手次数 */
  swingCycles: 3,
  /** 帧 0 → rest */
  downDurationSec: 0.5,
} as const

type WaveStage = 'up' | 'swing' | 'down' | 'done'

type WaveRuntime = {
  stage: WaveStage
  stageProgress: number
  swingElapsedSec: number
}

function createWaveRuntime(): WaveRuntime {
  return { stage: 'up', stageProgress: 0, swingElapsedSec: 0 }
}

function startWaveActionWithCrossFade(
  mixer: THREE.AnimationMixer,
  restClip: THREE.AnimationClip,
  waveClip: THREE.AnimationClip,
  crossFadeSec: number,
  loopCount: number,
  idleActionRef: { current: THREE.AnimationAction | null },
): THREE.AnimationAction {
  if (!idleActionRef.current) {
    const idle = mixer.clipAction(restClip)
    idle.reset()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    idle.play()
    idleActionRef.current = idle
  }

  const waveAction = mixer.clipAction(waveClip)
  waveAction.reset()
  if (loopCount <= 1) {
    waveAction.setLoop(THREE.LoopOnce, 1)
  } else {
    waveAction.setLoop(THREE.LoopRepeat, loopCount)
  }
  waveAction.clampWhenFinished = true
  waveAction.setEffectiveTimeScale(1)
  waveAction.setEffectiveWeight(1)
  waveAction.play()

  idleActionRef.current.crossFadeTo(waveAction, crossFadeSec, false)
  return waveAction
}

function fadeWaveBackToIdle(
  mixer: THREE.AnimationMixer,
  waveAction: THREE.AnimationAction,
  restClip: THREE.AnimationClip,
  crossFadeSec: number,
  idleActionRef: { current: THREE.AnimationAction | null },
) {
  if (!idleActionRef.current) {
    const idle = mixer.clipAction(restClip)
    idle.reset()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    idle.play()
    idleActionRef.current = idle
  }
  waveAction.crossFadeTo(idleActionRef.current, crossFadeSec, false)
}

/** Mixamo 重定向 clip；crossFade 从绑定姿态切入 */
function beginMixamoWaveGreeting(
  vrm: {
    humanoid?: {
      getNormalizedBoneNode: (n: string) => THREE.Object3D | null
      update: () => void
    }
  },
  rest: IdleRestPose,
  mixer: THREE.AnimationMixer,
  waveClip: THREE.AnimationClip,
  restClip: THREE.AnimationClip,
  crossFadeSec: number,
  loopCount: number,
  idleActionRef: { current: THREE.AnimationAction | null },
) {
  if (vrm.humanoid) {
    applyIdleUpperBody(vrm.humanoid, rest)
    vrm.humanoid.update()
  }
  return startWaveActionWithCrossFade(
    mixer,
    restClip,
    waveClip,
    crossFadeSec,
    loopCount,
    idleActionRef,
  )
}

function applyIdleUpperBody(
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null },
  rest: IdleRestPose,
) {
  const lUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')
  const lLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm')
  const lShoulder = humanoid.getNormalizedBoneNode('leftShoulder')
  const rUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  const rLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')
  const rShoulder = humanoid.getNormalizedBoneNode('rightShoulder')
  const rHand = humanoid.getNormalizedBoneNode('rightHand')
  const hips = humanoid.getNormalizedBoneNode('hips')
  const head = humanoid.getNormalizedBoneNode('head')

  if (hips) hips.position.y = rest.hipsY
  if (head) {
    head.rotation.x = rest.headRotX
    head.rotation.y = rest.headRotY
  }
  if (lUpperArm) lUpperArm.quaternion.copy(rest.lUpperArm)
  if (lLowerArm) lLowerArm.quaternion.copy(rest.lLowerArm)
  if (lShoulder) lShoulder.rotation.z = rest.lShoulderRotZ
  if (rUpperArm) rUpperArm.quaternion.copy(rest.rUpperArm)
  if (rLowerArm) rLowerArm.quaternion.copy(rest.rLowerArm)
  if (rShoulder) rShoulder.quaternion.copy(rest.rShoulder)
  if (rHand) rHand.quaternion.copy(rest.rHand)
}

function slerpWaveRightArm(
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null },
  from: WaveFrameQuats,
  to: WaveFrameQuats,
  t: number,
) {
  const blend = THREE.MathUtils.clamp(t, 0, 1)
  const rUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  const rLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')
  const rHand = humanoid.getNormalizedBoneNode('rightHand')

  if (rUpperArm) {
    _tmpQuatA.copy(from.upperArm).slerp(to.upperArm, blend)
    rUpperArm.quaternion.copy(_tmpQuatA)
  }
  if (rLowerArm) {
    _tmpQuatA.copy(from.lowerArm).slerp(to.lowerArm, blend)
    rLowerArm.quaternion.copy(_tmpQuatA)
  }
  if (rHand) {
    _tmpQuatA.copy(from.hand).slerp(to.hand, blend)
    rHand.quaternion.copy(_tmpQuatA)
  }
}

/** rest ↔ 模组帧：t=0 为 rest，t=1 为模组帧 */
function slerpWaveFromRest(
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null },
  rest: IdleRestPose,
  frameIndex: number,
  t: number,
) {
  applyIdleUpperBody(humanoid, rest)
  const frame = VRM_WAVE_FRAMES[frameIndex]
  const blend = THREE.MathUtils.clamp(t, 0, 1)
  const rUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  const rLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')
  const rHand = humanoid.getNormalizedBoneNode('rightHand')

  if (rUpperArm) {
    _tmpQuatA.copy(rest.rUpperArm).slerp(frame.upperArm, blend)
    rUpperArm.quaternion.copy(_tmpQuatA)
  }
  if (rLowerArm) {
    _tmpQuatA.copy(rest.rLowerArm).slerp(frame.lowerArm, blend)
    rLowerArm.quaternion.copy(_tmpQuatA)
  }
  if (rHand) {
    _tmpQuatA.copy(rest.rHand).slerp(frame.hand, blend)
    rHand.quaternion.copy(_tmpQuatA)
  }
}

function applyWaveFrame(
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null },
  rest: IdleRestPose,
  frameIndex: number,
) {
  applyIdleUpperBody(humanoid, rest)
  slerpWaveRightArm(humanoid, VRM_WAVE_FRAMES[frameIndex], VRM_WAVE_FRAMES[frameIndex], 1)
}

/**
 * VRM 招手模组播放器：up(→帧0) → swing(帧1↔2 ×3) → down(帧0→rest)
 */
function tickWaveGreeting(
  runtime: WaveRuntime,
  delta: number,
  humanoid: { getNormalizedBoneNode: (n: string) => THREE.Object3D | null; update: () => void },
  rest: IdleRestPose,
  expressionManager?: { setValue: (n: string, v: number) => void },
): boolean {
  switch (runtime.stage) {
    case 'up': {
      runtime.stageProgress = Math.min(
        1,
        runtime.stageProgress + delta / WAVE_PLAYER.upDurationSec,
      )
      slerpWaveFromRest(humanoid, rest, 0, easeOutCubic(runtime.stageProgress))
      if (runtime.stageProgress >= 1) {
        applyWaveFrame(humanoid, rest, 0)
        runtime.stage = 'swing'
        runtime.swingElapsedSec = 0
      }
      break
    }
    case 'swing': {
      runtime.swingElapsedSec += delta
      const halfSec = WAVE_PLAYER.swingHalfSec
      const totalHalfPeriods = WAVE_PLAYER.swingCycles * 2

      if (runtime.swingElapsedSec >= halfSec * totalHalfPeriods) {
        applyWaveFrame(humanoid, rest, 0)
        runtime.stage = 'down'
        runtime.stageProgress = 0
        break
      }

      const halfIdx = Math.floor(runtime.swingElapsedSec / halfSec)
      const tInHalf = easeInOutSine((runtime.swingElapsedSec % halfSec) / halfSec)
      const fromFrame = halfIdx % 2 === 0 ? 1 : 2
      const toFrame = halfIdx % 2 === 0 ? 2 : 1

      applyIdleUpperBody(humanoid, rest)
      slerpWaveRightArm(humanoid, VRM_WAVE_FRAMES[fromFrame], VRM_WAVE_FRAMES[toFrame], tInHalf)
      break
    }
    case 'down': {
      runtime.stageProgress = Math.min(
        1,
        runtime.stageProgress + delta / WAVE_PLAYER.downDurationSec,
      )
      slerpWaveFromRest(humanoid, rest, 0, 1 - easeInOutSine(runtime.stageProgress))
      if (runtime.stageProgress >= 1) {
        runtime.stage = 'done'
        applyIdleUpperBody(humanoid, rest)
      }
      break
    }
    case 'done':
      applyIdleUpperBody(humanoid, rest)
      expressionManager?.setValue('happy', 0)
      return true
  }

  humanoid.update()
  expressionManager?.setValue('happy', 0.2)
  applyVisemes(expressionManager, resetVisemeWeights())
  return runtime.stage === 'done'
}

/** 入场：Shader 预热 → 400ms 错峰 → crossFade 招手 → 待机 */
const ENTRANCE = {
  staggerDelayMs: 400,
  crossFadeSec: 0.35,
  warmupFrames: 12,
  waveLoadWaitFrames: 60,
  /** 招手循环次数 */
  waveLoopCount: 1,
}

type WaveGreetingPhase = 'playing' | 'fading' | 'done'

type EntrancePhase = 'warmup' | 'greeting' | 'done'

function CameraRig({
  view,
  metricsRef,
  entrancePhaseRef,
}: {
  view: CoachView
  metricsRef: MutableRefObject<ModelMetrics | null>
  entrancePhaseRef: MutableRefObject<EntrancePhase>
}) {
  const { camera, size } = useThree()
  const lookTarget = useRef(new THREE.Vector3())
  const lastView = useRef<CoachView>(view)
  const lastAspect = useRef(0)

  useFrame((_, delta) => {
    const metrics = metricsRef.current
    if (!metrics || !(camera instanceof THREE.PerspectiveCamera)) return

    const aspect = size.width / Math.max(size.height, 1)
    const frame = computeCameraFrame(view, aspect, metrics)
    const entranceActive = entrancePhaseRef.current !== 'done'
    const viewChanged = lastView.current !== view
    const aspectChanged = Math.abs(lastAspect.current - aspect) > 0.02

    if (entranceActive || !lastAspect.current || viewChanged) {
      camera.position.copy(frame.position)
      lookTarget.current.copy(frame.target)
      camera.fov = frame.fov
      camera.near = 0.01
      camera.far = 50
      camera.lookAt(lookTarget.current)
      camera.updateProjectionMatrix()
      lastView.current = view
      lastAspect.current = aspect
      return
    }

    const blend = 1 - Math.exp(-4 * delta)
    camera.position.lerp(frame.position, blend)
    lookTarget.current.lerp(frame.target, blend)
    if (aspectChanged || Math.abs(camera.fov - frame.fov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, frame.fov, blend)
    }

    camera.near = 0.01
    camera.far = 50
    camera.lookAt(lookTarget.current)
    if (aspectChanged || Math.abs(camera.fov - frame.fov) > 0.01) {
      camera.updateProjectionMatrix()
    }
    lastView.current = view
    lastAspect.current = aspect
  })

  return null
}

function VRMScene({
  view,
  modelPath,
  showPlatform,
  outfitId,
  speech,
  onSpeechEnd,
  onSceneReady,
  onEntranceComplete,
  onWelcomeVoice,
  onError,
}: {
  view: CoachView
  modelPath: string
  showPlatform: boolean
  outfitId: CoachOutfitId
  speech: CoachSpeechCue | null
  onSpeechEnd?: () => void
  onSceneReady?: () => void
  onEntranceComplete?: () => void
  onWelcomeVoice?: () => void
  onError?: (msg: string) => void
}) {
  const { gl, scene, camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const entranceRef = useRef<THREE.Group>(null!)
  const vrmRef = useRef<{
    scene: THREE.Object3D
    update: (d: number) => void
    lookAt?: { autoUpdate: boolean; reset: () => void }
    springBoneManager?: { setInitState: () => void; reset: () => void }
    humanoid?: {
      getNormalizedBoneNode: (n: string) => THREE.Object3D | null
      setNormalizedPose: (pose: Record<string, { rotation?: [number, number, number, number] }>) => void
      update: () => void
    }
    expressionManager?: { setValue: (n: string, v: number) => void }
  } | null>(null)
  const idleRestRef = useRef<IdleRestPose | null>(null)
  const restClipRef = useRef<THREE.AnimationClip | null>(null)
  const metricsRef = useRef<ModelMetrics | null>(null)
  const entrancePhaseRef = useRef<EntrancePhase>('warmup')
  const waveRuntimeRef = useRef<WaveRuntime>(createWaveRuntime())
  const waveMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const waveClipRef = useRef<THREE.AnimationClip | null>(null)
  const waveActionRef = useRef<THREE.AnimationAction | null>(null)
  const idleActionRef = useRef<THREE.AnimationAction | null>(null)
  const waveAnimReadyRef = useRef(false)
  const waveUseMixamoRef = useRef(false)
  const waveGreetingPhaseRef = useRef<WaveGreetingPhase>('done')
  const waveFadeStartedAtRef = useRef(0)
  const entranceStaggerReadyRef = useRef(false)
  const entranceWarmupFramesRef = useRef(0)
  const glCompiledRef = useRef(false)
  const entranceCompleteFiredRef = useRef(false)
  const sceneReadyFiredRef = useRef(false)
  const actionRef = useRef<IdleAction>('none')
  const actionProgressRef = useRef(0)
  const nextActionAtRef = useRef(0)
  const speechSessionRef = useRef<{
    text: string
    token: number
    start: number
    duration: number
    getElapsedSec?: () => number
  } | null>(null)
  const speechEndedTokenRef = useRef<number | null>(null)

  const onSceneReadyRef = useRef(onSceneReady)
  const onErrorRef = useRef(onError)
  const onSpeechEndRef = useRef(onSpeechEnd)
  const onEntranceCompleteRef = useRef(onEntranceComplete)
  const onWelcomeVoiceRef = useRef(onWelcomeVoice)
  onSceneReadyRef.current = onSceneReady
  onErrorRef.current = onError
  onSpeechEndRef.current = onSpeechEnd
  onEntranceCompleteRef.current = onEntranceComplete
  onWelcomeVoiceRef.current = onWelcomeVoice

  useEffect(() => {
    let cancelled = false
    let staggerTimer: ReturnType<typeof setTimeout> | null = null
    metricsRef.current = null
    vrmRef.current = null
    idleRestRef.current = null
    restClipRef.current = null
    entrancePhaseRef.current = 'warmup'
    waveRuntimeRef.current = createWaveRuntime()
    waveMixerRef.current = null
    waveClipRef.current = null
    waveActionRef.current = null
    idleActionRef.current = null
    waveAnimReadyRef.current = false
    waveUseMixamoRef.current = false
    waveGreetingPhaseRef.current = 'done'
    waveFadeStartedAtRef.current = 0
    entranceStaggerReadyRef.current = false
    entranceWarmupFramesRef.current = 0
    glCompiledRef.current = false
    entranceCompleteFiredRef.current = false
    sceneReadyFiredRef.current = false
    actionRef.current = 'none'
    actionProgressRef.current = 0
    nextActionAtRef.current = 0

    if (groupRef.current) {
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0])
      }
    }

    void (async () => {
      try {
        const [gltfMod, vrmMod] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('@pixiv/three-vrm'),
        ])
        const { GLTFLoader } = gltfMod
        const { VRMLoaderPlugin, VRMUtils } = vrmMod
        const loader = new GLTFLoader()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loader.register((parser: any) => new VRMLoaderPlugin(parser))

        loader.load(
          modelPath,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (gltf: any) => {
            if (cancelled || !groupRef.current) return
            const vrm = gltf.userData.vrm
            if (!vrm?.scene) {
              onErrorRef.current?.('VRM 解析失败')
              return
            }

            if (VRMUtils.combineSkeletons) {
              VRMUtils.combineSkeletons(vrm.scene)
            } else if (VRMUtils.removeUnnecessaryJoints) {
              VRMUtils.removeUnnecessaryJoints(vrm.scene)
            }

            if (VRMUtils.rotateVRM0) {
              VRMUtils.rotateVRM0(vrm)
            } else {
              vrm.scene.rotation.y = Math.PI
            }

            prepareModel(vrm.scene, 1.65)
            groupRef.current.add(vrm.scene)
            vrm.scene.updateMatrixWorld(true)
            stabilizeVrm(vrm)

            if (vrm.humanoid) {
              applyNaturalStandPose(vrm.humanoid)
              stabilizeVrm(vrm)
              vrm.scene.updateMatrixWorld(true)
              idleRestRef.current = captureIdleRestPose(vrm.humanoid)
              restClipRef.current = createVrmBindPoseClip(vrm)
            }

            waveMixerRef.current = new THREE.AnimationMixer(vrm.scene)
            if (USE_MIXAMO_WAVE) {
              void (async () => {
                try {
                  const clip = await loadMixamoWaveAnimation(DEFAULT_WAVE_ANIM, vrm)
                  if (cancelled) return
                  waveClipRef.current = clip
                  waveAnimReadyRef.current = !!clip
                } catch (error) {
                  console.warn('[VRM] Waving 加载异常，回退四元数模组', error)
                  waveAnimReadyRef.current = false
                }
              })()
            } else {
              waveAnimReadyRef.current = false
            }

            staggerTimer = setTimeout(() => {
              if (cancelled) return
              entranceStaggerReadyRef.current = true
              if (vrmRef.current?.lookAt) {
                vrmRef.current.lookAt.autoUpdate = true
              }
            }, ENTRANCE.staggerDelayMs)

            applyOutfitToScene(vrm.scene, outfitId)
            const metrics = collectModelMetrics(vrm.scene, vrm.humanoid)
            vrmRef.current = vrm
            metricsRef.current = metrics
            entrancePhaseRef.current = 'warmup'
            waveRuntimeRef.current = createWaveRuntime()
            entranceWarmupFramesRef.current = 0
            glCompiledRef.current = false
            entranceCompleteFiredRef.current = false
            scheduleNextIdleAction(nextActionAtRef)
          },
          undefined,
          (err: unknown) => {
            console.error('[VRM] load error:', modelPath, err)
            onErrorRef.current?.('模型加载失败')
          },
        )
      } catch (e) {
        console.error('[VRM] system unavailable:', e)
        onErrorRef.current?.('3D 引擎不可用')
      }
    })()

    return () => {
      cancelled = true
      if (staggerTimer) clearTimeout(staggerTimer)
    }
  }, [modelPath, view])

  useEffect(() => {
    if (!vrmRef.current?.scene) return
    applyOutfitToScene(vrmRef.current.scene, outfitId)
  }, [outfitId])

  useEffect(() => {
    if (!speech?.text) {
      speechSessionRef.current = null
      return
    }
    speechSessionRef.current = {
      text: speech.text,
      token: speech.token,
      start: performance.now(),
      duration: speech.durationMs ?? estimateSpeechDuration(speech.text) * 1000,
      getElapsedSec: speech.getElapsedSec,
    }
    speechEndedTokenRef.current = null
    actionRef.current = 'none'
    actionProgressRef.current = 0
  }, [speech?.token, speech?.text])

  useFrame((_, delta) => {
    const vrm = vrmRef.current
    const rest = idleRestRef.current
    if (!vrm || !rest) return

    const safeDelta = Math.min(Math.max(delta, 0), MAX_DELTA)
    const entrancePhase = entrancePhaseRef.current
    const entranceActive = entrancePhase !== 'done'

    if (entranceActive) {
      if (entrancePhase === 'warmup') {
        if (vrm.humanoid && rest) {
          applyIdleUpperBody(vrm.humanoid, rest)
          vrm.humanoid.update()
        }
        if (!glCompiledRef.current) {
          gl.compile(scene, camera)
          glCompiledRef.current = true
        }
        // 错峰 400ms 内暂不跑 spring / lookAt，减轻进页卡顿
        if (entranceStaggerReadyRef.current) {
          vrm.update(safeDelta)
        }
        entranceWarmupFramesRef.current += 1
        const warmupDone = entranceWarmupFramesRef.current >= ENTRANCE.warmupFrames
        const waveReadyOrTimedOut =
          waveAnimReadyRef.current ||
          entranceWarmupFramesRef.current >= ENTRANCE.warmupFrames + ENTRANCE.waveLoadWaitFrames
        const staggerReady = entranceStaggerReadyRef.current

        if (warmupDone && staggerReady && waveReadyOrTimedOut) {
          if (!sceneReadyFiredRef.current) {
            sceneReadyFiredRef.current = true
            onSceneReadyRef.current?.()
            if (onWelcomeVoiceRef.current) {
              onWelcomeVoiceRef.current()
            } else {
              console.info('[Coach]', WELCOME_VOICE_TEXT)
            }
          }
          entrancePhaseRef.current = 'greeting'
          if (
            waveAnimReadyRef.current &&
            waveMixerRef.current &&
            waveClipRef.current &&
            restClipRef.current
          ) {
            waveUseMixamoRef.current = true
            waveGreetingPhaseRef.current = 'playing'
            waveActionRef.current = beginMixamoWaveGreeting(
              vrm,
              rest,
              waveMixerRef.current,
              waveClipRef.current,
              restClipRef.current,
              ENTRANCE.crossFadeSec,
              ENTRANCE.waveLoopCount,
              idleActionRef,
            )
          } else {
            waveUseMixamoRef.current = false
            waveRuntimeRef.current = createWaveRuntime()
          }
        }
        return
      }

      if (entrancePhase === 'greeting' && vrm.humanoid) {
        let finished = false

        if (waveUseMixamoRef.current && waveMixerRef.current && waveActionRef.current) {
          waveMixerRef.current.update(safeDelta)
          vrm.expressionManager?.setValue('happy', 0.2)
          applyVisemes(vrm.expressionManager, resetVisemeWeights())
          vrm.update(safeDelta)

          const action = waveActionRef.current
          const clip = waveClipRef.current
          const restClip = restClipRef.current
          const greetPhase = waveGreetingPhaseRef.current

          if (greetPhase === 'playing') {
            const loopsDone = action.time > 0 && !action.isRunning()

            if (loopsDone && restClip && waveMixerRef.current) {
              fadeWaveBackToIdle(
                waveMixerRef.current,
                action,
                restClip,
                ENTRANCE.crossFadeSec,
                idleActionRef,
              )
              waveGreetingPhaseRef.current = 'fading'
              waveFadeStartedAtRef.current = performance.now()
            }
          } else if (greetPhase === 'fading') {
            const fadeElapsed = (performance.now() - waveFadeStartedAtRef.current) / 1000
            if (fadeElapsed >= ENTRANCE.crossFadeSec) {
              waveMixerRef.current?.stopAllAction()
              idleActionRef.current = null
              applyIdleUpperBody(vrm.humanoid, rest)
              vrm.humanoid.update()
              waveGreetingPhaseRef.current = 'done'
              finished = true
            }
          }
        } else {
          if (
            waveAnimReadyRef.current &&
            waveMixerRef.current &&
            waveClipRef.current &&
            restClipRef.current
          ) {
            waveUseMixamoRef.current = true
            waveGreetingPhaseRef.current = 'playing'
            waveActionRef.current = beginMixamoWaveGreeting(
              vrm,
              rest,
              waveMixerRef.current,
              waveClipRef.current,
              restClipRef.current,
              ENTRANCE.crossFadeSec,
              ENTRANCE.waveLoopCount,
              idleActionRef,
            )
          } else {
            finished = tickWaveGreeting(
              waveRuntimeRef.current,
              safeDelta,
              vrm.humanoid,
              rest,
              vrm.expressionManager,
            )
            vrm.update(safeDelta)
          }
        }

        const blink = Math.max(0, Math.sin(performance.now() / 1000 * 1.55 + 2.0) * 20 - 19)
        vrm.expressionManager?.setValue('blink', Math.min(1, blink))

        if (finished) {
          entrancePhaseRef.current = 'done'
          if (!entranceCompleteFiredRef.current) {
            entranceCompleteFiredRef.current = true
            onEntranceCompleteRef.current?.()
          }
        }
        return
      }
    }

    const t = performance.now() / 1000
    const h = vrm.humanoid
    const speechSession = speechSessionRef.current
    const speechElapsed = speechSession?.getElapsedSec
      ? speechSession.getElapsedSec()
      : speechSession
        ? (performance.now() - speechSession.start) / 1000
        : 0
    const speechDurationSec = speechSession ? speechSession.duration / 1000 : 0
    const speaking = !!speechSession && speechElapsed < speechDurationSec - 0.05

    if (speechSession && !speaking && speechEndedTokenRef.current !== speechSession.token) {
      speechEndedTokenRef.current = speechSession.token
      speechSessionRef.current = null
      applyVisemes(vrm.expressionManager, resetVisemeWeights())
      onSpeechEndRef.current?.()
    }

    // 随机待机动作（说话时不触发）
    if (
      !speaking &&
      actionRef.current === 'none' &&
      entrancePhaseRef.current === 'done' &&
      performance.now() >= nextActionAtRef.current
    ) {
      actionRef.current = pickIdleAction()
      actionProgressRef.current = 0
    }

    let leftZOff = 0
    let rightZOff = 0
    let leftXOff = 0
    let rightXOff = 0
    let headYOff = 0

    if (speaking) {
      const emphasis = Math.sin(speechElapsed * 3.4) * 0.5 + 0.5
      // 说话时轻微抬手讲解，但不遮挡自然下垂姿态
      rightZOff = -0.03 - emphasis * 0.03
      rightXOff = 0.06 + emphasis * 0.05
      leftXOff = 0.03
      headYOff = Math.sin(speechElapsed * 2.6) * 0.02
    } else if (actionRef.current !== 'none') {
      actionProgressRef.current = Math.min(1, actionProgressRef.current + delta * 0.75)
      const p = actionProgressRef.current
      const peak = p < 0.45 ? p / 0.45 : 1 - (p - 0.45) / 0.55
      const blend = Math.max(0, Math.min(1, peak))

      switch (actionRef.current) {
        case 'stretchLeft':
          leftZOff = 0.18 * blend
          leftXOff = 0.12 * blend
          break
        case 'stretchRight':
          rightZOff = -0.18 * blend
          rightXOff = 0.12 * blend
          break
        case 'wave':
          rightZOff = -0.35 * blend
          rightXOff = 0.28 * blend
          headYOff = 0.03 * blend
          break
      }

      if (actionProgressRef.current >= 1) {
        actionRef.current = 'none'
        scheduleNextIdleAction(nextActionAtRef)
      }
    }

    if (h) {
      const hips = h.getNormalizedBoneNode('hips')
      const head = h.getNormalizedBoneNode('head')
      const lUpperArm = h.getNormalizedBoneNode('leftUpperArm')
      const rUpperArm = h.getNormalizedBoneNode('rightUpperArm')
      const lLowerArm = h.getNormalizedBoneNode('leftLowerArm')
      const rLowerArm = h.getNormalizedBoneNode('rightLowerArm')
      const lShoulder = h.getNormalizedBoneNode('leftShoulder')
      const rShoulder = h.getNormalizedBoneNode('rightShoulder')

      const sway = Math.sin(t * 0.38) * 0.008

      if (hips) {
        hips.position.y = rest.hipsY + Math.sin(t * 0.85) * 0.004
      }
      if (head) {
        head.rotation.y = rest.headRotY + Math.sin(t * 0.22) * 0.05 + headYOff
        head.rotation.x = rest.headRotX + Math.sin(t * 0.31) * 0.015
      }

      applyArmPose(lUpperArm, rest.lUpperArm, sway + leftZOff, leftXOff)
      applyArmPose(rUpperArm, rest.rUpperArm, -sway + rightZOff, rightXOff)

      if (lLowerArm) {
        lLowerArm.quaternion.copy(rest.lLowerArm)
        _tmpQuatA.setFromAxisAngle(_axisX, Math.sin(t * 0.45) * 0.006)
        lLowerArm.quaternion.multiply(_tmpQuatA)
      }
      if (rLowerArm) {
        rLowerArm.quaternion.copy(rest.rLowerArm)
        _tmpQuatA.setFromAxisAngle(_axisX, Math.sin(t * 0.45 + 0.5) * 0.006)
        rLowerArm.quaternion.multiply(_tmpQuatA)
      }

      if (lShoulder) lShoulder.rotation.z = rest.lShoulderRotZ + sway * 0.4
      if (rShoulder) {
        rShoulder.quaternion.copy(rest.rShoulder)
        _tmpQuatA.setFromAxisAngle(_axisZ, -sway * 0.4)
        rShoulder.quaternion.multiply(_tmpQuatA)
      }
    }

    if (speaking && speechSession) {
      applyVisemes(vrm.expressionManager, getVisemeWeights(speechSession.text, speechElapsed))
      vrm.expressionManager?.setValue('happy', 0.12)
    } else {
      applyVisemes(vrm.expressionManager, resetVisemeWeights())
      vrm.expressionManager?.setValue('happy', 0)
    }

    vrm.update(safeDelta)

    const blink = speaking
      ? Math.max(0, Math.sin(t * 2.2 + 1.0) * 18 - 17) * 0.35
      : Math.max(0, Math.sin(t * 1.55 + 2.0) * 20 - 19)
    vrm.expressionManager?.setValue('blink', Math.min(1, blink))
  })

  return (
    <>
      <CameraRig view={view} metricsRef={metricsRef} entrancePhaseRef={entrancePhaseRef} />
      <ambientLight intensity={0.95} color="#fff9f5" />
      <directionalLight position={[1.5, 3.5, 2.5]} intensity={1.55} color="#ffffff" />
      <directionalLight position={[-2, 2, 1.5]} intensity={0.6} color="#FFD0DC" />
      <pointLight position={[0, 1.6, 2.2]} intensity={0.45} color="#E8DCFF" />
      {showPlatform && <CoachPlatform />}
      <group ref={entranceRef}>
        <group ref={groupRef} />
      </group>
    </>
  )
}

function CoachPlatform() {
  return (
    <group>
      <mesh position={[0, -0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 32]} />
        <meshBasicMaterial color="#c995a8" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, -0.022, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.044, 32]} />
        <meshStandardMaterial color="#faf4f7" metalness={0.22} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 32]} />
        <meshStandardMaterial color="#e689ab" transparent opacity={0.28} metalness={0.35} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function DigitalCoachLoading({ label = '加载中...' }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export type DigitalCoachProps = {
  view?: CoachView
  modelPath?: string
  className?: string
  showPlatform?: boolean
  outfitId?: CoachOutfitId
  speech?: CoachSpeechCue | null
  onSpeechEnd?: () => void
  onLoaded?: () => void
  onEntranceComplete?: () => void
  onWelcomeVoice?: () => void
}

export function DigitalCoach({
  view = 'full',
  modelPath = DEFAULT_MODEL,
  className = '',
  showPlatform = true,
  outfitId = 'classic-black',
  speech = null,
  onSpeechEnd,
  onLoaded,
  onEntranceComplete,
  onWelcomeVoice,
}: DigitalCoachProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSceneReady, setIsSceneReady] = useState(false)

  useEffect(() => {
    setIsSceneReady(false)
    setError(null)
  }, [modelPath])

  const handleSceneReady = () => {
    setIsSceneReady(true)
    onLoaded?.()
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground/70">请确认 /models/coach.vrm 可访问</p>
        </div>
      ) : (
        <>
          {!isSceneReady && <DigitalCoachLoading />}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              isSceneReady ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isSceneReady}
          >
            <Canvas
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              dpr={[1, 1.5]}
              frameloop="always"
              resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
              camera={{ position: [0, 1.2, 2.4], fov: 30, near: 0.01, far: 50 }}
              style={{ background: 'transparent', width: '100%', height: '100%', display: 'block' }}
            >
              <VRMScene
                view={view}
                modelPath={modelPath}
                showPlatform={showPlatform}
                outfitId={outfitId}
                speech={speech}
                onSpeechEnd={onSpeechEnd}
                onSceneReady={handleSceneReady}
                onEntranceComplete={onEntranceComplete}
                onWelcomeVoice={onWelcomeVoice}
                onError={setError}
              />
            </Canvas>
          </div>
        </>
      )}
    </div>
  )
}
