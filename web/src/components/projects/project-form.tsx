'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { Project, CreateProjectInput } from '@/types'

interface ProjectFormProps {
  initialData?: Project
  onSubmit: (data: CreateProjectInput) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Create Project',
}: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    budget_cents: initialData?.budget_cents || 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [budgetDisplay, setBudgetDisplay] = useState(
    initialData ? (initialData.budget_cents / 100).toString() : ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        budget_cents: parseInt(budgetDisplay) * 100 || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    }
  }

  const handleBudgetChange = (value: string) => {
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setBudgetDisplay(value)
      const cents = value ? Math.round(parseFloat(value) * 100) : 0
      setFormData((prev) => ({ ...prev, budget_cents: cents }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="My AI Media Project"
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          disabled={isLoading}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your project..."
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          disabled={isLoading}
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Budget (USD) - Optional
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-slate-600 dark:text-slate-400 font-medium">
            $
          </span>
          <input
            type="text"
            value={budgetDisplay}
            onChange={(e) => handleBudgetChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={isLoading}
          />
        </div>
        {formData.budget_cents > 0 && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Budget: {formatCurrency(formData.budget_cents)}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {isLoading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
