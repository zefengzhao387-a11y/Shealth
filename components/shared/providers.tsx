"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { PointsProvider } from "@/contexts/points-context"
import { AuthModal } from "@/components/shared/auth-modal"
import { PointsPopup } from "@/components/shared/points-popup"
import { BottomNav } from "@/components/shared/bottom-nav"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        {children}
        <AuthModal />
        <PointsPopup />
        <BottomNav />
      </PointsProvider>
    </AuthProvider>
  )
}
