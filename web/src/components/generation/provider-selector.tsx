'use client'

import { useAPIKeys } from '@/hooks/use-api-keys'
import { ProviderRouter } from '@/lib/ai/provider-router'
import { useEffect, useState } from 'react'
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ProviderSelectorProps {
  selectedProvider: string | undefined
  onProviderChange: (provider: string) => void
  generationType: 'text' | 'image' | 'video' | 'audio'
}

interface ProviderWithHealth {
  name: string
  healthy: boolean
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  responseTime?: number
}

export function ProviderSelector({
  selectedProvider,
  onProviderChange,
  generationType,
}: ProviderSelectorProps) {
  const { data: apiKeys = [] } = useAPIKeys()
  const [providersWithHealth, setProvidersWithHealth] = useState<ProviderWithHealth[]>([])
  const [loading, setLoading] = useState(true)

  // Get unique providers from API keys
  const providers = Array.from(new Set(apiKeys.map((key) => key.provider)))

  // Fetch health status for each provider
  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true)
      const healthData: ProviderWithHealth[] = []

      for (const provider of providers) {
        try {
          const health = await ProviderRouter.getProviderHealth(provider)
          healthData.push({
            name: provider,
            healthy: health.healthy,
            status: health.status as any,
          })
        } catch (error) {
          healthData.push({
            name: provider,
            healthy: false,
            status: 'unknown',
          })
        }
      }

      setProvidersWithHealth(healthData)
      setLoading(false)
    }

    if (providers.length > 0) {
      fetchHealth()
    } else {
      setLoading(false)
    }
  }, [providers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="animate-pulse text-sm text-gray-500">Loading providers...</div>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">No providers configured</p>
          <p className="text-xs mt-1">Add an API key in settings to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">AI Provider</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {providersWithHealth.map((provider) => {
          const isSelected = selectedProvider === provider.name
          const isHealthy = provider.healthy

          return (
            <button
              key={provider.name}
              onClick={() => onProviderChange(provider.name)}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${!isHealthy ? 'opacity-60' : ''}`}
              disabled={!isHealthy}
              title={!isHealthy ? `${provider.status}` : ''}
            >
              <div className="text-left">
                <div className="text-xs font-semibold text-gray-900 capitalize truncate">
                  {provider.name}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isHealthy ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  ) : provider.status === 'degraded' ? (
                    <Activity className="w-3 h-3 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className="text-xs text-gray-600 capitalize">{provider.status}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
