"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getDisplayName } from "@/lib/display-name"

export function Navigation() {
  const pathname = usePathname()
  const isLanding = pathname === "/"
  const { user, profile, signOut, openAuthModal } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const displayName = getDisplayName(profile, user?.email?.split("@")[0] ?? "花间用户")

  const navItems = isLanding
    ? [
        { label: "功能", href: "#features" },
        { label: "关于", href: "#about" },
        { label: "社区", href: "#community" },
      ]
    : [
        { label: "首页", href: "/home" },
        { label: "悦动", href: "/workout" },
        { label: "繁花", href: "/community" },
        { label: "镜心", href: "/profile" },
      ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 px-3 pb-2 md:px-6 ${
        isLanding
          ? "pt-[calc(env(safe-area-inset-top,0px)+0.15rem)] md:pt-2"
          : "pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] md:py-4"
      }`}
    >
      <div className="max-w-6xl mx-auto hidden md:block">
        {isLanding ? (
          <div className="mx-auto w-fit glass rounded-full px-2 py-1.5 grid grid-cols-3 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="min-h-10 rounded-full text-xs md:text-sm transition-colors inline-flex items-center justify-center px-4 text-muted-foreground hover:text-foreground hover:bg-white/35"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.div
                className="glass px-3 py-1.5 rounded-full flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <span className="font-brand text-lg md:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  她健康
                </span>
                <span className="hidden sm:inline text-sm md:text-base font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Shealth
                </span>
              </motion.div>
            </Link>

            <div className="flex items-center gap-4 md:gap-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`text-sm transition-colors ${
                      pathname === item.href
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* 右侧：未登录显示按钮，已登录显示头像菜单 */}
            {user ? (
              <div className="relative">
                <motion.button
                  className="flex min-h-11 items-center gap-2 glass px-3 py-1.5 rounded-full"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
                    </svg>
                  </div>
                  <span className="text-sm text-foreground/80 max-w-[80px] truncate">
                    {displayName}
                  </span>
                  <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-40 glass rounded-2xl overflow-hidden shadow-xl z-20"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      >
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
                          </svg>
                          个人主页
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-muted/50 transition-colors border-t border-border/30"
                          onClick={() => { signOut(); setShowUserMenu(false) }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                          </svg>
                          退出登录
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                className="glass min-h-11 px-4 py-2 rounded-full text-sm text-foreground/80 hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAuthModal}
              >
                登录
              </motion.button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto md:hidden">
        {!isLanding && (
          <div className="glass-strong rounded-2xl border border-white/50 px-3 py-2 flex items-center justify-between mb-2">
          <Link href="/">
            <motion.div
              className="px-2 py-1 rounded-xl flex items-center gap-1.5"
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-brand text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                她健康
              </span>
              <span className="text-[11px] font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Shealth
              </span>
            </motion.div>
          </Link>

          {user ? (
            <div className="relative">
              <motion.button
                className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/35 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
                  </svg>
                </div>
                <span className="text-xs text-foreground/80 max-w-[52px] truncate">
                  {displayName}
                </span>
                <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-40 glass rounded-2xl overflow-hidden shadow-xl z-20"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted/50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        个人主页
                      </Link>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-muted/50 transition-colors border-t border-border/30"
                        onClick={() => { signOut(); setShowUserMenu(false) }}
                      >
                        退出登录
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            isLanding ? (
              <Link
                href="/home"
                className="min-h-11 px-3 py-1.5 rounded-xl text-xs text-foreground/80 inline-flex items-center justify-center"
              >
                开始体验
              </Link>
            ) : (
              <motion.button
                className="min-h-11 px-3 py-1.5 rounded-xl text-xs text-foreground/80"
                whileTap={{ scale: 0.98 }}
                onClick={openAuthModal}
              >
                登录
              </motion.button>
            )
          )}
          </div>
        )}

        {isLanding && (
          <div className="glass rounded-full px-2 py-1.5 grid grid-cols-3 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`min-h-10 rounded-xl text-xs transition-colors inline-flex items-center justify-center ${
                  pathname === item.href
                    ? "text-primary font-medium bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.nav>
  )
}
