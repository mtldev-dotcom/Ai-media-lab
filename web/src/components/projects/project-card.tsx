'use client'

import Link from 'next/link'
import { Trash2, Edit } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
  onEdit?: (project: Project) => void
}

export function ProjectCard({ project, onDelete, onEdit }: ProjectCardProps) {
  const spentPercentage = project.budget_cents > 0
    ? Math.round((project.spent_cents / project.budget_cents) * 100)
    : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.preventDefault()}>
            {onEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Edit project"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this project?')) {
                    onDelete(project.id)
                  }
                }}
                className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Delete project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Budget
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatCurrency(project.spent_cents)} / {formatCurrency(project.budget_cents)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {spentPercentage}% of budget used
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Updated {formatDate(project.updated_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
