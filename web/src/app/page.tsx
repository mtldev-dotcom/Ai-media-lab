'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-browser'
import { Zap, ArrowRight, Sparkles, DollarSign, Layers } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/projects')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="text-center">
          <Zap className="w-10 h-10 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg">AI Media Lab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          All-in-one AI media creation
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
          Create anything with AI.
          <br />
          Track every cent.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Generate images, videos, audio, and text from one workspace.
          Bring your own API keys. See exactly what you spend.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition flex items-center gap-2"
          >
            Start Creating <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Multi-Provider</h3>
            <p className="text-sm text-slate-400">
              OpenAI, Anthropic, Google Gemini, FAL.ai — use any provider from one interface.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-2">Cost Transparency</h3>
            <p className="text-sm text-slate-400">
              See exact costs per generation. Set project budgets. No hidden fees — you use your own keys.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Project Workspaces</h3>
            <p className="text-sm text-slate-400">
              Organize all generated media by project. Track budgets, view history, manage assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
