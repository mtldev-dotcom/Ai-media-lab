'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/db/client'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const { data: { user } } = await supabase.auth.getUser()

        console.log('Session:', session)
        console.log('User:', user)
        console.log('Cookies:', document.cookie)

        setSession(session)
        setUser(user)
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Debug: Auth Status</h1>

      <div className="space-y-6">
        <div className="bg-slate-100 p-4 rounded">
          <h2 className="font-bold mb-2">Session:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-slate-100 p-4 rounded">
          <h2 className="font-bold mb-2">User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-slate-100 p-4 rounded">
          <h2 className="font-bold mb-2">Cookies:</h2>
          <pre className="text-sm overflow-auto">
            {document.cookie || 'No cookies set'}
          </pre>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold mb-2">Status:</h2>
          {session ? (
            <p className="text-green-600">✅ Logged in as: {user?.email}</p>
          ) : (
            <p className="text-red-600">❌ Not logged in</p>
          )}
        </div>
      </div>
    </div>
  )
}
