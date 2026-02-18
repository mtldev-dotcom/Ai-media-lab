import { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
