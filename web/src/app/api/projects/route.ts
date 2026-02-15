import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/client'
import * as projectQueries from '@/lib/db/queries/projects'
import { z } from 'zod'
import type { APIResponse } from '@/types'

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  budget_cents: z.number().min(0).optional(),
})

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  budget_cents: z.number().min(0).optional(),
  thumbnail_url: z.string().url().optional().nullable(),
})

/**
 * GET /api/projects
 * Fetch all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in to view projects',
        },
        { status: 401 }
      )
    }

    const projects = await projectQueries.getProjects(user.id)

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: projects,
      message: `Found ${projects.length} projects`,
    })
  } catch (error) {
    console.error('[GET /api/projects] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch projects',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in to create projects',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = CreateProjectSchema.parse(body)

    const newProject = await projectQueries.createProject(user.id, validatedData)

    return NextResponse.json<APIResponse<any>>(
      {
        success: true,
        data: newProject,
        message: 'Project created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
        },
        { status: 400 }
      )
    }

    console.error('[POST /api/projects] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to create project',
      },
      { status: 500 }
    )
  }
}
