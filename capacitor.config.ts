import type { CapacitorConfig } from '@capacitor/cli'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const loadServerUrl = (): string | undefined => {
  if (process.env.CAPACITOR_SERVER_URL?.trim()) {
    return process.env.CAPACITOR_SERVER_URL.trim()
  }
  for (const file of ['.env.capacitor.local', '.env.local']) {
    const path = join(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^CAPACITOR_SERVER_URL=(.+)$/)
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
  return 'https://www.shealth.asia'
}

/**
 * Capacitor 加载线上 Next.js（含 /api 路由），webDir 仅作占位。
 * 默认：https://www.shealth.asia
 * 覆盖：.env.capacitor.local 或环境变量 CAPACITOR_SERVER_URL
 */
const serverUrl = loadServerUrl()
const isHttp = serverUrl?.startsWith('http://')

const config: CapacitorConfig = {
  appId: 'com.shealth.app',
  appName: '她健康',
  webDir: 'www',
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: !!isHttp,
        androidScheme: isHttp ? 'http' : 'https',
      }
    : undefined,
  android: {
    allowMixedContent: !!isHttp,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#fdf8f3',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#fdf8f3',
    },
  },
}

export default config
