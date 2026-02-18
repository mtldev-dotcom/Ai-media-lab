'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCreateGeneration, useEstimateCost, useProviderModels } from '@/hooks/use-generations'
import { useAPIKeys } from '@/hooks/use-api-keys'
import { ParameterControls } from './parameter-controls'
import {
  AlertCircle,
  Loader2,
  Zap,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface GenerationFormProps {
  projectId: string
  generationType: 'text' | 'image' | 'video' | 'audio'
  onSuccess?: (generationId: string) => void
}

export function GenerationForm({
  projectId,
  generationType,
  onSuccess,
}: GenerationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>()
  const [selectedModel, setSelectedModel] = useState<string | undefined>()
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [costEstimate, setCostEstimate] = useState<number | null>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successState, setSuccessState] = useState(false)

  const { data: apiKeys = [], isLoading: keysLoading } = useAPIKeys()
  const createGeneration = useCreateGeneration()
  const estimateCost = useEstimateCost()
  const { data: availableModels = [], isLoading: modelsLoading } = useProviderModels(
    selectedProvider || ''
  )

  // Get unique providers from saved API keys
  const providers = Array.from(new Set(apiKeys.map((key) => key.provider)))

  // Auto-select first provider when keys load
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0])
    }
  }, [providers.length, selectedProvider])

  // Auto-select first model when models load or provider changes
  useEffect(() => {
    if (availableModels.length > 0) {
      setSelectedModel(availableModels[0])
    } else {
      setSelectedModel(undefined)
    }
  }, [availableModels])

  // Estimate cost with debounce
  useEffect(() => {
    if (!prompt || !selectedProvider || !selectedModel) {
      setCostEstimate(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const response = await estimateCost.mutateAsync({
          provider: selectedProvider,
          model: selectedModel,
          generationType,
          prompt,
          parameters,
        })
        setCostEstimate(response.data?.amount_cents || 0)
      } catch {
        setCostEstimate(null)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [prompt, selectedProvider, selectedModel, generationType])

  // Filter models by search
  const filteredModels = availableModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!prompt.trim()) {
      setValidationError('Please enter a prompt')
      return
    }
    if (!selectedProvider) {
      setValidationError('Please select a provider')
      return
    }
    if (!selectedModel) {
      setValidationError('Please select a model')
      return
    }

    try {
      const response = await createGeneration.mutateAsync({
        projectId,
        generationType,
        provider: selectedProvider,
        model: selectedModel,
        prompt,
        parameters,
      })

      setSuccessState(true)
      setPrompt('')
      setTimeout(() => setSuccessState(false), 5000)
      onSuccess?.(response.data?.id)
    } catch (error) {
      // Error handled by React Query
    }
  }

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClick = () => setModelDropdownOpen(false)
    if (modelDropdownOpen) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [modelDropdownOpen])

  const isSubmitDisabled =
    createGeneration.isPending || !prompt.trim() || !selectedProvider || !selectedModel

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* No Providers Warning */}
      {!keysLoading && providers.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-300">No API keys configured</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Add an API key in{' '}
              <Link href="/settings" className="underline font-medium">
                Settings
              </Link>{' '}
              to start generating.
            </p>
          </div>
        </div>
      )}

      {/* Provider Selector */}
      {providers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Provider
          </label>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => {
                  setSelectedProvider(provider)
                  setSelectedModel(undefined)
                  setModelSearch('')
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize',
                  selectedProvider === provider
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model Selector */}
      {selectedProvider && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Model
          </label>
          {modelsLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Loading models...</span>
            </div>
          ) : availableModels.length > 10 ? (
            /* Searchable dropdown for providers with many models (OpenRouter) */
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-left hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <span className={selectedModel ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                  {selectedModel || 'Select a model...'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 transition-transform',
                    modelDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {modelDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Model list */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No models found</div>
                    ) : (
                      filteredModels.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model)
                            setModelDropdownOpen(false)
                            setModelSearch('')
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-sm transition-colors',
                            model === selectedModel
                              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          )}
                        >
                          {model}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : availableModels.length > 0 ? (
            /* Simple select for few models */
            <select
              value={selectedModel || ''}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500">
              No models available for this provider
            </div>
          )}
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {generationType === 'image' ? 'Image Prompt' : generationType === 'audio' ? 'Audio Prompt' : 'Prompt'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            setValidationError(null)
          }}
          placeholder={
            generationType === 'image'
              ? 'A serene mountain landscape at golden hour, photorealistic...'
              : generationType === 'audio'
                ? 'Describe the audio you want to generate...'
                : 'Write a detailed prompt for the AI...'
          }
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
        />
        <p className="text-xs text-slate-400 mt-1.5">
          {prompt.length} characters · Be descriptive and specific for better results
        </p>
      </div>

      {/* Advanced Parameters */}
      <ParameterControls
        parameters={parameters}
        onChange={setParameters}
        generationType={generationType}
      />

      {/* Cost Estimate */}
      {costEstimate !== null && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Estimated cost: ${(costEstimate / 100).toFixed(4)}
          </span>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{validationError}</span>
        </div>
      )}

      {/* Generation Error */}
      {createGeneration.isError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-300">Generation failed</p>
            <p className="text-red-600 dark:text-red-400 mt-0.5">
              {createGeneration.error instanceof Error
                ? createGeneration.error.message
                : 'An unknown error occurred'}
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {successState && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Generation started! Processing in background...
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={cn(
          'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
          isSubmitDisabled
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow'
        )}
      >
        {createGeneration.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate {generationType.charAt(0).toUpperCase() + generationType.slice(1)}
          </>
        )}
      </button>
    </form>
  )
}
