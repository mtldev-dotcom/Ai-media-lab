import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { z } from 'zod'
import type { APIResponse } from '@/types'

const TestAPIKeySchema = z.object({
  provider: z.string().min(1).max(50),
  keyId: z.string().optional(),
  apiKey: z.string().optional(),
})

/**
 * POST /api/api-keys/test
 * Test an API key (either stored by ID or new key directly)
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
    const validatedData = TestAPIKeySchema.parse(body)

    let apiKeyToTest: string

    if (validatedData.keyId) {
      const supabase = await createClient()
      apiKeyToTest = await apiKeyManager.getDecryptedAPIKey(
        supabase,
        validatedData.keyId,
        user.id
      )
    } else if (validatedData.apiKey) {
      apiKeyToTest = validatedData.apiKey
    } else {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Must provide either keyId or apiKey',
        },
        { status: 400 }
      )
    }

    const testResult = await apiKeyManager.testAPIKey(
      validatedData.provider,
      apiKeyToTest
    )

    return NextResponse.json<APIResponse<any>>({
      success: testResult.success,
      data: {
        provider: validatedData.provider,
        ...testResult,
      },
      message: testResult.message,
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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'NOT_FOUND',
          message: error.message,
        },
        { status: 404 }
      )
    }

    console.error('[POST /api/api-keys/test] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to test API key',
      },
      { status: 500 }
    )
  }
}
