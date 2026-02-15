'use client'

import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Settings Navigation */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
            <div className="grid gap-2">
              <a
                href="#api-keys"
                className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="font-medium text-slate-900 dark:text-white">API Keys</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Manage your API keys for providers</div>
              </a>
              <a
                href="#providers"
                className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="font-medium text-slate-900 dark:text-white">Providers</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Configure provider priority and budgets</div>
              </a>
              <a
                href="#profile"
                className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="font-medium text-slate-900 dark:text-white">Profile</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Update your account information</div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <BottomNavSpacer />
    </div>
  )
}
