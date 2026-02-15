/**
 * Google Gemini Provider
 * Supports Gemini models for text, image, and multimodal generation
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>
    role?: string
  }>
  systemInstruction?: { parts: Array<{ text: string }> }
  generationConfig?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
    finishReason: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// Pricing per 1M tokens (in cents)
const PRICING = {
  'gemini-2-0-flash': {
    input: 7.5,
    output: 30,
  },
  'gemini-1-5-pro': {
    input: 1.25,
    output: 5,
  },
  'gemini-1-5-flash': {
    input: 0.075,
    output: 0.3,
  },
}

export class GeminiProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text', 'image']
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor(apiKey: string) {
    super('gemini', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (request.type === 'text' || request.type === 'image') {
        return await this.generateText(request)
      } else {
        throw new Error(`Gemini does not support ${request.type} generation`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    const model = request.model || 'gemini-2-0-flash'

    const payload: GeminiRequest = {
      contents: [
        {
          parts: [{ text: request.prompt }],
          role: 'user',
        },
      ],
      generationConfig: {
        temperature: request.parameters?.temperature || 0.7,
        maxOutputTokens: request.parameters?.max_tokens || 2000,
        topP: request.parameters?.top_p,
        topK: request.parameters?.top_k,
      },
    }

    // Remove undefined fields
    if (payload.generationConfig) {
      if (!payload.generationConfig.topP) delete payload.generationConfig.topP
      if (!payload.generationConfig.topK) delete payload.generationConfig.topK
    }

    const response = await fetch(
      `${this.apiUrl}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data: GeminiResponse = await response.json()

    if (!response.ok) {
      throw new Error(`Gemini API error: ${(data as any).error?.message || 'Unknown error'}`)
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const usage = data.usageMetadata

    return {
      success: true,
      result: {
        content,
        metadata: {
          model,
          finishReason: data.candidates?.[0]?.finishReason,
        },
      },
      tokens: usage
        ? { input: usage.promptTokenCount, output: usage.candidatesTokenCount }
        : undefined,
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(
        `${this.apiUrl}/gemini-2-0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      )

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
    const model = request.model || 'gemini-2-0-flash'
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-2-0-flash']

    // Estimate tokens from prompt length
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
    return [
      'gemini-2-0-flash',
      'gemini-1-5-pro',
      'gemini-1-5-flash',
    ]
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
