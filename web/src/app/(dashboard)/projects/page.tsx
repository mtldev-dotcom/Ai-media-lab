'use client'

import { useState } from 'react'
import { useProjects, useDeleteProject, useSearchProjects } from '@/hooks/use-projects'
import { Header } from '@/components/layout/header'
import { BottomNavSpacer } from '@/components/layout/bottom-nav'
import { ProjectCard } from '@/components/projects/project-card'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: projects = [], isLoading, error } = useProjects()
  const { data: searchResults = [] } = useSearchProjects(searchQuery)
  const deleteProjectMutation = useDeleteProject()

  const displayProjects = searchQuery ? searchResults : projects

  const handleDelete = (projectId: string) => {
    deleteProjectMutation.mutate(projectId)
  }

  return (
    <div>
      <Header
        title="Projects"
        subtitle="Manage your AI media projects"
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New
          </Link>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg">
            Failed to load projects. Please try again.
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-200 dark:bg-slate-800 rounded-lg h-48 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchQuery ? 'No projects found matching your search' : 'No projects yet'}
            </p>
            {!searchQuery && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Create your first project
              </Link>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && displayProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNavSpacer />
    </div>
  )
}
