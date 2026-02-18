import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as projectQueries from '@/lib/db/queries/projects'
import { GenerateClient } from './generate-client'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function GenerateProjectPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { type = 'text' } = await searchParams

  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  try {
    const supabase = await createClient()
    const project = await projectQueries.getProject(id, supabase)
    if (project.user_id !== user.id) {
      redirect('/projects')
    }
  } catch (error) {
    redirect('/projects')
  }

  const validTypes = ['text', 'image', 'video', 'audio']
  const generationType = validTypes.includes(type) ? (type as 'text' | 'image' | 'video' | 'audio') : 'text'

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <GenerateClient projectId={id} initialType={generationType} />
    </Suspense>
  )
}
