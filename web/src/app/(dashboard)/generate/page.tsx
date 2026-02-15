'use client'

import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'

export default function GeneratePage() {
  return (
    <div>
      <Header title="Quick Generate" subtitle="Generate without creating a project" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-slate-600 dark:text-slate-400">
            Quick generation coming soon
          </p>
        </div>
      </div>

      <BottomNavSpacer />
    </div>
  )
}
