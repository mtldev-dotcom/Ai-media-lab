'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useProject, useProjectStats, useDeleteProject } from '@/hooks/use-projects'
import { useGenerations } from '@/hooks/use-generations'
import { GenerationResult } from '@/components/generation/generation-result'
import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { FileImage, Zap, BarChart3, Trash2, Loader2 } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'assets' | 'generate' | 'analytics'>('assets')
  const { data: project, isLoading: projectLoading } = useProject(id)
  const { data: stats } = useProjectStats(id)
  const { data: generations, isLoading: generationsLoading } = useGenerations(id)
  const deleteProjectMutation = useDeleteProject()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project and all its data?')) {
      return
    }

    await deleteProjectMutation.mutateAsync(id)
    router.push('/projects')
  }

  if (projectLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-lg h-96 animate-pulse" />
        </div>
        <BottomNavSpacer />
      </div>
    )
  }

  if (!project) {
    return (
      <div>
        <Header title="Project Not Found" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-slate-600 dark:text-slate-400">The project you're looking for doesn't exist.</p>
          <Link href="/projects" className="inline-block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Projects
          </Link>
        </div>
        <BottomNavSpacer />
      </div>
    )
  }

  const spentPercentage = project.budget_cents > 0
    ? Math.round((project.spent_cents / project.budget_cents) * 100)
    : 0

  const tabs = [
    { id: 'assets', label: 'Assets', icon: FileImage },
    { id: 'generate', label: 'Generate', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] as const

  return (
    <div>
      <Header
        title={project.name}
        subtitle={project.description || undefined}
        action={
          <button
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
            className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            title="Delete project"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Budget Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Budget</h3>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Spent</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(project.spent_cents)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Budget Limit</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(project.budget_cents)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  spentPercentage > 100
                    ? 'bg-red-500'
                    : spentPercentage > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>

            {spentPercentage > 0 && (
              <p className={`text-sm font-medium ${
                spentPercentage > 100
                  ? 'text-red-600 dark:text-red-400'
                  : spentPercentage > 80
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {spentPercentage}% of budget used
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Generations</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.generationCount}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Assets</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.assetCount}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Cost</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats.totalCost)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          {activeTab === 'assets' && (
            <div>
              {generationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : generations && generations.length > 0 ? (
                <div className="space-y-3">
                  {generations.map((gen) => (
                    <GenerationResult key={gen.id} generation={gen} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileImage className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No generations yet. Create your first one!
                  </p>
                  <Link
                    href={`/projects/${id}/generate`}
                    className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Generate Content
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Ready to generate content for this project
              </p>
              <Link
                href={`/projects/${id}/generate`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Start Generating
              </Link>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                Analytics will be available once you start generating
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNavSpacer />
    </div>
  )
}
