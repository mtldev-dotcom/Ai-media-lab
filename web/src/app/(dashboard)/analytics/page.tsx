'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase-browser'
import {
  BarChart3,
  DollarSign,
  Zap,
  TrendingUp,
  Image,
  FileText,
  Video,
  Music,
} from 'lucide-react'

interface Stats {
  totalGenerations: number
  totalCost: number
  byType: Record<string, number>
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: generations } = await supabase
          .from('generations')
          .select('generation_type, cost_cents, status')
          .eq('user_id', user.id)

        const total = generations?.length || 0
        const cost = generations?.reduce((sum, g) => sum + (g.cost_cents || 0), 0) || 0
        const byType: Record<string, number> = {}
        generations?.forEach((g) => {
          byType[g.generation_type] = (byType[g.generation_type] || 0) + 1
        })

        setStats({ totalGenerations: total, totalCost: cost, byType })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const typeIcons: Record<string, typeof FileText> = {
    text: FileText,
    image: Image,
    video: Video,
    audio: Music,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Track your usage and costs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '-' : stats?.totalGenerations || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total Generations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${loading ? '-' : ((stats?.totalCost || 0) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total Spent</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${loading ? '-' : stats?.totalGenerations ? ((stats.totalCost / stats.totalGenerations) / 100).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg Cost / Gen</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '-' : Object.keys(stats?.byType || {}).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Media Types Used</p>
        </div>
      </div>

      {/* Usage by Type */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Usage by Type</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats?.totalGenerations === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No generations yet</p>
            <p className="text-xs text-slate-400 mt-1">Start generating to see analytics here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {['text', 'image', 'video', 'audio'].map((type) => {
              const count = stats?.byType[type] || 0
              const total = stats?.totalGenerations || 1
              const pct = Math.round((count / total) * 100)
              const Icon = typeIcons[type] || FileText

              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {type}
                      </span>
                      <span className="text-xs text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
