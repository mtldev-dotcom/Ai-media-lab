import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/client'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { z } from 'zod'
import type { APIResponse } from '@/types'

const EstimateCostSchema = z.object({
  provider: z.string().optional(),
  model: z.string(),
  generationType: z.enum(['text', 'image', 'video', 'audio']),
  prompt: z.string(),
  parameters: z.record(z.string(), z.any()).optional(),
})

/**
 * POST /api/estimate-cost
 * Estimate the cost of a generation request
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
    const validatedData = EstimateCostSchema.parse(body)

    if (!validatedData.provider) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Provider is required',
        },
        { status: 400 }
      )
    }

    // Get user's API key for this provider
    let apiKey: string
    try {
      apiKey = await getProviderAPIKey(user.id, validatedData.provider)
    } catch (error) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'NO_API_KEY',
          message: `No API key found for provider: ${validatedData.provider}`,
        },
        { status: 400 }
      )
    }

    // Create provider instance
    const provider = ProviderFactory.createProvider(validatedData.provider, apiKey)

    // Estimate cost
    const costEstimate = await provider.estimateCost({
      type: validatedData.generationType,
      model: validatedData.model,
      prompt: validatedData.prompt,
      parameters: validatedData.parameters,
    })

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: {
        amount_cents: costEstimate.amount_cents,
        amount_usd: (costEstimate.amount_cents / 100).toFixed(4),
        breakdown: costEstimate.breakdown,
      },
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

    console.error('[POST /api/estimate-cost] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to estimate cost',
      },
      { status: 500 }
    )
  }
}

/**
 * Get decrypted API key for a provider
 */
async function getProviderAPIKey(userId: string, provider: string): Promise<string> {
  try {
    const { supabase } = await import('@/lib/db/client')

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      throw new Error(`No active API key found for ${provider}`)
    }

    const decrypted = await apiKeyManager.getDecryptedAPIKey(data.id, userId)
    return decrypted
  } catch (error) {
    throw new Error(`Failed to retrieve API key for ${provider}`)
  }
}
