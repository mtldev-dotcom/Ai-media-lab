import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/client'
import * as generationQueries from '@/lib/db/queries/generations'
import type { APIResponse } from '@/types'

/**
 * GET /api/generations?projectId=...
 * Fetch all generations for a project
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'projectId is required',
        },
        { status: 400 }
      )
    }

    const generations = await generationQueries.getGenerations(projectId)

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: generations,
      message: `Found ${generations.length} generations`,
    })
  } catch (error) {
    console.error('[GET /api/generations] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch generations',
      },
      { status: 500 }
    )
  }
}
