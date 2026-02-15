/**
 * Banana.dev Provider (formerly Nano Banana)
 * Supports serverless GPU inference for various models
 */

import { BaseProvider, GenerationType, GenerationRequest, GenerationResponse, HealthCheckResponse, CostEstimate } from '../base-provider'

interface BananaRequest {
  modelInputs?: {
    prompt: string
    temperature?: number
    top_p?: number
    max_new_tokens?: number
    [key: string]: any
  }
  callbackUrl?: string
  timeoutSeconds?: number
}

interface BananaResponse {
  id: string
  message?: string
  modelOutputs?: {
    output?: string
    generated_text?: string
    images?: Array<{ image: string }>
    [key: string]: any
  }
  created?: number
  startTime?: number
  endTime?: number
  totalTime?: number
}

// Available models and pricing (in cents per inference)
const MODELS = {
  'mistral-7b': {
    pricePerInference: 50,
    supportedTypes: ['text'] as GenerationType[],
  },
  'neural-chat-7b': {
    pricePerInference: 40,
    supportedTypes: ['text'] as GenerationType[],
  },
  'stable-diffusion-v2': {
    pricePerInference: 100,
    supportedTypes: ['image'] as GenerationType[],
  },
  'stable-diffusion-xl': {
    pricePerInference: 150,
    supportedTypes: ['image'] as GenerationType[],
  },
  'llama-2-7b': {
    pricePerInference: 35,
    supportedTypes: ['text'] as GenerationType[],
  },
}

export class NanoBananaProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text', 'image']
  private readonly apiUrl = 'https://api.banana.dev'

  constructor(apiKey: string) {
    super('nano-banana', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const model = request.model || 'mistral-7b'

      if (!(model in MODELS)) {
        throw new Error(`Unknown Nano Banana model: ${model}`)
      }

      const modelConfig = MODELS[model as keyof typeof MODELS]
      if (!modelConfig.supportedTypes.includes(request.type)) {
        throw new Error(`${model} does not support ${request.type} generation`)
      }

      return await this.executeInference(model, request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async executeInference(model: string, request: GenerationRequest): Promise<GenerationResponse> {
    const payload: BananaRequest = {
      modelInputs: {
        prompt: request.prompt,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        max_new_tokens: request.parameters?.max_tokens || 512,
        ...request.parameters,
      },
      timeoutSeconds: 60,
    }

    const startTime = Date.now()

    const response = await fetch(`${this.apiUrl}/api/v2/run`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        modelKey: model,
        ...payload,
      }),
    })

    const duration = Date.now() - startTime
    const data: BananaResponse = await response.json()

    if (!response.ok || data.message?.includes('error')) {
      throw new Error(`Nano Banana API error: ${data.message || 'Unknown error'}`)
    }

    let contentUrl = ''

    if (request.type === 'image') {
      // For image generation, extract the image from modelOutputs
      const images = data.modelOutputs?.images
      if (images && images.length > 0) {
        contentUrl = images[0].image // Might be base64 or URL
      }
    } else {
      // For text generation
      contentUrl = data.modelOutputs?.output || data.modelOutputs?.generated_text || ''
    }

    if (!contentUrl) {
      throw new Error('No content returned from Nano Banana')
    }

    return {
      success: true,
      result: {
        content: contentUrl,
        metadata: {
          model,
          id: data.id,
        },
      },
      duration_ms: duration,
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(`${this.apiUrl}/api/v2/run`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          modelKey: 'mistral-7b',
          modelInputs: {
            prompt: 'test',
            max_new_tokens: 10,
          },
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
    const model = request.model || 'mistral-7b'
    const modelConfig = MODELS[model as keyof typeof MODELS]

    if (!modelConfig) {
      return { amount_cents: 50 } // Default estimate
    }

    return {
      amount_cents: modelConfig.pricePerInference,
      breakdown: {
        price_per_inference: modelConfig.pricePerInference,
      },
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return Object.keys(MODELS)
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
