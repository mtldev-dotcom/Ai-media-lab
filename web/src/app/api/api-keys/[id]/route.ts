import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { z } from 'zod'
import type { APIResponse } from '@/types'

const UpdateAPIKeyStatusSchema = z.object({
  is_active: z.boolean(),
})

/**
 * PUT /api/api-keys/[id]
 * Update API key status (active/inactive)
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

    const body = await request.json()
    const validatedData = UpdateAPIKeyStatusSchema.parse(body)

    const supabase = await createClient()
    const updatedKey = await apiKeyManager.updateAPIKeyStatus(
      supabase,
      id,
      user.id,
      validatedData.is_active
    )

    // Return without sensitive data
    const { encrypted_key, encryption_iv, encryption_salt, ...safeKey } = updatedKey

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: safeKey,
      message: 'API key updated successfully',
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

    console.error('[PUT /api/api-keys/[id]] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update API key',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/api-keys/[id]
 * Delete an API key
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

    const supabase = await createClient()
    await apiKeyManager.deleteAPIKey(supabase, id, user.id)

    return NextResponse.json<APIResponse<null>>({
      success: true,
      message: 'API key deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/api-keys/[id]] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete API key',
      },
      { status: 500 }
    )
  }
}
