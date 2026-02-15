import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/client'
import * as projectQueries from '@/lib/db/queries/projects'
import { GenerationForm } from '@/components/generation/generation-form'

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

  // Verify user owns this project
  try {
    const project = await projectQueries.getProject(id)
    if (project.user_id !== user.id) {
      redirect('/projects')
    }
  } catch (error) {
    redirect('/projects')
  }

  const validTypes = ['text', 'image', 'video', 'audio']
  const generationType = validTypes.includes(type) ? (type as any) : 'text'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate Content</h1>
        <p className="text-gray-600 mt-2">Create new {generationType} content using AI</p>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {validTypes.map((t) => (
          <a
            key={t}
            href={`?type=${t}`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              generationType === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </a>
        ))}
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <GenerationForm
            projectId={id}
            generationType={generationType}
            onSuccess={(generationId) => {
              // Could redirect to generation detail or show notification
              console.log('Generation created:', generationId)
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
