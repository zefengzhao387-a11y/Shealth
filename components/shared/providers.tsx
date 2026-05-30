"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { PointsProvider } from "@/contexts/points-context"
import { AuthModal } from "@/components/shared/auth-modal"
import { PointsPopup } from "@/components/shared/points-popup"
import { BottomNav } from "@/components/shared/bottom-nav"
import { GlobalCoachDock } from "@/components/coach/global-coach-dock"
import { CapacitorInit } from "@/components/shared/capacitor-init"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        <CapacitorInit />
        {children}
        <GlobalCoachDock />
        <AuthModal />
        <PointsPopup />
        <BottomNav />
      </PointsProvider>
    </AuthProvider>
  )
}
