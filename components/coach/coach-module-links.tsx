"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { TAP_SPRING } from "@/lib/motion-presets"
import { cn } from "@/lib/utils"

const MODULE_LINKS = [
  {
    label: "悦动",
    hint: "训练",
    href: "/workout",
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
    hint: "社区",
    href: "/community",
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01" />
      </svg>
    ),
  },
  {
    label: "镜心",
    hint: "我的",
    href: "/profile",
    icon: (
      <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const

type CoachModuleLinksProps = {
  className?: string
  variant?: "default" | "compact" | "sidebar"
}

export function CoachModuleLinks({ className, variant = "default" }: CoachModuleLinksProps) {
  const isSidebar = variant === "sidebar"

  return (
    <nav
      className={cn(
        isSidebar
          ? "flex w-[5.5rem] md:w-[6.75rem] flex-col gap-2.5 rounded-2xl border border-white/50 bg-white/40 p-3 md:p-4 shadow-md backdrop-blur-md"
          : "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
      aria-label="灵息之外的功能"
    >
      {isSidebar && (
        <p className="px-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground">更多</p>
      )}
      {MODULE_LINKS.map((item, i) => (
        <Link key={item.href} href={item.href} className="pointer-events-auto">
          <motion.span
            className={cn(
              "transition-colors hover:bg-white/65 hover:text-foreground text-foreground/75",
              isSidebar
                ? "flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 text-xs md:text-sm md:py-4"
                : cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/45 shadow-sm backdrop-blur-md",
                    variant === "compact" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
                  ),
            )}
            initial={{ opacity: 0, x: isSidebar ? -8 : 0, y: isSidebar ? 0 : 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }}
            whileTap={TAP_SPRING}
          >
            <span className="text-primary/85">{item.icon}</span>
            <span className="font-medium leading-none">{item.label}</span>
            {!isSidebar && variant === "default" && (
              <span className="hidden text-muted-foreground/70 sm:inline">{item.hint}</span>
            )}
          </motion.span>
        </Link>
      ))}
    </nav>
  )
}
