'use client'

import { useRouter } from 'next/navigation'
import { useCreateProject } from '@/hooks/use-projects'
import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'
import { ProjectForm } from '@/components/projects/project-form'
import type { CreateProjectInput } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const createProjectMutation = useCreateProject()

  const handleSubmit = async (data: CreateProjectInput) => {
    await createProjectMutation.mutateAsync(data)
    router.push('/projects')
  }

  return (
    <div>
      <Header title="Create Project" subtitle="Start a new AI media project" />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            isLoading={createProjectMutation.isPending}
            submitLabel="Create Project"
          />
        </div>
      </div>

      <BottomNavSpacer />
    </div>
  )
}
