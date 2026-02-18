'use client'

import { useGenerations } from '@/hooks/use-generations'
import { GenerationResult } from './generation-result'
import { Loader2, History } from 'lucide-react'

interface GenerationHistoryProps {
  projectId: string
}

export function GenerationHistory({ projectId }: GenerationHistoryProps) {
  const { data: generations, isLoading } = useGenerations(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!generations || generations.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Recent Generations
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({generations.length})
        </span>
      </div>
      <div className="space-y-2">
        {generations.map((gen) => (
          <GenerationResult key={gen.id} generation={gen} />
        ))}
      </div>
    </div>
  )
}
