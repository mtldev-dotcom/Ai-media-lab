import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase-server'
import * as projectQueries from '@/lib/db/queries/projects'
import { z } from 'zod'
import type { APIResponse } from '@/types'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  budget_cents: z.number().min(0).optional(),
  thumbnail_url: z.string().url().optional(),
})

/**
 * GET /api/projects/[id]
 * Fetch a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
        { status: 401 }
      )
    }

    const project = await projectQueries.getProject(id)

    // Verify user owns this project
    if (project.user_id !== user.id) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have access to this project',
        },
        { status: 403 }
      )
    }

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch project',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
        { status: 401 }
      )
    }

    // Verify user owns this project
    const project = await projectQueries.getProject(id)
    if (project.user_id !== user.id) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have access to this project',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateProjectSchema.parse(body)

    const updatedProject = await projectQueries.updateProject(id, validatedData)

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
    })
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

    console.error('[PUT /api/projects/[id]] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update project',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete (archive) a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
        { status: 401 }
      )
    }

    // Verify user owns this project
    const project = await projectQueries.getProject(id)
    if (project.user_id !== user.id) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have access to this project',
        },
        { status: 403 }
      )
    }

    await projectQueries.deleteProject(id)

    return NextResponse.json<APIResponse<null>>({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete project',
      },
      { status: 500 }
    )
  }
}
