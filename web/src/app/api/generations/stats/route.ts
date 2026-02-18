import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as generationQueries from '@/lib/db/queries/generations'
import type { APIResponse } from '@/types'

/**
 * GET /api/generations/stats?projectId=...
 * Fetch generation statistics for a project
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

    const supabase = await createClient()
    const stats = await generationQueries.getGenerationStats(supabase, projectId)

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('[GET /api/generations/stats] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch generation stats',
      },
      { status: 500 }
    )
  }
}
