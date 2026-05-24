import {
  VRMLookAtBoneApplier,
  VRMLookAtExpressionApplier,
  type VRMHumanoid,
  type VRMExpressionManager,
} from '@pixiv/three-vrm'

export type LookAtDriveMode = 'bone' | 'expression'

/** VRM 0.x BlendShape ≈ VRM 1.0 expression 型 applier */
export type LookAtApplierLike = {
  type?: string
  applyYawPitch?: (yaw: number, pitch: number) => void
  rangeMapHorizontalInner: { inputMaxValue: number; outputScale: number; map: (v: number) => number }
  rangeMapHorizontalOuter: { inputMaxValue: number; outputScale: number; map: (v: number) => number }
  rangeMapVerticalDown: { inputMaxValue: number; outputScale: number; map: (v: number) => number }
  rangeMapVerticalUp: { inputMaxValue: number; outputScale: number; map: (v: number) => number }
  expressions?: VRMExpressionManager
  humanoid?: VRMHumanoid
}

const LOOKAT_EXPR_NAMES = ['lookLeft', 'lookRight', 'lookUp', 'lookDown'] as const

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export const LOOKAT_TUNING = {
  bone: {
    ndcLimit: 0.35,
    lerpFactor: 0.05,
    restDistance: 1.15,
    maxWorldOffset: 0.55,
  },
  expression: {
    ndcLimit: 0.1,
    lerpFactor: 0.028,
    restDistance: 1.15,
    maxWorldOffset: 0.08,
  },
} as const

export function getLookAtTuning(mode: LookAtDriveMode) {
  return LOOKAT_TUNING[mode]
}

/**
 * three-vrm 的 applier.type 是类静态属性（VRMLookAtBoneApplier.type = 'bone'），
 * 实例上 applier.type 为 undefined，需从 constructor.type / instanceof 推断。
 */
export function resolveLookAtApplierKind(applier: LookAtApplierLike): LookAtDriveMode | 'unknown' {
  if (applier.type === 'bone' || applier.type === 'expression') {
    return applier.type
  }

  const ctor = applier.constructor as { type?: string; name?: string }
  if (ctor.type === 'bone' || ctor.type === 'expression') {
    return ctor.type
  }

  if (applier instanceof VRMLookAtBoneApplier) return 'bone'
  if (applier instanceof VRMLookAtExpressionApplier) return 'expression'

  const name = ctor.name ?? ''
  if (name.includes('BoneApplier')) return 'bone'
  if (name.includes('ExpressionApplier') || name.includes('BlendShape')) return 'expression'

  if (applier.expressions && !applier.humanoid) return 'expression'
  if (applier.humanoid) return 'bone'

  return 'unknown'
}

type SmoothedExpressionOptions = {
  maxYawDeg: number
  maxPitchDeg: number
  smoothFactor: number
  weightScale: number
  weightLerp: number
}

export function createSmoothedBoneLookAtApplier(
  inner: VRMLookAtBoneApplier,
  smoothFactor = 0.14,
) {
  let smoothYaw = 0
  let smoothPitch = 0

  return {
    type: 'bone' as const,
    humanoid: inner.humanoid,
    rangeMapHorizontalInner: inner.rangeMapHorizontalInner,
    rangeMapHorizontalOuter: inner.rangeMapHorizontalOuter,
    rangeMapVerticalDown: inner.rangeMapVerticalDown,
    rangeMapVerticalUp: inner.rangeMapVerticalUp,

    applyYawPitch(yaw: number, pitch: number) {
      smoothYaw += (yaw - smoothYaw) * smoothFactor
      smoothPitch += (pitch - smoothPitch) * smoothFactor
      inner.applyYawPitch(smoothYaw, smoothPitch)
    },
  }
}

export function createSmoothedExpressionLookAtApplier(
  inner: {
    expressions: VRMExpressionManager
    rangeMapHorizontalInner: LookAtApplierLike['rangeMapHorizontalInner']
    rangeMapHorizontalOuter: LookAtApplierLike['rangeMapHorizontalOuter']
    rangeMapVerticalDown: LookAtApplierLike['rangeMapVerticalDown']
    rangeMapVerticalUp: LookAtApplierLike['rangeMapVerticalUp']
  },
  options: SmoothedExpressionOptions,
) {
  let smoothYaw = 0
  let smoothPitch = 0
  const prevWeights: Record<(typeof LOOKAT_EXPR_NAMES)[number], number> = {
    lookLeft: 0,
    lookRight: 0,
    lookUp: 0,
    lookDown: 0,
  }

  return {
    type: 'expression' as const,
    rangeMapHorizontalInner: inner.rangeMapHorizontalInner,
    rangeMapHorizontalOuter: inner.rangeMapHorizontalOuter,
    rangeMapVerticalDown: inner.rangeMapVerticalDown,
    rangeMapVerticalUp: inner.rangeMapVerticalUp,
    expressions: inner.expressions,

    applyYawPitch(yaw: number, pitch: number) {
      const { maxYawDeg, maxPitchDeg, smoothFactor, weightScale, weightLerp } = options
      const clampedYaw = clamp(yaw, -maxYawDeg, maxYawDeg)
      const clampedPitch = clamp(pitch, -maxPitchDeg, maxPitchDeg)

      smoothYaw += (clampedYaw - smoothYaw) * smoothFactor
      smoothPitch += (clampedPitch - smoothPitch) * smoothFactor

      const target: Record<(typeof LOOKAT_EXPR_NAMES)[number], number> = {
        lookLeft: 0,
        lookRight: 0,
        lookUp: 0,
        lookDown: 0,
      }

      if (smoothPitch < 0) {
        target.lookUp = inner.rangeMapVerticalUp.map(-smoothPitch) * weightScale
      } else if (smoothPitch > 0) {
        target.lookDown = inner.rangeMapVerticalDown.map(smoothPitch) * weightScale
      }

      if (smoothYaw < 0) {
        target.lookRight = inner.rangeMapHorizontalOuter.map(-smoothYaw) * weightScale
      } else if (smoothYaw > 0) {
        target.lookLeft = inner.rangeMapHorizontalOuter.map(smoothYaw) * weightScale
      }

      for (const name of LOOKAT_EXPR_NAMES) {
        const prev = prevWeights[name]
        const next = clamp(target[name], 0, 1)
        const blended = prev + (next - prev) * weightLerp
        prevWeights[name] = blended
        try {
          inner.expressions.setValue(name, blended)
        } catch {
          /* 模型缺少 look* preset 时忽略 */
        }
      }
    },
  }
}

export type VrmLookAtHost = {
  lookAt?: {
    applier: LookAtApplierLike
    reset: () => void
  }
  humanoid?: VRMHumanoid
}

export function configureVrmLookAt(vrm: VrmLookAtHost): LookAtDriveMode {
  const lookAt = vrm.lookAt
  if (!lookAt?.applier) {
    console.warn('[VRM LookAt] 模型无 lookAt / applier')
    return 'bone'
  }

  const applier = lookAt.applier
  const applierKind = resolveLookAtApplierKind(applier)
  const ctorName = applier.constructor?.name ?? '(anonymous)'
  const staticType = (applier.constructor as { type?: string }).type

  console.log('[VRM LookAt] 当前模型的目光驱动类型为:', applierKind)
  console.log('[VRM LookAt] applier.constructor.name:', ctorName)
  console.log('[VRM LookAt] applier.constructor.type (静态):', staticType ?? '(无)')
  console.log('[VRM LookAt] applier 详情:', applier)

  const leftEye = vrm.humanoid?.getRawBoneNode('leftEye')
  const rightEye = vrm.humanoid?.getRawBoneNode('rightEye')
  console.log(
    '[VRM LookAt] 眼球骨骼:',
    leftEye && rightEye ? 'leftEye + rightEye 已绑定 ✓' : '缺失（无法骨骼驱动）',
  )

  const isExpressionDrive = applierKind === 'expression'

  if (isExpressionDrive) {
    console.warn(
      '[VRM LookAt] 检测到表情/BlendShape 驱动。眼球为离散预设；将尝试骨骼切换或挂载表情平滑层。',
    )
  }

  if (isExpressionDrive && vrm.humanoid) {
    if (leftEye && rightEye) {
      try {
        lookAt.applier = new VRMLookAtBoneApplier(
          vrm.humanoid,
          applier.rangeMapHorizontalInner,
          applier.rangeMapHorizontalOuter,
          applier.rangeMapVerticalDown,
          applier.rangeMapVerticalUp,
        )
        lookAt.reset()
        console.log('[VRM LookAt] ✓ 已强制切换为 VRMLookAtBoneApplier')
        const boneApplier = lookAt.applier as VRMLookAtBoneApplier
        lookAt.applier = createSmoothedBoneLookAtApplier(boneApplier)
        lookAt.reset()
        console.log('[VRM LookAt] ✓ 骨骼 applier 已加 yaw/pitch 平滑层')
        console.log('[VRM LookAt] 使用 tuning:', getLookAtTuning('bone'))
        return 'bone'
      } catch (error) {
        console.warn('[VRM LookAt] 骨骼驱动切换失败，回退表情平滑模式', error)
      }
    } else {
      console.warn('[VRM LookAt] 无 leftEye/rightEye，无法切换骨骼驱动')
    }

    const expressions = applier.expressions
    if (expressions) {
      lookAt.applier = createSmoothedExpressionLookAtApplier(
        {
          expressions,
          rangeMapHorizontalInner: applier.rangeMapHorizontalInner,
          rangeMapHorizontalOuter: applier.rangeMapHorizontalOuter,
          rangeMapVerticalDown: applier.rangeMapVerticalDown,
          rangeMapVerticalUp: applier.rangeMapVerticalUp,
        },
        {
          maxYawDeg: 9,
          maxPitchDeg: 7,
          smoothFactor: 0.055,
          weightScale: 0.26,
          weightLerp: 0.12,
        },
      )
      lookAt.reset()
      console.log('[VRM LookAt] ✓ 已挂载 SmoothedExpressionLookAtApplier 防御层')
      console.log('[VRM LookAt] 使用 tuning:', getLookAtTuning('expression'))
    }

    return 'expression'
  }

  const isBone =
    applierKind === 'bone' ||
    applier instanceof VRMLookAtBoneApplier ||
    ctorName.includes('BoneApplier')

  if (isBone && applier instanceof VRMLookAtBoneApplier) {
    lookAt.applier = createSmoothedBoneLookAtApplier(applier)
    lookAt.reset()
    console.log('[VRM LookAt] ✓ 原生骨骼驱动 + yaw/pitch 平滑层（VRMLookAtBoneApplier）')
    console.log('[VRM LookAt] 使用 tuning:', getLookAtTuning('bone'))
    return 'bone'
  }

  if (isBone) {
    console.log('[VRM LookAt] ✓ 推断为骨骼驱动（未包装平滑层）')
    console.log('[VRM LookAt] 使用 tuning:', getLookAtTuning('bone'))
    return 'bone'
  }

  console.warn('[VRM LookAt] 无法识别 applier，默认按骨骼 tuning 处理')
  return 'bone'
}
