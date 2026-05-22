/** 教练换装预设 — UI 与 VRM 材质染色共享 */

export type CoachOutfitId = 'classic-black' | 'peach-sport' | 'lilac-set' | 'sage-active'

export type CoachOutfitPreset = {
  id: CoachOutfitId
  label: string
  desc: string
  topColor: string
  bottomColor: string
  shoeColor: string
  preview: string
}

export const COACH_OUTFITS: CoachOutfitPreset[] = [
  {
    id: 'classic-black',
    label: '经典运动黑',
    desc: '默认训练服',
    topColor: '#1a1a1a',
    bottomColor: '#1a1a1a',
    shoeColor: '#2a2a2a',
    preview: 'linear-gradient(160deg,#333 50%,#111 50%)',
  },
  {
    id: 'peach-sport',
    label: '蜜桃粉',
    desc: '温柔活力',
    topColor: '#e689ab',
    bottomColor: '#3d3d3d',
    shoeColor: '#ffffff',
    preview: 'linear-gradient(160deg,#f0a0bc 50%,#444 50%)',
  },
  {
    id: 'lilac-set',
    label: '丁香紫',
    desc: '轻盈舒缓',
    topColor: '#9b87c4',
    bottomColor: '#2f2f35',
    shoeColor: '#eae6f5',
    preview: 'linear-gradient(160deg,#b8a8d8 50%,#3a3a42 50%)',
  },
  {
    id: 'sage-active',
    label: '鼠尾草绿',
    desc: '自然清新',
    topColor: '#7cb68a',
    bottomColor: '#1f2a22',
    shoeColor: '#f5f5f0',
    preview: 'linear-gradient(160deg,#8ec99a 50%,#243028 50%)',
  },
]

export const DEFAULT_OUTFIT_ID: CoachOutfitId = 'classic-black'

export function getOutfitPreset(id: CoachOutfitId): CoachOutfitPreset {
  return COACH_OUTFITS.find((o) => o.id === id) ?? COACH_OUTFITS[0]
}
