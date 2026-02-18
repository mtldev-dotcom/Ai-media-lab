/**
 * OpenRouter Provider
 * Routes to 400+ AI models through a single API (OpenAI-compatible)
 * https://openrouter.ai/docs/quickstart
 */

import {
  BaseProvider,
  GenerationType,
  GenerationRequest,
  GenerationResponse,
  HealthCheckResponse,
  CostEstimate,
} from '../base-provider'

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OpenRouterResponse {
  id: string
  model: string
  created: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  choices?: Array<{
    message?: { content: string }
    index: number
    finish_reason: string
  }>
  data?: Array<{ url: string }>
  error?: { message: string; code: number }
}

interface OpenRouterModel {
  id: string
  name: string
  pricing?: {
    prompt: string
    completion: string
    image?: string
  }
  context_length?: number
  architecture?: {
    modality: string
    input_modalities?: string[]
    output_modalities?: string[]
  }
}

// Popular models with known pricing (cents per 1M tokens)
const POPULAR_MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-pro-preview',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-r1',
  'mistralai/mistral-large',
]

const IMAGE_MODELS = [
  'openai/dall-e-3',
  'black-forest-labs/flux-1.1-pro',
  'stability/stable-diffusion-3',
]

export class OpenRouterProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text', 'image']
  private readonly apiUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    super('openrouter', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (request.type === 'text') {
        return await this.generateText(request)
      } else if (request.type === 'image') {
        return await this.generateImage(request)
      } else {
        throw new Error(`OpenRouter does not support ${request.type} generation`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    const messages: OpenRouterMessage[] = [{ role: 'user', content: request.prompt }]

    if (request.parameters?.system) {
      messages.unshift({ role: 'system', content: request.parameters.system })
    }

    const payload: Record<string, unknown> = {
      model: request.model || 'openai/gpt-4o-mini',
      messages,
      temperature: request.parameters?.temperature ?? 0.7,
      max_tokens: request.parameters?.max_tokens ?? 2000,
    }

    if (request.parameters?.top_p !== undefined) {
      payload.top_p = request.parameters.top_p
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Media Lab',
      },
      body: JSON.stringify(payload),
    })

    const data: OpenRouterResponse = await response.json()

    if (!response.ok || data.error) {
      throw new Error(
        `OpenRouter API error: ${data.error?.message || `Status ${response.status}`}`
      )
    }

    const content = data.choices?.[0]?.message?.content || ''
    const tokens = data.usage

    return {
      success: true,
      result: {
        content,
        metadata: {
          model: data.model,
          created: data.created,
          provider: 'openrouter',
        },
      },
      tokens: tokens
        ? { input: tokens.prompt_tokens, output: tokens.completion_tokens }
        : undefined,
    }
  }

  private async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    const payload = {
      model: request.model || 'openai/dall-e-3',
      prompt: request.prompt,
      n: request.parameters?.n || 1,
      size: request.parameters?.size || '1024x1024',
    }

    const response = await fetch(`${this.apiUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Media Lab',
      },
      body: JSON.stringify(payload),
    })

    const data: OpenRouterResponse = await response.json()

    if (!response.ok || data.error) {
      throw new Error(
        `OpenRouter API error: ${data.error?.message || `Status ${response.status}`}`
      )
    }

    const imageUrl = data.data?.[0]?.url || ''

    return {
      success: true,
      result: {
        content: imageUrl,
        metadata: {
          model: request.model || 'openai/dall-e-3',
          provider: 'openrouter',
          size: payload.size,
        },
      },
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(`${this.apiUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        return {
          healthy: false,
          lastChecked: new Date().toISOString(),
          error: `API returned status ${response.status}`,
          responseTime_ms: duration,
        }
      }

      return {
        healthy: true,
        lastChecked: new Date().toISOString(),
        responseTime_ms: duration,
      }
    } catch (error) {
      return {
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async estimateCost(request: GenerationRequest): Promise<CostEstimate> {
    if (request.type === 'image') {
      return {
        amount_cents: 4, // ~$0.04 per image via OpenRouter
        breakdown: { images: request.parameters?.n || 1 },
      }
    }

    // Text: estimate based on prompt length
    const promptTokens = Math.ceil(request.prompt.length / 4)
    const estimatedOutputTokens = 500

    // OpenRouter pricing varies by model, use a conservative average
    // Most popular models are $1-5 per 1M tokens
    const avgCostPer1MTokens = 300 // cents
    const totalTokens = promptTokens + estimatedOutputTokens
    const cost = Math.ceil((totalTokens / 1_000_000) * avgCostPer1MTokens)

    return {
      amount_cents: Math.max(cost, 1),
      breakdown: {
        prompt_tokens: promptTokens,
        estimated_output_tokens: estimatedOutputTokens,
      },
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        return [...POPULAR_MODELS, ...IMAGE_MODELS]
      }

      const data: { data: OpenRouterModel[] } = await response.json()

      // Return a curated list of popular text and image models
      const models = (data.data || [])
        .filter((m) => {
          // Filter to text and image generation models
          const modality = m.architecture?.modality || ''
          return modality.includes('text') || m.architecture?.output_modalities?.includes('image')
        })
        .slice(0, 50) // Limit to top 50
        .map((m) => m.id)

      return models.length > 0 ? models : [...POPULAR_MODELS, ...IMAGE_MODELS]
    } catch (error) {
      return [...POPULAR_MODELS, ...IMAGE_MODELS]
    }
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
