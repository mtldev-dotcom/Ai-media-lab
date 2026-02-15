/**
 * Anthropic Provider
 * Supports Claude models for text generation
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicRequest {
  model: string
  max_tokens: number
  messages: AnthropicMessage[]
  system?: string
  temperature?: number
  top_p?: number
  top_k?: number
}

interface AnthropicResponse {
  id: string
  type: string
  role: string
  content: Array<{ type: string; text: string }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// Pricing per 1M tokens (in cents)
const PRICING = {
  'claude-3-5-sonnet-20241022': {
    input: 3,
    output: 15,
  },
  'claude-3-5-sonnet': {
    input: 3,
    output: 15,
  },
  'claude-3-opus-20250219': {
    input: 15,
    output: 75,
  },
  'claude-3-opus': {
    input: 15,
    output: 75,
  },
  'claude-3-sonnet-20240229': {
    input: 3,
    output: 15,
  },
  'claude-3-haiku-20240307': {
    input: 0.8,
    output: 4,
  },
}

export class AnthropicProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text']
  private readonly apiUrl = 'https://api.anthropic.com/v1'
  private readonly apiVersion = '2023-06-01'

  constructor(apiKey: string) {
    super('anthropic', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (request.type !== 'text') {
        throw new Error(`Anthropic only supports text generation, not ${request.type}`)
      }

      return await this.generateText(request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    const payload: AnthropicRequest = {
      model: request.model || 'claude-3-5-sonnet-20241022',
      max_tokens: request.parameters?.max_tokens || 2000,
      messages: [{ role: 'user', content: request.prompt }],
      system: request.parameters?.system,
      temperature: request.parameters?.temperature || 1.0,
      top_p: request.parameters?.top_p,
      top_k: request.parameters?.top_k,
    }

    // Remove undefined fields
    Object.keys(payload).forEach(
      (key) => payload[key as keyof AnthropicRequest] === undefined && delete payload[key as keyof AnthropicRequest]
    )

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: AnthropicResponse = await response.json()

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${(data as any).error?.message || 'Unknown error'}`)
    }

    const content = data.content[0]?.text || ''
    const tokens = data.usage

    return {
      success: true,
      result: {
        content,
        metadata: {
          model: data.model,
          stop_reason: data.stop_reason,
        },
      },
      tokens: tokens ? { input: tokens.input_tokens, output: tokens.output_tokens } : undefined,
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      // Simple API call to check health
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
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
    const model = request.model || 'claude-3-5-sonnet-20241022'
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-5-sonnet-20241022']

    // Estimate tokens from prompt length (rough)
    const promptTokens = Math.ceil(request.prompt.length / 4)
    const estimatedOutputTokens = request.parameters?.max_tokens || 1000

    const inputCost = (promptTokens / 1_000_000) * pricing.input
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
    // Return known Claude models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20250219',
      'claude-3-haiku-20240307',
    ]
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
