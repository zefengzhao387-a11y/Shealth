"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type CallMode = 'voice' | 'video'
type CallStatus = 'idle' | 'connecting' | 'connected' | 'error'

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M7.2 3.5 10 8 8.2 9.8c1.3 2.6 3.4 4.7 6 6L16 14l4.5 2.8-.8 3c-.2.8-.9 1.3-1.7 1.2C10.2 20.1 3.9 13.8 3 6c-.1-.8.4-1.5 1.2-1.7l3-.8Z" /></svg>
}

function VideoIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></svg>
}

function MicIcon({ off = false }: { off?: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />{off ? <path d="M4 4l16 16" /> : null}</svg>
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

export function CompanionCallDock({ companionName }: { companionName: string }) {
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<CallMode | null>(null)
  const [status, setStatus] = useState<CallStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState('')

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const endCall = () => {
    stopStream()
    setMode(null)
    setStatus('idle')
    setSeconds(0)
    setMuted(false)
    setCameraOff(false)
    setError('')
  }

  useEffect(() => () => stopStream(), [])

  useEffect(() => {
    if (status !== 'connected') return
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (mode !== 'video' || status !== 'connected' || !videoRef.current || !streamRef.current) return
    videoRef.current.srcObject = streamRef.current
    void videoRef.current.play().catch(() => undefined)
  }, [mode, status])

  const startCall = async (nextMode: CallMode) => {
    stopStream()
    setMode(nextMode)
    setStatus('connecting')
    setSeconds(0)
    setError('')
    setMuted(false)
    setCameraOff(false)

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('当前浏览器不支持媒体通话，请换用 Chrome、Edge 或手机浏览器')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: nextMode === 'video' ? { facingMode: 'user' } : false,
      })
      streamRef.current = stream
      setStatus('connected')
    } catch (mediaError) {
      const denied = mediaError instanceof DOMException && (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError')
      setStatus('error')
      setError(denied
        ? `请允许${nextMode === 'video' ? '摄像头和麦克风' : '麦克风'}权限后重试`
        : '没有连接到媒体设备，请检查设备是否被其他应用占用')
    }
  }

  const toggleMuted = () => {
    const next = !muted
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next })
    setMuted(next)
  }

  const toggleCamera = () => {
    const next = !cameraOff
    streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next })
    setCameraOff(next)
  }

  return (
    <>
      <aside aria-label={`联系${companionName}`} className="fixed left-3 top-[calc(env(safe-area-inset-top,0px)+4.8rem)] z-30 flex gap-2 md:left-[clamp(1.5rem,5vw,5.5rem)] md:top-[34%] md:-translate-y-1/2 md:flex-col">
        <p className="hidden pl-1 text-[10px] tracking-[0.2em] text-muted-foreground/70 md:block">和{companionName}通话</p>
        <motion.button type="button" onClick={() => void startCall('voice')} className="app-chip group flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs text-foreground/85 transition-colors hover:text-foreground" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><PhoneIcon /></span>
          <span>语音通话</span>
        </motion.button>
        <motion.button type="button" onClick={() => void startCall('video')} className="app-chip group flex min-h-11 items-center gap-2 px-3.5 py-2 text-xs text-foreground/85 transition-colors hover:text-foreground" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20 text-foreground transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground"><VideoIcon /></span>
          <span>视频通话</span>
        </motion.button>
      </aside>

      <AnimatePresence>
        {mode ? (
          <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`与${companionName}${mode === 'video' ? '视频' : '语音'}通话`}>
            <motion.section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-card/95 shadow-[0_36px_120px_oklch(0.12_0.05_345/0.7)]" initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
              <div className={`relative flex min-h-[25rem] flex-col items-center justify-center overflow-hidden p-7 ${mode === 'video' ? 'bg-background/40' : 'bg-[radial-gradient(circle_at_50%_38%,oklch(0.64_0.08_352/0.24),transparent_46%)]'}`}>
                {mode === 'video' && status === 'connected' && !cameraOff ? <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-35" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/35 to-transparent" aria-hidden />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative">
                    {status === 'connecting' ? <motion.span className="absolute -inset-3 rounded-full border border-primary/50" animate={{ scale: [1, 1.28], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} /> : null}
                    <div className="flex h-24 w-24 items-center justify-center rounded-[2.2rem] bg-gradient-to-br from-primary to-secondary text-4xl font-serif text-primary-foreground shadow-[0_18px_60px_oklch(0.55_0.09_352/0.35)]">{companionName.slice(0, 1)}</div>
                  </div>
                  <h2 className="mt-5 font-serif text-2xl text-foreground">{companionName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {status === 'connecting' ? `正在连接${mode === 'video' ? '摄像头与麦克风' : '麦克风'}…` : null}
                    {status === 'connected' ? `${mode === 'video' ? '视频' : '语音'}通话 · ${formatDuration(seconds)}` : null}
                    {status === 'error' ? '通话没有接通' : null}
                  </p>
                  {status === 'connected' ? <p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground/70">媒体只在当前设备打开；实时 AI 语音对话服务接入后即可双向交流。</p> : null}
                  {error ? <p className="mt-4 max-w-xs rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive" role="alert">{error}</p> : null}
                  {status === 'error' ? <button type="button" onClick={() => void startCall(mode)} className="mt-4 text-sm text-primary underline-offset-4 hover:underline">重新连接</button> : null}
                </div>

                <div className="relative z-10 mt-8 flex items-center gap-4">
                  <button type="button" onClick={toggleMuted} disabled={status !== 'connected'} aria-label={muted ? '打开麦克风' : '静音'} className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 transition-colors disabled:opacity-35 ${muted ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground'}`}><MicIcon off={muted} /></button>
                  {mode === 'video' ? <button type="button" onClick={toggleCamera} disabled={status !== 'connected'} aria-label={cameraOff ? '打开摄像头' : '关闭摄像头'} className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 transition-colors disabled:opacity-35 ${cameraOff ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground'}`}><VideoIcon /></button> : null}
                  <button type="button" onClick={endCall} aria-label="挂断" className="flex h-14 w-14 rotate-[135deg] items-center justify-center rounded-full bg-destructive text-white shadow-lg shadow-destructive/25 transition-transform hover:scale-105 active:scale-95"><PhoneIcon /></button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
