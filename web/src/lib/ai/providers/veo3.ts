/**
 * Runway Veo3 Provider (via OpenAPI/FAL)
 * Supports AI video generation
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface Veo3Request {
  prompt: string
  duration?: number // in seconds, 4-120
  width?: number // 576, 1024
  height?: number // 576, 1024
  imagePromptUrl?: string
}

interface Veo3Response {
  request_id: string
  status: string
  result?: {
    video_url: string
    metadata?: Record<string, any>
  }
  error?: string
}

// Pricing based on duration and quality
const PRICING = {
  '4sec_576': 150,
  '4sec_1024': 300,
  '10sec_576': 250,
  '10sec_1024': 500,
  '30sec_1024': 1000,
}

export class Veo3Provider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['video']
  private readonly apiUrl = 'https://api.fal.ai/fal-ai/veo3/submit'
  private readonly statusUrl = 'https://api.fal.ai/requests'

  constructor(apiKey: string) {
    super('veo3', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (request.type !== 'video') {
        throw new Error(`Veo3 only supports video generation, not ${request.type}`)
      }

      return await this.generateVideo(request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    const duration = request.parameters?.duration || 4
    const width = request.parameters?.width || 1024
    const height = request.parameters?.height || 1024

    if (duration < 4 || duration > 120) {
      throw new Error('Duration must be between 4 and 120 seconds')
    }

    const payload: Veo3Request = {
      prompt: request.prompt,
      duration,
      width,
      height,
      imagePromptUrl: request.parameters?.imagePromptUrl,
    }

    // Remove undefined fields
    if (!payload.imagePromptUrl) delete payload.imagePromptUrl

    // Submit job
    const submitResponse = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const submitData: any = await submitResponse.json()

    if (!submitResponse.ok) {
      throw new Error(`Veo3 API error: ${submitData.error?.message || 'Unknown error'}`)
    }

    const requestId = submitData.request_id

    // Poll for completion (video generation can take a while)
    const result = await this.pollForCompletion(requestId, 600000) // 10 minute timeout

    if (!result.success) {
      throw new Error(result.error || 'Video generation failed')
    }

    const videoUrl = result.result?.video_url
    if (!videoUrl) {
      throw new Error('No video URL returned from Veo3')
    }

    return {
      success: true,
      result: {
        content: videoUrl,
        metadata: {
          model: 'veo3',
          requestId,
          duration,
          width,
          height,
        },
      },
    }
  }

  private async pollForCompletion(
    requestId: string,
    maxWaitMs: number = 600000,
    pollIntervalMs: number = 2000
  ): Promise<Veo3Response & { success: boolean }> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(`${this.statusUrl}/${requestId}`, {
          headers: {
            Authorization: `Key ${this.apiKey}`,
          },
        })

        const data: any = await response.json()

        if (data.status === 'COMPLETED') {
          return { ...data, success: true }
        }

        if (data.status === 'FAILED') {
          return { ...data, success: false }
        }

        // Still processing, wait and retry
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      } catch (error) {
        console.error('Error polling Veo3:', error)
        throw error
      }
    }

    return {
      success: false,
      status: 'TIMEOUT',
      request_id: requestId,
      error: 'Video generation timeout - exceeded max wait time',
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          duration: 4,
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
    const duration = request.parameters?.duration || 4
    const width = request.parameters?.width || 1024
    const height = request.parameters?.height || 1024

    // Determine pricing key
    let pricingKey = '4sec_1024'
    if (duration <= 4 && width === 576) {
      pricingKey = '4sec_576'
    } else if (duration <= 4 && width === 1024) {
      pricingKey = '4sec_1024'
    } else if (duration <= 10 && width === 576) {
      pricingKey = '10sec_576'
    } else if (duration <= 10 && width === 1024) {
      pricingKey = '10sec_1024'
    } else if (duration <= 30) {
      pricingKey = '30sec_1024'
    }

    const baseCost = PRICING[pricingKey as keyof typeof PRICING] || 500

    return {
      amount_cents: baseCost,
      breakdown: {
        duration_seconds: duration,
        width,
        height,
        base_cost: baseCost,
      },
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return ['veo3']
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
