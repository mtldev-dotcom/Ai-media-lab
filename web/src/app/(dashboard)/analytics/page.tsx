'use client'

import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'

export default function AnalyticsPage() {
  return (
    <div>
      <Header title="Analytics" subtitle="Track your usage and costs" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-slate-600 dark:text-slate-400">
            Analytics dashboard coming soon
          </p>
        </div>
      </div>

      <BottomNavSpacer />
    </div>
  )
}
