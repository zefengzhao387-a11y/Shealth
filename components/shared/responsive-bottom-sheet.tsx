"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"

export type ResponsiveBottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

function SheetCloseButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="touch-target w-10 h-10 rounded-full glass flex items-center justify-center shrink-0"
      aria-label="关闭"
    >
      <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  )
}

/** 移动端 Vaul 底部 Drawer，桌面端保留底部卡片式面板 */
export function ResponsiveBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: ResponsiveBottomSheetProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground>
        <DrawerContent
          className={cn(
            "rounded-t-[1.75rem] border-t border-border/40 bg-card/98 backdrop-blur-xl max-h-[92vh]",
            "pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]",
            className,
          )}
        >
          <DrawerHeader className="text-left px-5 pt-1 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DrawerTitle className="text-base font-medium text-left">{title}</DrawerTitle>
                {description ? (
                  <DrawerDescription className="text-xs text-muted-foreground mt-0.5 text-left">
                    {description}
                  </DrawerDescription>
                ) : null}
              </div>
              <DrawerClose asChild>
                <SheetCloseButton />
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className={cn("px-5 overflow-y-auto overscroll-contain max-h-[calc(92vh-7.5rem)]", contentClassName)}>
            {children}
          </div>
          {footer ? <div className="px-5 pb-3 pt-2 border-t border-border/20">{footer}</div> : null}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              "fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30 max-h-[85vh] overflow-y-auto",
              className,
            )}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">{title}</h3>
                {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
              </div>
              <SheetCloseButton onClick={() => onOpenChange(false)} />
            </div>
            <div className={contentClassName}>{children}</div>
            {footer}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
