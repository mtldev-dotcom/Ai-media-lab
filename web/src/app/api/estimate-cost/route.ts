import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { resolveProviderName } from '@/lib/ai/provider-aliases'
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

    // Resolve provider name (e.g. "google" -> "gemini")
    const factoryProvider = resolveProviderName(validatedData.provider)

    // Get user's API key for this provider (use original name since that's how keys are stored)
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

    // Create provider instance (use resolved name for factory lookup)
    const provider = ProviderFactory.createProvider(factoryProvider, apiKey)

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
  const supabase = await createClient()
  return apiKeyManager.getActiveAPIKey(supabase, userId, provider)
}
