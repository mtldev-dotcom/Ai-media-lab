'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/client'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Attempting login with:', email)

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { data, error: signInError })

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError(signInError.message)
        return
      }

      if (!data.session) {
        console.error('No session returned')
        setError('Login successful but no session created. Please try again.')
        return
      }

      console.log('Login successful, redirecting...')

      // Wait a moment for session to be set
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/projects')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <Zap className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">AI Media Workspace</h1>
        <p className="text-sm text-slate-500">Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={loading}
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
