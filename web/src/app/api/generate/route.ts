import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
import * as generationQueries from '@/lib/db/queries/generations'
import { ProviderRouter } from '@/lib/ai/provider-router'
import { resolveProviderName } from '@/lib/ai/provider-aliases'
import { ProviderFactory } from '@/lib/ai/provider-factory'
import * as apiKeyManager from '@/lib/crypto/api-key-manager'
import { z } from 'zod'
import type { APIResponse } from '@/types'

const GenerateSchema = z.object({
  projectId: z.string().uuid(),
  generationType: z.enum(['text', 'image', 'video', 'audio']),
  provider: z.string(),
  model: z.string(),
  prompt: z.string().min(1),
  parameters: z.record(z.string(), z.any()).optional(),
})

/**
 * POST /api/generate
 * Execute generation with selected provider and model
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

    const supabase = await createClient()
    const body = await request.json()
    const validatedData = GenerateSchema.parse(body)

    // Create generation record
    const generation = await generationQueries.createGeneration(
      supabase,
      user.id,
      validatedData.projectId,
      {
        provider: validatedData.provider,
        model: validatedData.model,
        generation_type: validatedData.generationType,
        prompt: validatedData.prompt,
        parameters: validatedData.parameters,
      }
    )

    // Execute generation asynchronously
    executeGenerationAsync(
      user.id,
      generation.id,
      validatedData
    ).catch((error) => {
      console.error('Async generation failed:', error)
    })

    // Return immediately with generation record
    return NextResponse.json<APIResponse<any>>(
      {
        success: true,
        data: generation,
        message: 'Generation started',
      },
      { status: 202 }
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

    console.error('[POST /api/generate] Error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to start generation',
      },
      { status: 500 }
    )
  }
}

/**
 * Execute generation asynchronously (fire and forget)
 */
async function executeGenerationAsync(
  userId: string,
  generationId: string,
  request: {
    generationType: 'text' | 'image' | 'video' | 'audio'
    provider: string
    model: string
    prompt: string
    parameters?: Record<string, any>
  }
) {
  const startTime = Date.now()

  try {
    // Get a fresh server client for the async operation
    const supabase = await createClient()

    // Get API key for the selected provider (use raw provider name for DB lookup)
    const apiKey = await apiKeyManager.getActiveAPIKey(supabase, userId, request.provider)

    // Resolve provider name for factory (e.g. "google" -> "gemini")
    const factoryName = resolveProviderName(request.provider)
    const provider = ProviderFactory.createProvider(factoryName, apiKey)

    // Execute generation
    const result = await provider.generate({
      type: request.generationType,
      model: request.model,
      prompt: request.prompt,
      parameters: request.parameters,
    })

    const duration = Date.now() - startTime

    if (!result.success) {
      await generationQueries.updateGenerationResult(supabase, generationId, {
        status: 'failed',
        error_message: result.error || 'Generation failed',
        duration_ms: duration,
      })
      return
    }

    // Success - update generation record
    await generationQueries.updateGenerationResult(supabase, generationId, {
      status: 'completed',
      result: {
        content: result.result?.content,
        metadata: result.result?.metadata,
      },
      tokens_input: result.tokens?.input,
      tokens_output: result.tokens?.output,
      tokens_total: (result.tokens?.input || 0) + (result.tokens?.output || 0),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    try {
      const supabase = await createClient()
      await generationQueries.updateGenerationResult(supabase, generationId, {
        status: 'failed',
        error_message: errorMessage,
        duration_ms: duration,
      })
    } catch (updateError) {
      console.error('Failed to update generation status:', updateError)
    }

    console.error('Generation execution failed:', error)
  }
}
