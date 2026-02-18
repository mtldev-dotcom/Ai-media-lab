'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, ImageIcon, Video, Music, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GenerationForm } from '@/components/generation/generation-form'
import { GenerationHistory } from '@/components/generation/generation-history'
import { useQueryClient } from '@tanstack/react-query'

const MEDIA_TYPES = [
  { id: 'text' as const, label: 'Text', icon: FileText },
  { id: 'image' as const, label: 'Image', icon: ImageIcon },
  { id: 'video' as const, label: 'Video', icon: Video },
  { id: 'audio' as const, label: 'Audio', icon: Music },
]

interface GenerateClientProps {
  projectId: string
  initialType: 'text' | 'image' | 'video' | 'audio'
}

export function GenerateClient({ projectId, initialType }: GenerateClientProps) {
  const [activeType, setActiveType] = useState(initialType)
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleTypeChange = (type: typeof activeType) => {
    setActiveType(type)
    router.replace(`?type=${type}`, { scroll: false })
  }

  const handleGenerationSuccess = () => {
    // Poll for completion — refetch generations every 2s for up to 60s
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      queryClient.invalidateQueries({ queryKey: ['generations', projectId] })
      if (attempts >= 30) clearInterval(interval)
    }, 2000)

    // Also do an immediate refetch
    queryClient.invalidateQueries({ queryKey: ['generations', projectId] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generate</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create AI-generated content for your project
        </p>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-fit">
        {MEDIA_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = activeType === type.id
          return (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          )
        })}
      </div>

      {/* Generation Form */}
      <GenerationForm
        key={activeType}
        projectId={projectId}
        generationType={activeType}
        onSuccess={handleGenerationSuccess}
      />

      {/* Generation History */}
      <GenerationHistory projectId={projectId} />
    </div>
  )
}
