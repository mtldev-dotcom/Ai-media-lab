/**
 * OpenAI Provider
 * Supports GPT models for text generation and DALL-E for images
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface OpenAITextRequest {
  model: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

interface OpenAIImageRequest {
  model: string
  prompt: string
  n: number
  size: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'natural' | 'vivid'
}

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  choices?: Array<{
    message?: { content: string }
    text?: string
    index: number
    finish_reason: string
  }>
  data?: Array<{ url: string }>
}

// Pricing per 1M tokens (in cents)
const PRICING = {
  'gpt-4o': {
    input: 250,
    output: 1000,
  },
  'gpt-4-turbo': {
    input: 1000,
    output: 3000,
  },
  'gpt-4': {
    input: 3000,
    output: 6000,
  },
  'gpt-3.5-turbo': {
    input: 50,
    output: 150,
  },
  'dall-e-3': {
    '1024x1024_standard': 1200, // 12 cents per image
    '1024x1024_hd': 2000,
    '1024x1792_hd': 3000,
    '1792x1024_hd': 3000,
  },
}

export class OpenAIProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text', 'image']
  private readonly apiUrl = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    super('openai', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (request.type === 'text') {
        return await this.generateText(request)
      } else if (request.type === 'image') {
        return await this.generateImage(request)
      } else {
        throw new Error(`OpenAI does not support ${request.type} generation`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    const payload: OpenAITextRequest = {
      model: request.model || 'gpt-4o',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.parameters?.temperature || 0.7,
      max_tokens: request.parameters?.max_tokens || 2000,
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: OpenAIResponse = await response.json()

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${(data as any).error?.message || 'Unknown error'}`)
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
        },
      },
      tokens: tokens ? { input: tokens.prompt_tokens, output: tokens.completion_tokens } : undefined,
    }
  }

  private async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    const payload: OpenAIImageRequest = {
      model: request.model || 'dall-e-3',
      prompt: request.prompt,
      n: request.parameters?.n || 1,
      size: request.parameters?.size || '1024x1024',
      quality: request.parameters?.quality || 'standard',
      style: request.parameters?.style || 'natural',
    }

    const response = await fetch(`${this.apiUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: OpenAIResponse = await response.json()

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${(data as any).error?.message || 'Unknown error'}`)
    }

    const imageUrl = data.data?.[0]?.url || ''

    return {
      success: true,
      result: {
        content: imageUrl,
        metadata: {
          model: data.model,
          created: data.created,
          size: payload.size,
          quality: payload.quality,
        },
      },
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(`${this.apiUrl}/models/gpt-4o`, {
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
    // This is a rough estimation - actual cost depends on tokens used
    if (request.type === 'image') {
      const size = request.parameters?.size || '1024x1024'
      const quality = request.parameters?.quality || 'standard'
      const key = `${size}_${quality}` as keyof typeof PRICING['dall-e-3']
      const costPerImage = PRICING['dall-e-3'][key] || 1200

      return {
        amount_cents: costPerImage * (request.parameters?.n || 1),
        breakdown: {
          images: request.parameters?.n || 1,
          cost_per_image: costPerImage,
        },
      }
    }

    // For text, estimate based on prompt length (rough)
    const model = request.model || 'gpt-4o'
    const promptTokens = Math.ceil(request.prompt.length / 4) // Rough estimate
    const pricing = PRICING[model as keyof typeof PRICING] as any

    if (!pricing) {
      return { amount_cents: 100 } // Default estimate
    }

    const inputCost = (promptTokens / 1_000_000) * pricing.input
    const estimatedOutputTokens = 500 // Conservative estimate
    const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output

    return {
      amount_cents: Math.ceil(inputCost + outputCost),
      breakdown: {
        prompt_tokens: promptTokens,
        estimated_output_tokens: estimatedOutputTokens,
        input_cost_cents: Math.ceil(inputCost),
        output_cost_cents: Math.ceil(outputCost),
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

      const data: any = await response.json()

      if (!response.ok) {
        // Return default models if API call fails
        return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3']
      }

      return (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => id.includes('gpt') || id.includes('dall-e'))
    } catch (error) {
      // Return default models on error
      return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3']
    }
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
