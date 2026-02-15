'use client'

import { useState, useEffect } from 'react'
import { useCreateGeneration, useEstimateCost, useProviderModels } from '@/hooks/use-generations'
import { ProviderSelector } from './provider-selector'
import { ParameterControls } from './parameter-controls'
import { AlertCircle, Loader2, Zap } from 'lucide-react'

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
  const [showCostEstimate, setShowCostEstimate] = useState(false)

  const createGeneration = useCreateGeneration()
  const estimateCost = useEstimateCost()
  const { data: availableModels = [] } = useProviderModels(selectedProvider || '')

  // Update selected model when provider changes
  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0])
    }
  }, [availableModels, selectedModel])

  // Estimate cost when prompt or parameters change
  useEffect(() => {
    if (!prompt || !selectedProvider || !selectedModel) {
      setCostEstimate(null)
      return
    }

    const estimateAsync = async () => {
      try {
        const response = await estimateCost.mutateAsync({
          provider: selectedProvider,
          model: selectedModel,
          generationType,
          prompt,
          parameters,
        })
        setCostEstimate(response.data?.amount_cents || 0)
      } catch (error) {
        console.error('Error estimating cost:', error)
        setCostEstimate(null)
      }
    }

    const timer = setTimeout(estimateAsync, 500) // Debounce
    return () => clearTimeout(timer)
  }, [prompt, selectedProvider, selectedModel, parameters, generationType, estimateCost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim() || !selectedProvider || !selectedModel) {
      alert('Please enter a prompt and select a provider/model')
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

      onSuccess?.(response.data?.id)
    } catch (error) {
      // Error is handled by React Query
      console.error('Generation failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Generation Type Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{generationType} Generation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate high-quality {generationType} content with AI
        </p>
      </div>

      {/* Provider Selector */}
      <ProviderSelector
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        generationType={generationType}
      />

      {/* Model Selector */}
      {selectedProvider && availableModels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {generationType === 'image' ? 'Image Prompt' : 'Prompt'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            generationType === 'image'
              ? 'Describe the image you want to generate...'
              : 'Enter your prompt here...'
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {prompt.length} characters • Be descriptive and specific for better results
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
        <div
          className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-colors"
          onClick={() => setShowCostEstimate(!showCostEstimate)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Estimated Cost: ${(costEstimate / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">Click to view details</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {createGeneration.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Generation failed</p>
            <p className="text-xs mt-1">
              {createGeneration.error instanceof Error
                ? createGeneration.error.message
                : 'An unknown error occurred'}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          createGeneration.isPending ||
          !prompt.trim() ||
          !selectedProvider ||
          !selectedModel
        }
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {createGeneration.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {createGeneration.isPending
          ? 'Generating...'
          : `Generate ${generationType.charAt(0).toUpperCase() + generationType.slice(1)}`}
      </button>
    </form>
  )
}
