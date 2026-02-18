import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { z } from 'zod'
import type { APIResponse, APIKeyWithoutSecret } from '@/types'

// Validation schemas
const AddAPIKeySchema = z.object({
  provider: z.string().min(1).max(50),
  apiKey: z.string().min(1),
  keyName: z.string().max(255).optional(),
})

/**
 * GET /api/api-keys
 * Fetch all API keys for the authenticated user (without secrets)
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

    const supabase = await createClient()
    const keys = await apiKeyManager.getUserAPIKeys(supabase, user.id)

    return NextResponse.json<APIResponse<APIKeyWithoutSecret[]>>({
      success: true,
      data: keys,
      message: `Found ${keys.length} API keys`,
    })
  } catch (error) {
    console.error('[GET /api/api-keys] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch API keys',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/api-keys
 * Add a new API key (encrypted)
 */
export async function POST(request: NextRequest) {
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

    // Validate input
    const validatedData = AddAPIKeySchema.parse(body)

    // Store the encrypted API key
    const supabase = await createClient()
    const storedKey = await apiKeyManager.storeAPIKey(
      supabase,
      user.id,
      validatedData.provider,
      validatedData.apiKey,
      validatedData.keyName
    )

    // Return without sensitive data
    const { encrypted_key, encryption_iv, encryption_salt, ...safeKey } = storedKey
    const keyPreview = validatedData.apiKey.substring(0, 4).toUpperCase()

    return NextResponse.json<APIResponse<any>>(
      {
        success: true,
        data: {
          ...safeKey,
          key_preview: keyPreview,
        },
        message: 'API key added successfully',
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

    console.error('[POST /api/api-keys] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to add API key',
      },
      { status: 500 }
    )
  }
}
