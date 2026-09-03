import { supabase } from '@/lib/supabase'

export const COMMUNITY_MEDIA_BUCKET = 'community-media'
export const COMMUNITY_MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

const IMAGE_LIMIT = 6 * 1024 * 1024
const VIDEO_LIMIT = 30 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])

export type CommunityMediaType = 'image' | 'video'

export function validateCommunityMedia(file: File): CommunityMediaType {
  const mediaType = ALLOWED_IMAGE_TYPES.has(file.type)
    ? 'image'
    : ALLOWED_VIDEO_TYPES.has(file.type)
      ? 'video'
      : null

  if (!mediaType) throw new Error('请选择 JPG、PNG、WebP、GIF、MP4 或 WebM 文件')
  const limit = mediaType === 'image' ? IMAGE_LIMIT : VIDEO_LIMIT
  if (file.size > limit) {
    throw new Error(mediaType === 'image' ? '图片不能超过 6MB' : '视频不能超过 30MB')
  }
  return mediaType
}

function extensionFor(file: File) {
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  }
  return byMime[file.type]
}

export async function uploadCommunityMedia(file: File, userId: string, scope: 'posts' | 'comments') {
  const mediaType = validateCommunityMedia(file)
  const objectPath = `${userId}/${scope}/${crypto.randomUUID()}.${extensionFor(file)}`
  const { error } = await supabase.storage
    .from(COMMUNITY_MEDIA_BUCKET)
    .upload(objectPath, file, { cacheControl: '3600', contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(COMMUNITY_MEDIA_BUCKET).getPublicUrl(objectPath)
  return { mediaUrl: data.publicUrl, mediaType, objectPath }
}

export async function removeCommunityMedia(objectPath: string) {
  await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove([objectPath])
}
