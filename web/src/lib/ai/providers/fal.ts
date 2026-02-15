/**
 * FAL.ai Provider
 * Supports image and video generation models
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface FALRequest {
  prompt: string
  [key: string]: any
}

interface FALResponse {
  request_id: string
  result: {
    image?: { url: string }
    images?: Array<{ url: string }>
    video?: { url: string }
    [key: string]: any
  }
  [key: string]: any
}

// FAL API endpoints for different models
const MODEL_ENDPOINTS = {
  'flux-pro': '/fal-ai/flux-pro/submit',
  'flux-realism': '/fal-ai/flux-realism/submit',
  'lora-studio': '/fal-ai/lora-studio/submit',
  'ideogram-v2': '/fal-ai/ideogram-v2/submit',
  'runway-gen3': '/fal-ai/runway-gen-3/submit',
}

// Estimated pricing (in cents per request)
const PRICING = {
  'flux-pro': 100,
  'flux-realism': 100,
  'lora-studio': 150,
  'ideogram-v2': 200,
  'runway-gen3': 300,
}

export class FALProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['image', 'video']
  private readonly apiUrl = 'https://api.fal.ai'

  constructor(apiKey: string) {
    super('fal', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (!this.supports(request.type)) {
        throw new Error(`FAL does not support ${request.type} generation`)
      }

      const endpoint = MODEL_ENDPOINTS[request.model as keyof typeof MODEL_ENDPOINTS]
      if (!endpoint) {
        throw new Error(`Unknown FAL model: ${request.model}`)
      }

      return await this.generateMedia(endpoint, request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateMedia(endpoint: string, request: GenerationRequest): Promise<GenerationResponse> {
    const payload: FALRequest = {
      prompt: request.prompt,
      ...request.parameters,
    }

    // Start async job
    const submitResponse = await fetch(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const submitData: any = await submitResponse.json()

    if (!submitResponse.ok) {
      throw new Error(`FAL API error: ${submitData.error?.message || 'Unknown error'}`)
    }

    const requestId = submitData.request_id

    // Poll for completion
    const result = await this.pollForCompletion(requestId)

    if (!result.success) {
      throw new Error(result.error || 'Generation failed')
    }

    // Extract content URL
    let contentUrl = ''
    if (request.type === 'image') {
      contentUrl = result.result.image?.url || result.result.images?.[0]?.url || ''
    } else if (request.type === 'video') {
      contentUrl = result.result.video?.url || ''
    }

    if (!contentUrl) {
      throw new Error('No content URL returned from FAL')
    }

    return {
      success: true,
      result: {
        content: contentUrl,
        metadata: {
          model: request.model,
          requestId,
        },
      },
    }
  }

  private async pollForCompletion(
    requestId: string,
    maxWaitMs: number = 60000,
    pollIntervalMs: number = 1000
  ): Promise<FALResponse & { success: boolean; error?: string }> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(`${this.apiUrl}/requests/${requestId}`, {
          headers: {
            Authorization: `Key ${this.apiKey}`,
          },
        })

        const data: any = await response.json()

        if (data.status === 'COMPLETED') {
          return { ...data, success: true }
        }

        if (data.status === 'FAILED') {
          return { ...data, success: false, error: data.error || 'Generation failed' }
        }

        // Still processing, wait and retry
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      } catch (error) {
        console.error('Error polling FAL:', error)
        throw error
      }
    }

    return {
      success: false,
      error: 'Generation timeout - exceeded max wait time',
      request_id: requestId,
      result: {},
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(`${this.apiUrl}/requests`, {
        headers: {
          Authorization: `Key ${this.apiKey}`,
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
    const baseCost = PRICING[request.model as keyof typeof PRICING] || 100

    return {
      amount_cents: baseCost,
      breakdown: {
        base_cost: baseCost,
      },
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'flux-pro',
      'flux-realism',
      'lora-studio',
      'ideogram-v2',
      'runway-gen3',
    ]
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
