"use client"

import { useEffect } from "react"

/** 在 Capacitor 原生壳内初始化状态栏、Android 返回键等 */
export function CapacitorInit() {
  useEffect(() => {
    void (async () => {
      const { Capacitor } = await import("@capacitor/core")
      if (!Capacitor.isNativePlatform()) return

      const [{ StatusBar, Style }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/app"),
      ])

      await StatusBar.setStyle({ style: Style.Light })
      if (Capacitor.getPlatform() === "android") {
        await StatusBar.setBackgroundColor({ color: "#fdf8f3" })
      }

      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
          return
        }
        App.exitApp()
      })
    })()
  }, [])

  return null
}
