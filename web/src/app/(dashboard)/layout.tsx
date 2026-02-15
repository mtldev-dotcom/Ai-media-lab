import { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  )
}
