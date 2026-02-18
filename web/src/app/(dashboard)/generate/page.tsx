'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Image,
  Video,
  Music,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mediaTypes = [
  {
    id: 'text',
    label: 'Text',
    description: 'Blog posts, stories, code, and more',
    icon: FileText,
    color: 'blue',
    providers: ['OpenAI', 'Anthropic', 'Google', 'OpenRouter'],
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Photos, illustrations, concept art',
    icon: Image,
    color: 'purple',
    providers: ['OpenAI DALL-E', 'FAL.ai', 'Google Imagen', 'OpenRouter'],
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Short clips, animations, b-roll',
    icon: Video,
    color: 'emerald',
    providers: ['FAL.ai'],
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Speech, sound effects, music',
    icon: Music,
    color: 'amber',
    providers: ['OpenAI Whisper'],
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
}

const iconBgMap: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/40',
  purple: 'bg-purple-100 dark:bg-purple-900/40',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
  amber: 'bg-amber-100 dark:bg-amber-900/40',
}

export default function GeneratePage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generate</h1>
        <p className="text-sm text-slate-500 mt-1">Choose a media type to start creating</p>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-300">Quick Generate</p>
          <p className="text-blue-700 dark:text-blue-400 mt-0.5">
            Generate content without a project, or go to a project to generate within its context and budget.
          </p>
        </div>
      </div>

      {/* Media Type Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {mediaTypes.map((type) => {
          const Icon = type.icon
          return (
            <Link
              key={type.id}
              href={`/generate?type=${type.id}`}
              className={cn(
                'group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[type.color])}>
                  <Icon className={cn('w-5 h-5', `text-${type.color}-600 dark:text-${type.color}-400`)} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{type.label}</h3>
              <p className="text-sm text-slate-500 mt-1">{type.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {type.providers.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
