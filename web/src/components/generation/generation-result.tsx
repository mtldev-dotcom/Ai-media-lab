'use client'

import { useState } from 'react'
import type { Generation } from '@/types'
import {
  ImageIcon,
  FileText,
  Video,
  Music,
  Clock,
  Coins,
  Cpu,
  ChevronDown,
  AlertCircle,
  Loader2,
  Download,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerationResultProps {
  generation: Generation
}

export function GenerationResult({ generation }: GenerationResultProps) {
  const [expanded, setExpanded] = useState(generation.status === 'completed')
  const [copied, setCopied] = useState(false)
  const [imageFullscreen, setImageFullscreen] = useState(false)

  const isProcessing = generation.status === 'processing'
  const isFailed = generation.status === 'failed'
  const isCompleted = generation.status === 'completed'

  const typeIcon = {
    text: FileText,
    image: ImageIcon,
    video: Video,
    audio: Music,
  }
  const Icon = typeIcon[generation.generation_type] || FileText

  const handleCopyText = () => {
    const content = generation.result?.content
    if (content && !content.startsWith('data:')) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadImage = () => {
    const content = generation.result?.content
    if (!content) return

    const link = document.createElement('a')
    link.href = content
    link.download = `generation-${generation.id.slice(0, 8)}.png`
    link.click()
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <>
      <div
        className={cn(
          'border rounded-xl overflow-hidden transition-colors',
          isFailed
            ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10'
            : isProcessing
              ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
        )}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                isFailed
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : isProcessing
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
              ) : isFailed ? (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              ) : (
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {generation.prompt.slice(0, 80)}
                {generation.prompt.length > 80 ? '...' : ''}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {generation.model}
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {timeAgo(generation.created_at)}
                </span>
                {generation.duration_ms && (
                  <>
                    <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {(generation.duration_ms / 1000).toFixed(1)}s
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2',
              expanded && 'rotate-180'
            )}
          />
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-slate-200 dark:border-slate-700">
            {/* Processing State */}
            {isProcessing && (
              <div className="px-4 py-8 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generating... This may take a moment.
                </p>
              </div>
            )}

            {/* Failed State */}
            {isFailed && (
              <div className="px-4 py-4">
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {generation.error_message || 'Generation failed'}
                  </p>
                </div>
              </div>
            )}

            {/* Completed Result */}
            {isCompleted && generation.result && (
              <div className="p-4 space-y-3">
                {/* Text Result */}
                {generation.generation_type === 'text' && generation.result.content && (
                  <div className="relative">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {generation.result.content}
                    </div>
                    <button
                      onClick={handleCopyText}
                      className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                )}

                {/* Image Result */}
                {generation.generation_type === 'image' && generation.result.content && (
                  <div className="space-y-2">
                    <div className="relative group">
                      <img
                        src={generation.result.content}
                        alt={generation.prompt}
                        className="w-full max-h-[512px] object-contain rounded-lg bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setImageFullscreen(true)}
                          className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
                          title="View fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDownloadImage}
                          className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
                          title="Download image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Result */}
                {generation.generation_type === 'video' && generation.result.content && (
                  <div>
                    {generation.result.content.startsWith('http') ? (
                      <video
                        src={generation.result.content}
                        controls
                        className="w-full max-h-[512px] rounded-lg bg-black"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-400">
                        Video generated. URI: {generation.result.content}
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Result */}
                {generation.generation_type === 'audio' && generation.result.content && (
                  <div>
                    <audio
                      src={generation.result.content}
                      controls
                      className="w-full"
                    />
                  </div>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 dark:text-slate-500">
                  {generation.duration_ms && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(generation.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  {generation.tokens_total ? (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {generation.tokens_total.toLocaleString()} tokens
                    </span>
                  ) : null}
                  {generation.cost_cents > 0 && (
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      ${(generation.cost_cents / 100).toFixed(4)}
                    </span>
                  )}
                  <span className="capitalize">{generation.provider}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {imageFullscreen && generation.result?.content && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setImageFullscreen(false)}
        >
          <img
            src={generation.result.content}
            alt={generation.prompt}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={handleDownloadImage}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
