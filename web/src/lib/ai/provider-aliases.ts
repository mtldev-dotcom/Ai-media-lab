/**
 * Maps provider names used in the settings/DB to factory-registered names.
 * Settings saves keys as "google" but the provider factory registers as "gemini".
 */
const PROVIDER_ALIASES: Record<string, string> = {
  google: 'gemini',
}

/**
 * Resolve a provider name from DB/settings to the factory-registered name.
 */
export function resolveProviderName(provider: string): string {
  return PROVIDER_ALIASES[provider] || provider
}
