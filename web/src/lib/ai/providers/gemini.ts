/**
 * Google Gemini Provider
 * Supports text (Gemini), image (Imagen + Gemini Image), and video (Veo) generation
 */

import {
  BaseProvider,
  GenerationType,
  GenerationRequest,
  GenerationResponse,
  HealthCheckResponse,
  CostEstimate,
} from '../base-provider'

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
    responseModalities?: string[]
  }
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
    }
    finishReason: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// Pricing per 1M tokens (in cents) for text models
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-pro': { input: 125, output: 1000 },
  'gemini-2.5-flash': { input: 15, output: 60 },
  'gemini-2.5-flash-lite': { input: 7.5, output: 30 },
  'gemini-2.0-flash': { input: 7.5, output: 30 },
  'gemini-2.0-flash-lite': { input: 3.75, output: 15 },
  'gemini-1.5-pro': { input: 125, output: 500 },
  'gemini-1.5-flash': { input: 7.5, output: 30 },
}

// Per-image pricing in cents
const IMAGE_PRICING: Record<string, number> = {
  'imagen-4.0-generate-001': 4,
  'imagen-4.0-ultra-generate-001': 8,
  'imagen-4.0-fast-generate-001': 2,
  'gemini-2.5-flash-preview-native-audio-dialog': 4,
  'gemini-3-pro-image-preview': 4,
}

// Per-second video pricing in cents
const VIDEO_PRICING: Record<string, number> = {
  'veo-3.1-generate-preview': 50,
  'veo-3.1-fast-generate-preview': 25,
  'veo-2.0-generate-001': 35,
}

const DEFAULT_PRICING = { input: 7.5, output: 30 }

// Model IDs that use the Imagen :predict endpoint
const IMAGEN_MODELS = [
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-fast-generate-001',
]

// Model IDs that use the Gemini :generateContent endpoint with image output
const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-preview-native-audio-dialog',
  'gemini-3-pro-image-preview',
]

// Model IDs that use the Veo :predictLongRunning endpoint
const VEO_MODELS = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
  'veo-2.0-generate-001',
]

// Curated fallback list if dynamic fetch fails
const FALLBACK_MODELS = [
  // Text
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  // Image
  'gemini-3-pro-image-preview',
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-fast-generate-001',
  // Video
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
  'veo-2.0-generate-001',
]

// Allowed model prefixes from the API
const ALLOWED_MODEL_PREFIXES = ['gemini', 'imagen', 'veo']

export class GeminiProvider extends BaseProvider {
  protected supportedTypes: GenerationType[] = ['text', 'image', 'video']
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor(apiKey: string) {
    super('gemini', apiKey)
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const model = request.model || 'gemini-2.5-flash'

      if (request.type === 'video' || VEO_MODELS.includes(model)) {
        return await this.generateVideo(request)
      }

      if (IMAGEN_MODELS.includes(model)) {
        return await this.generateImagen(request)
      }

      if (GEMINI_IMAGE_MODELS.includes(model) || request.type === 'image') {
        return await this.generateGeminiImage(request)
      }

      return await this.generateText(request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Text generation via Gemini :generateContent
   */
  private async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    const model = request.model || 'gemini-2.5-flash'

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

    if (payload.generationConfig) {
      if (!payload.generationConfig.topP) delete payload.generationConfig.topP
      if (!payload.generationConfig.topK) delete payload.generationConfig.topK
    }

    const response = await fetch(
      `${this.apiUrl}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        metadata: { model, finishReason: data.candidates?.[0]?.finishReason },
      },
      tokens: usage
        ? { input: usage.promptTokenCount, output: usage.candidatesTokenCount }
        : undefined,
    }
  }

  /**
   * Image generation via Imagen :predict endpoint
   */
  private async generateImagen(request: GenerationRequest): Promise<GenerationResponse> {
    const model = request.model || 'imagen-4.0-generate-001'

    const payload = {
      instances: [{ prompt: request.prompt }],
      parameters: {
        sampleCount: request.parameters?.count || 1,
        aspectRatio: request.parameters?.aspect_ratio || '1:1',
        personGeneration: request.parameters?.person_generation || 'ALLOW_ADULT',
      },
    }

    const response = await fetch(
      `${this.apiUrl}/${model}:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Imagen API error: ${data.error?.message || 'Unknown error'}`)
    }

    const images = data.predictions || data.generated_images || []
    const firstImage = images[0]

    if (!firstImage) {
      throw new Error('No image was generated')
    }

    // Imagen returns base64 image data
    const imageData = firstImage.bytesBase64Encoded || firstImage.image?.bytesBase64Encoded
    const mimeType = firstImage.mimeType || 'image/png'

    return {
      success: true,
      result: {
        content: imageData ? `data:${mimeType};base64,${imageData}` : '',
        metadata: {
          model,
          type: 'image',
          count: images.length,
          mimeType,
        },
      },
    }
  }

  /**
   * Image generation via Gemini image models (gemini-3-pro-image-preview, etc.)
   * Uses :generateContent with responseModalities: ["IMAGE", "TEXT"]
   */
  private async generateGeminiImage(request: GenerationRequest): Promise<GenerationResponse> {
    const model = request.model || 'gemini-3-pro-image-preview'

    const payload = {
      contents: [
        {
          parts: [{ text: request.prompt }],
          role: 'user',
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    }

    const response = await fetch(
      `${this.apiUrl}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data: GeminiResponse = await response.json()

    if (!response.ok) {
      throw new Error(`Gemini Image API error: ${(data as any).error?.message || 'Unknown error'}`)
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p) => p.inlineData)
    const textPart = parts.find((p) => p.text)

    if (!imagePart?.inlineData) {
      throw new Error('No image was generated')
    }

    return {
      success: true,
      result: {
        content: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
        metadata: {
          model,
          type: 'image',
          mimeType: imagePart.inlineData.mimeType,
          caption: textPart?.text,
        },
      },
    }
  }

  /**
   * Video generation via Veo :predictLongRunning endpoint
   * Returns an operation that must be polled for completion
   */
  private async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    const model = request.model || 'veo-2.0-generate-001'

    const payload = {
      instances: [
        {
          prompt: request.prompt,
        },
      ],
      parameters: {
        aspectRatio: request.parameters?.aspect_ratio || '16:9',
        durationSeconds: request.parameters?.duration || 4,
      },
    }

    const response = await fetch(
      `${this.apiUrl}/${model}:predictLongRunning?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Veo API error: ${data.error?.message || 'Unknown error'}`)
    }

    // For long-running operations, poll until complete
    const operationName = data.name
    if (!operationName) {
      throw new Error('No operation name returned from Veo API')
    }

    const result = await this.pollOperation(operationName)

    const videos = result.response?.generated_videos || result.response?.generateVideoResponse?.generatedSamples || []
    const firstVideo = videos[0]

    if (!firstVideo) {
      throw new Error('No video was generated')
    }

    const videoUri = firstVideo.video?.uri || firstVideo.uri

    return {
      success: true,
      result: {
        content: videoUri || '',
        metadata: {
          model,
          type: 'video',
          operationName,
        },
      },
    }
  }

  /**
   * Poll a long-running operation until completion
   */
  private async pollOperation(
    operationName: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<any> {
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))

      const response = await fetch(`${baseUrl}/${operationName}?key=${this.apiKey}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Poll error: ${data.error?.message || 'Unknown error'}`)
      }

      if (data.done) {
        if (data.error) {
          throw new Error(`Video generation failed: ${data.error.message}`)
        }
        return data
      }
    }

    throw new Error('Video generation timed out after polling')
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(
        `${this.apiUrl}/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    const model = request.model || 'gemini-2.5-flash'

    // Image model pricing (per image)
    if (IMAGE_PRICING[model] || IMAGEN_MODELS.includes(model) || GEMINI_IMAGE_MODELS.includes(model)) {
      const perImage = IMAGE_PRICING[model] || 4
      const count = request.parameters?.count || 1
      return {
        amount_cents: perImage * count,
        breakdown: { per_image_cents: perImage, count },
      }
    }

    // Video model pricing (per second)
    if (VIDEO_PRICING[model] || VEO_MODELS.includes(model)) {
      const perSecond = VIDEO_PRICING[model] || 35
      const duration = request.parameters?.duration || 4
      return {
        amount_cents: perSecond * duration,
        breakdown: { per_second_cents: perSecond, duration_seconds: duration },
      }
    }

    // Text model pricing (per token)
    const pricing = PRICING[model] || DEFAULT_PRICING
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
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`)

      if (!response.ok) {
        console.warn('Failed to fetch Gemini models, using fallback list')
        return FALLBACK_MODELS
      }

      const data = await response.json()
      const models: string[] = (data.models || [])
        .filter((m: any) => {
          const name = m.name?.replace('models/', '') || ''
          return ALLOWED_MODEL_PREFIXES.some((prefix) => name.startsWith(prefix))
        })
        .map((m: any) => m.name.replace('models/', ''))

      return models.length > 0 ? models : FALLBACK_MODELS
    } catch (error) {
      console.warn('Error fetching Gemini models:', error)
      return FALLBACK_MODELS
    }
  }

  async validateApiKey(): Promise<boolean> {
    const health = await this.healthCheck()
    return health.healthy
  }
}
