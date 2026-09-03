"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'shealth_location_v1'

type SavedLocation = {
  label: string
  source: 'manual' | 'device'
}

const CITY_COORDINATES = [
  ['北京', 39.9042, 116.4074], ['上海', 31.2304, 121.4737], ['广州', 23.1291, 113.2644],
  ['深圳', 22.5431, 114.0579], ['杭州', 30.2741, 120.1551], ['南京', 32.0603, 118.7969],
  ['苏州', 31.2989, 120.5853], ['成都', 30.5728, 104.0668], ['重庆', 29.4316, 106.9123],
  ['武汉', 30.5928, 114.3055], ['西安', 34.3416, 108.9398], ['长沙', 28.2282, 112.9388],
  ['郑州', 34.7466, 113.6254], ['天津', 39.0842, 117.2010], ['青岛', 36.0671, 120.3826],
  ['厦门', 24.4798, 118.0894], ['福州', 26.0745, 119.2965], ['济南', 36.6512, 117.1201],
  ['合肥', 31.8206, 117.2272], ['昆明', 25.0389, 102.7183], ['南昌', 28.6820, 115.8579],
  ['沈阳', 41.8057, 123.4315], ['大连', 38.9140, 121.6147], ['哈尔滨', 45.8038, 126.5349],
  ['长春', 43.8171, 125.3235], ['石家庄', 38.0428, 114.5149], ['太原', 37.8706, 112.5489],
  ['贵阳', 26.6470, 106.6302], ['南宁', 22.8170, 108.3665], ['海口', 20.0440, 110.1999],
  ['兰州', 36.0611, 103.8343], ['乌鲁木齐', 43.8256, 87.6168], ['呼和浩特', 40.8426, 111.7492],
] as const

function nearestCity(latitude: number, longitude: number) {
  let closest: { name: string; distance: number } | null = null
  for (const [name, cityLatitude, cityLongitude] of CITY_COORDINATES) {
    const latitudeDistance = (latitude - cityLatitude) * 111
    const longitudeDistance = (longitude - cityLongitude) * 111 * Math.cos(latitude * Math.PI / 180)
    const distance = Math.hypot(latitudeDistance, longitudeDistance)
    if (!closest || distance < closest.distance) closest = { name, distance }
  }
  if (!closest) return '当前位置'
  return closest.distance <= 80 ? closest.name : `${closest.name}附近`
}

function LocationGlyph({ active = false }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M12 21s6-5.2 6-11A6 6 0 1 0 6 10c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function LocationPicker() {
  const panelRef = useRef<HTMLDivElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const locationRequestRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [location, setLocation] = useState<SavedLocation | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as SavedLocation | null
      if (saved?.label) setLocation(saved)
    } catch {
      // Ignore malformed legacy data and let the user choose again.
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const saveLocation = (next: SavedLocation) => {
    setLocation(next)
    setManualValue('')
    setMessage('所在地已更新')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.setTimeout(() => setOpen(false), 450)
  }

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const label = manualValue.trim().slice(0, 20)
    if (!label) {
      setMessage('请输入城市或地区')
      return
    }
    saveLocation({ label, source: 'manual' })
  }

  const locateDevice = () => {
    setMessage('')
    if (!navigator.geolocation) {
      setMessage('当前设备不支持定位，请手动填写')
      manualInputRef.current?.focus()
      return
    }
    setLocating(true)
    setMessage('正在请求定位权限，请在浏览器提示中选择“允许”')
    const requestId = ++locationRequestRef.current
    let settled = false

    const finishWithError = (text: string) => {
      if (settled || requestId !== locationRequestRef.current) return
      settled = true
      setLocating(false)
      setMessage(text)
      window.setTimeout(() => manualInputRef.current?.focus(), 50)
    }

    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (settled || requestId !== locationRequestRef.current) return
          settled = true
          saveLocation({ label: nearestCity(coords.latitude, coords.longitude), source: 'device' })
          setLocating(false)
        },
        (error) => {
          finishWithError(error.code === error.PERMISSION_DENIED
            ? '定位权限已关闭，请在浏览器地址栏的权限设置中允许，或手动填写'
            : '没有获取到设备位置，请手动填写城市')
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 },
      )
    }

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(({ state }) => {
          if (state === 'denied') {
            finishWithError('定位权限已关闭，请在浏览器地址栏的权限设置中允许，或手动填写')
            return
          }
          requestPosition()
        })
        .catch(requestPosition)
    } else {
      requestPosition()
    }

    window.setTimeout(() => {
      finishWithError('浏览器没有响应定位请求，请检查定位权限，或手动填写城市')
    }, 9000)
  }

  return (
    <div ref={panelRef} className="relative z-30 flex-shrink-0 pt-0.5">
      <motion.button
        type="button"
        onClick={() => { setOpen((current) => !current); setMessage('') }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="app-chip group flex min-h-11 max-w-32 items-center gap-2 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-card/85 sm:max-w-40"
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-primary"><LocationGlyph active={Boolean(location)} /></span>
        <span className="truncate">{location?.label ?? '设置所在地'}</span>
        <span className="h-1 w-1 rounded-full bg-primary/70 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="设置所在地"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-[1.5rem_1.5rem_1.5rem_0.6rem] border border-white/10 bg-card/95 p-4 shadow-[0_24px_80px_oklch(0.14_0.05_345/0.55)] backdrop-blur-2xl"
          >
            <p className="font-medium text-foreground">你现在在哪里？</p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">用于展示所在地，设备定位只在本机匹配附近城市。</p>

            <button type="button" onClick={locateDevice} disabled={locating} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">
              <LocationGlyph active />
              {locating ? '等待定位权限…' : '使用设备定位'}
            </button>

            <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground/70">
              <span className="h-px flex-1 bg-white/10" /><span>或手动填写</span><span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <label className="sr-only" htmlFor="manual-location">城市或地区</label>
              <input ref={manualInputRef} id="manual-location" value={manualValue} onChange={(event) => setManualValue(event.target.value)} maxLength={20} placeholder="例如：杭州" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-foreground/[0.055] px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60" />
              <button type="submit" className="rounded-xl border border-white/10 px-4 text-sm text-foreground transition-colors hover:bg-foreground/10">保存</button>
            </form>

            {message ? <p className="mt-3 text-xs text-primary" role="status">{message}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
