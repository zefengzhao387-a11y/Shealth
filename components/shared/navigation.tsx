"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import PillNav from "@/components/PillNav/PillNav"
import { useAuth } from "@/contexts/auth-context"
import { getDisplayName } from "@/lib/display-name"

const APP_NAV_ITEMS = [
  { label: "灵息", href: "/home" },
  { label: "悦动", href: "/workout" },
  { label: "繁花", href: "/community" },
  { label: "镜心", href: "/profile" },
] as const

function NavAuthActions() {
  const { user, profile, signOut, openAuthModal } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const displayName = getDisplayName(profile, user?.email?.split("@")[0] ?? "花间用户")

  if (!user) {
    return (
      <motion.button
        className="app-chip min-h-11 px-4 py-2 text-sm text-foreground/90"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openAuthModal}
      >
        登录
      </motion.button>
    )
  }

  return (
    <div className="relative flex-shrink-0 pt-0.5">
      <motion.button
        className="app-chip flex min-h-11 items-center gap-2 px-3 py-1.5"
        onClick={() => setShowUserMenu(!showUserMenu)}
        aria-expanded={showUserMenu}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
          <svg className="h-3.5 w-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
          </svg>
        </div>
        <span className="max-w-[72px] truncate text-sm text-foreground/85 md:max-w-[88px]">{displayName}</span>
      </motion.button>

      <AnimatePresence>
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
            <motion.div
              className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl glass shadow-xl"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
            >
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                onClick={() => setShowUserMenu(false)}
              >
                个人主页
              </Link>
              <button
                className="flex w-full items-center gap-2 border-t border-border/30 px-4 py-3 text-sm text-destructive transition-colors hover:bg-muted/50"
                onClick={() => {
                  signOut()
                  setShowUserMenu(false)
                }}
              >
                退出登录
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navigation() {
  const pathname = usePathname()

  if (pathname === "/") return null

  return (
    <header className="pill-nav-shell pill-nav-shell--app fixed inset-x-0 top-0 z-50 px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.65rem)] md:px-6">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <PillNav
          logo="/icon.svg"
          logoAlt="灵息"
          logoHref="/home"
          items={[...APP_NAV_ITEMS]}
          activeHref={pathname}
          ease="power2.easeOut"
          baseColor="#ffffff"
          pillColor="#2a1824"
          pillTextColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          initialLoadAnimation
          className="app-pill-nav"
        />
        <NavAuthActions />
      </div>
    </header>
  )
}
