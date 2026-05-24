import * as THREE from 'three'
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm'

/** Mixamo → VRM Humanoid 标准骨名（用户字典 + 常见 Mixamo 别名） */
export const mixamoToVrmMap: Record<string, VRMHumanBoneName> = {
  mixamorigHips: 'hips',
  mixamorigSpine: 'spine',
  mixamorigChest: 'chest',
  mixamorigUpperChest: 'upperChest',
  mixamorigNeck: 'neck',
  mixamorigHead: 'head',
  mixamorigLeftShoulder: 'leftShoulder',
  mixamorigLeftUpperArm: 'leftUpperArm',
  mixamorigLeftLowerArm: 'leftLowerArm',
  mixamorigLeftHand: 'leftHand',
  mixamorigRightShoulder: 'rightShoulder',
  mixamorigRightUpperArm: 'rightUpperArm',
  mixamorigRightLowerArm: 'rightLowerArm',
  mixamorigRightHand: 'rightHand',
  mixamorigLeftUpperLeg: 'leftUpperLeg',
  mixamorigLeftLowerLeg: 'leftLowerLeg',
  mixamorigLeftFoot: 'leftFoot',
  mixamorigRightUpperLeg: 'rightUpperLeg',
  mixamorigRightLowerLeg: 'rightLowerLeg',
  mixamorigRightFoot: 'rightFoot',
  // Mixamo 默认导出命名
  mixamorigSpine1: 'chest',
  mixamorigSpine2: 'upperChest',
  mixamorigLeftArm: 'leftUpperArm',
  mixamorigLeftForeArm: 'leftLowerArm',
  mixamorigRightArm: 'rightUpperArm',
  mixamorigRightForeArm: 'rightLowerArm',
  mixamorigLeftUpLeg: 'leftUpperLeg',
  mixamorigLeftLeg: 'leftLowerLeg',
  mixamorigRightUpLeg: 'rightUpperLeg',
  mixamorigRightLeg: 'rightLowerLeg',
  mixamorigLeftToeBase: 'leftToes',
  mixamorigRightToeBase: 'rightToes',
}

/** VRoid J_Bip 导出（Mixamo Without Skin 常见） */
const jBipToVrmMap: Record<string, VRMHumanBoneName> = {
  J_Bip_C_Hips: 'hips',
  J_Bip_C_Spine: 'spine',
  J_Bip_C_Chest: 'chest',
  J_Bip_C_UpperChest: 'upperChest',
  J_Bip_C_Neck: 'neck',
  J_Bip_C_Head: 'head',
  J_Bip_L_Shoulder: 'leftShoulder',
  J_Bip_L_UpperArm: 'leftUpperArm',
  J_Bip_L_LowerArm: 'leftLowerArm',
  J_Bip_L_Hand: 'leftHand',
  J_Bip_R_Shoulder: 'rightShoulder',
  J_Bip_R_UpperArm: 'rightUpperArm',
  J_Bip_R_LowerArm: 'rightLowerArm',
  J_Bip_R_Hand: 'rightHand',
  J_Bip_L_UpperLeg: 'leftUpperLeg',
  J_Bip_L_LowerLeg: 'leftLowerLeg',
  J_Bip_L_Foot: 'leftFoot',
  J_Bip_R_UpperLeg: 'rightUpperLeg',
  J_Bip_R_LowerLeg: 'rightLowerLeg',
  J_Bip_R_Foot: 'rightFoot',
}

const _restQuatInv = new THREE.Quaternion()
const _parentRestQuat = new THREE.Quaternion()
const _trackQuat = new THREE.Quaternion()
const _antiClipOffset = new THREE.Quaternion()

/** 招手防穿模：Mixamo 挥手时左臂略内收，大臂外展约 5° 即可 */
const ANTI_CLIP_BONE_OFFSETS: Partial<Record<VRMHumanBoneName, THREE.Euler>> = {
  leftUpperArm: new THREE.Euler(
    0,
    0,
    THREE.MathUtils.degToRad(5),
  ),
}

function applyAntiClipOffsetToTrackValues(values: number[], vrmBone: VRMHumanBoneName) {
  const euler = ANTI_CLIP_BONE_OFFSETS[vrmBone]
  if (!euler) return

  _antiClipOffset.setFromEuler(euler)
  for (let i = 0; i < values.length; i += 4) {
    _trackQuat.fromArray(values, i)
    _trackQuat.multiply(_antiClipOffset)
    _trackQuat.normalize()
    _trackQuat.toArray(values, i)
  }
}

function parseTrackBinding(trackName: string): { boneKey: string; property: string } | null {
  const dot = trackName.lastIndexOf('.')
  if (dot < 0) return null
  return {
    boneKey: trackName.slice(0, dot),
    property: trackName.slice(dot + 1),
  }
}

export function resolveMixamoBoneName(mixamoBone: string): VRMHumanBoneName | null {
  return mixamoToVrmMap[mixamoBone] ?? jBipToVrmMap[mixamoBone] ?? null
}

/**
 * 将 Mixamo / GLB / FBX clip 重定向为 VRM normalized 骨骼 clip。
 * - 只保留 .quaternion（丢弃全部 position / scale，含 Hips，避免悬空与坍塌）
 * - 轨道名映射到 VRM normalized 节点名
 * - 可选：按 Mixamo rest pose 做四元数坐标系转换
 */
export function retargetMixamoClipToVRM(
  sourceClip: THREE.AnimationClip,
  vrm: VRM,
  skeletonRoot?: THREE.Object3D | null,
  clipName = 'mixamoWave',
): THREE.AnimationClip | null {
  const humanoid = vrm.humanoid
  if (!humanoid) return null

  const metaVersion = vrm.meta?.metaVersion === '0' ? '0' : '1'
  const tracks: THREE.KeyframeTrack[] = []
  const seen = new Set<string>()

  for (const track of sourceClip.tracks) {
    const binding = parseTrackBinding(track.name)
    if (!binding) continue

    const { boneKey, property } = binding

    // 防坍塌：禁止 scale；禁止除 hips 外 position；招手原地动画忽略 hips position
    if (property === 'scale') continue
    if (property === 'position') continue
    if (property !== 'quaternion') continue

    const vrmBone = resolveMixamoBoneName(boneKey)
    if (!vrmBone) continue

    const normalizedNode = humanoid.getNormalizedBoneNode(vrmBone)
    if (!normalizedNode) continue

    const targetName = `${normalizedNode.name}.quaternion`
    if (seen.has(targetName)) continue
    seen.add(targetName)

    const times = track.times.slice()
    const values = Array.from(track.values)

    const mixamoNode = skeletonRoot?.getObjectByName(boneKey) ?? null
    if (mixamoNode && track instanceof THREE.QuaternionKeyframeTrack) {
      mixamoNode.updateWorldMatrix(true, false)
      mixamoNode.getWorldQuaternion(_restQuatInv).invert()
      mixamoNode.parent?.getWorldQuaternion(_parentRestQuat)
      for (let i = 0; i < values.length; i += 4) {
        _trackQuat.fromArray(values, i)
        _trackQuat.premultiply(_parentRestQuat).multiply(_restQuatInv)
        _trackQuat.toArray(values, i)
      }
    }

    if (metaVersion === '0') {
      for (let i = 0; i < values.length; i++) {
        if (i % 2 === 0) values[i] = -values[i]
      }
    }

    // 防穿模：左大臂轻微外展，纠正 Mixamo 挥手内收
    applyAntiClipOffsetToTrackValues(values, vrmBone)

    tracks.push(
      new THREE.QuaternionKeyframeTrack(targetName, times, values),
    )
  }

  if (tracks.length === 0) return null
  return new THREE.AnimationClip(clipName, sourceClip.duration, tracks)
}

/** crossFade 用单帧绑定姿态 */
export function createVrmBindPoseClip(vrm: VRM, clipName = 'vrmBind'): THREE.AnimationClip | null {
  if (!vrm.humanoid) return null

  const tracks: THREE.QuaternionKeyframeTrack[] = []
  const boneNames = Object.values(mixamoToVrmMap)
  const uniqueBones = [...new Set(boneNames)]

  for (const bone of uniqueBones) {
    const node = vrm.humanoid.getNormalizedBoneNode(bone)
    if (!node) continue
    const { x, y, z, w } = node.quaternion
    tracks.push(
      new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, [0], [x, y, z, w]),
    )
  }

  if (tracks.length === 0) return null
  return new THREE.AnimationClip(clipName, 0.001, tracks)
}
