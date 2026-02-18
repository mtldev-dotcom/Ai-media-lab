/**
 * Provider Factory
 * Creates provider instances based on provider name
 */

import { BaseProvider } from './base-provider'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { FALProvider } from './providers/fal'
import { GeminiProvider } from './providers/gemini'
import { NanoBananaProvider } from './providers/nano-banana'
import { Veo3Provider } from './providers/veo3'
import { OpenRouterProvider } from './providers/openrouter'

export type ProviderName = 'openai' | 'anthropic' | 'fal' | 'gemini' | 'nano-banana' | 'veo3' | 'openrouter' | 'elevenlabs'

/**
 * Factory to create provider instances
 */
export class ProviderFactory {
  private static providers: Map<string, new (apiKey: string) => BaseProvider> = new Map()

  static {
    ProviderFactory.providers.set('openai', OpenAIProvider as any)
    ProviderFactory.providers.set('anthropic', AnthropicProvider as any)
    ProviderFactory.providers.set('fal', FALProvider as any)
    ProviderFactory.providers.set('gemini', GeminiProvider as any)
    ProviderFactory.providers.set('nano-banana', NanoBananaProvider as any)
    ProviderFactory.providers.set('veo3', Veo3Provider as any)
    ProviderFactory.providers.set('openrouter', OpenRouterProvider as any)
  }

  /**
   * Register a new provider
   */
  static registerProvider(name: string, providerClass: new (apiKey: string) => BaseProvider) {
    this.providers.set(name, providerClass)
  }

  /**
   * Create a provider instance
   */
  static createProvider(name: string, apiKey: string): BaseProvider {
    const ProviderClass = this.providers.get(name)

    if (!ProviderClass) {
      throw new Error(`Provider "${name}" not found. Registered providers: ${Array.from(this.providers.keys()).join(', ')}`)
    }

    return new ProviderClass(apiKey)
  }

  /**
   * Get list of registered providers
   */
  static getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if a provider is registered
   */
  static isProviderRegistered(name: string): boolean {
    return this.providers.has(name)
  }
}
