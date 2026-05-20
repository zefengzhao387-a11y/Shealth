"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  {
    label: "灵息",
    href: "/home",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
      </svg>
    ),
  },
  {
    label: "悦动",
    href: "/workout",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    label: "繁花",
    href: "/community",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M16 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M11 17v.01" />
        <path d="M7 14v.01" />
      </svg>
    ),
  },
  {
    label: "镜心",
    href: "/profile",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomNav({ forceHide = false }: { forceHide?: boolean }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const shouldShowBottomNav = navItems.some((item) => pathname === item.href)

  useEffect(() => {
    if (!user) { setUnread(0); return }
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
      setUnread(count ?? 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  if (forceHide || !shouldShowBottomNav) return null

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="mx-3 mb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] rounded-3xl px-2 py-2.5 bg-card/94 backdrop-blur-xl border border-border/60 shadow-[0_12px_34px_rgba(54,35,67,0.14)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-colors relative min-h-14 ${
                    isActive ? "bg-gradient-to-b from-primary/14 to-secondary/10" : "hover:bg-white/35"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {item.icon(isActive)}
                    </motion.div>
                  </div>
                  <span className={`text-[11px] mt-1.5 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0.5 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-secondary"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
