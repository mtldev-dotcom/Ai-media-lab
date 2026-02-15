'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/client'
import { Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const user = await getCurrentUser()
      if (user) {
        router.push('/projects')
      } else {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          AI Media Creation Workspace
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Loading...</p>
      </div>
    </div>
  )
}
