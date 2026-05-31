"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { PointsProvider } from "@/contexts/points-context"
import { AuthModal } from "@/components/shared/auth-modal"
import { PointsPopup } from "@/components/shared/points-popup"
import { BottomNav } from "@/components/shared/bottom-nav"
import { GlobalCoachDock } from "@/components/coach/global-coach-dock"
import { CapacitorInit } from "@/components/shared/capacitor-init"
import ClickSpark from "@/components/ClickSpark/ClickSpark"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        <ClickSpark
          sparkColor="#90d8e8"
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
          className="min-h-screen"
        >
          <CapacitorInit />
          {children}
          <GlobalCoachDock />
          <AuthModal />
          <PointsPopup />
          <BottomNav />
        </ClickSpark>
      </PointsProvider>
    </AuthProvider>
  )
}
