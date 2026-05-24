import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { createVrmBindPoseClip, retargetMixamoClipToVRM } from '@/lib/mixamo-vrm-retarget'

export { createVrmBindPoseClip } from '@/lib/mixamo-vrm-retarget'

const PLACEHOLDER_TEXTURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const assetLoadingManager = new THREE.LoadingManager()
assetLoadingManager.setURLModifier((url) => {
  if (/\.(png|jpe?g|bmp|tga|tif|webp)$/i.test(url) || url.includes('textures')) {
    return PLACEHOLDER_TEXTURE
  }
  return url
})

function stripEmbeddedMeshes(root: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = []
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      toRemove.push(obj)
    }
  })
  for (const obj of toRemove) {
    obj.removeFromParent()
    obj.geometry?.dispose()
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((mat) => mat?.dispose())
  }
}

function pickSourceClip(clips: THREE.AnimationClip[]): THREE.AnimationClip | null {
  return (
    THREE.AnimationClip.findByName(clips, 'mixamo.com') ??
    clips.find((c) => c.tracks.length > 0) ??
    clips[0] ??
    null
  )
}

async function loadFbxMixamo(
  url: string,
  vrm: VRM,
  clipName: string,
): Promise<THREE.AnimationClip | null> {
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')
  const loader = new FBXLoader(assetLoadingManager)
  const fbx = await loader.loadAsync(url)
  stripEmbeddedMeshes(fbx)

  const sourceClip = pickSourceClip(fbx.animations)
  if (!sourceClip) {
    console.warn('[VRM] FBX 中未找到动画 clip')
    return null
  }

  return retargetMixamoClipToVRM(sourceClip, vrm, fbx, clipName)
}

async function loadGlbMixamo(
  url: string,
  vrm: VRM,
  clipName: string,
): Promise<THREE.AnimationClip | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  const loader = new GLTFLoader(assetLoadingManager)
  const gltf = await loader.loadAsync(url)

  const sourceClip = pickSourceClip(gltf.animations)
  if (!sourceClip) {
    console.warn('[VRM] GLB 中未找到动画 clip')
    return null
  }

  return retargetMixamoClipToVRM(sourceClip, vrm, gltf.scene, clipName)
}

/**
 * 加载 Mixamo 动画（.fbx / .glb），在前端重定向到 VRM normalized 骨骼后再播放。
 */
export async function loadMixamoAnimation(
  url: string,
  vrm: VRM,
  clipName = 'mixamoAnim',
): Promise<THREE.AnimationClip | null> {
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase()

  try {
    const clip =
      ext === 'glb' || ext === 'gltf'
        ? await loadGlbMixamo(url, vrm, clipName)
        : await loadFbxMixamo(url, vrm, clipName)

    if (clip) {
      console.info(
        '[VRM] Mixamo 重定向 clip',
        clipName,
        clip.tracks.length,
        'tracks,',
        clip.duration.toFixed(2),
        's',
      )
    }
    return clip
  } catch (error) {
    console.warn('[VRM] Mixamo 动画加载失败', url, error)
    return null
  }
}

/** @deprecated 使用 loadMixamoAnimation */
export async function loadMixamoWaveAnimation(
  url: string,
  vrm: VRM,
): Promise<THREE.AnimationClip | null> {
  return loadMixamoAnimation(url, vrm, 'mixamoWave')
}
