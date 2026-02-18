'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/db/supabase-browser'
import {
  Key,
  Shield,
  User,
  Eye,
  EyeOff,
  Check,
  LogOut,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4, DALL-E, Whisper', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models', placeholder: 'sk-ant-...' },
  { id: 'google', name: 'Google Gemini', description: 'Gemini Pro, Imagen', placeholder: 'AIza...' },
  { id: 'openrouter', name: 'OpenRouter', description: '400+ models, one API key', placeholder: 'sk-or-...' },
  { id: 'fal', name: 'FAL.ai', description: 'Fast image & video generation', placeholder: 'fal-...' },
]

interface SavedKey {
  id: string
  provider: string
  key_name: string
  is_active: boolean
  created_at: string
}

type Tab = 'api-keys' | 'profile'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys')
  const [email, setEmail] = useState('')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [savedKeys, setSavedKeys] = useState<Record<string, SavedKey>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '')
      }
    })
    fetchSavedKeys()
  }, [])

  const fetchSavedKeys = async () => {
    try {
      const res = await fetch('/api/api-keys')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const keysMap: Record<string, SavedKey> = {}
          json.data.forEach((key: SavedKey) => {
            keysMap[key.provider] = key
          })
          setSavedKeys(keysMap)
        }
      }
    } catch (err) {
      console.error('Failed to fetch saved keys:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleSaveKey = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key?.trim()) return

    setSaving(providerId)
    setError(null)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, apiKey: key }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setApiKeys((prev) => ({ ...prev, [providerId]: '' }))
        showSuccess(`${providerId} key saved successfully`)
        fetchSavedKeys()
      } else {
        setError(json.message || 'Failed to save API key')
      }
    } catch (err) {
      setError('Network error - failed to save key')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteKey = async (providerId: string) => {
    const savedKey = savedKeys[providerId]
    if (!savedKey) return

    setDeleting(providerId)
    setError(null)
    try {
      const res = await fetch(`/api/api-keys/${savedKey.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        setSavedKeys((prev) => {
          const next = { ...prev }
          delete next[providerId]
          return next
        })
        showSuccess(`${providerId} key deleted`)
      } else {
        setError(json.message || 'Failed to delete API key')
      }
    } catch (err) {
      setError('Network error - failed to delete key')
    } finally {
      setDeleting(null)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  const tabs = [
    { id: 'api-keys' as Tab, label: 'API Keys', icon: Key },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and API keys</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-300">Your keys are encrypted</p>
              <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                API keys are encrypted with AES-256-GCM before storage. We never see your keys in plain text.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {PROVIDERS.map((provider) => {
              const saved = savedKeys[provider.id]
              return (
                <div
                  key={provider.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {provider.name}
                      </h3>
                      <p className="text-xs text-slate-500">{provider.description}</p>
                    </div>
                    {saved && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>

                  {saved ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Key saved · {new Date(saved.created_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleDeleteKey(provider.id)}
                        disabled={deleting === provider.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting === provider.id ? '...' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={visibleKeys[provider.id] ? 'text' : 'password'}
                          value={apiKeys[provider.id] || ''}
                          onChange={(e) =>
                            setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                          }
                          placeholder={provider.placeholder}
                          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                          onClick={() => toggleKeyVisibility(provider.id)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {visibleKeys[provider.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => handleSaveKey(provider.id)}
                        disabled={!apiKeys[provider.id]?.trim() || saving === provider.id}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors shrink-0"
                      >
                        {saving === provider.id ? '...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">Account</h3>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Email</label>
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                {email}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
            <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-500 mb-4">Sign out of your account on this device.</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
