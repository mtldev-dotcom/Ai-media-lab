import { supabase } from '@/lib/db/client'
import { encryptData, decryptData, getKeyPreview } from './encryption'
import type { UserAPIKey, APIKeyWithoutSecret } from '@/types'

/**
 * Get the master encryption key from environment
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set')
  }
  return key
}

/**
 * Store a new API key (encrypted)
 */
export async function storeAPIKey(
  userId: string,
  provider: string,
  apiKey: string,
  keyName?: string
): Promise<UserAPIKey> {
  try {
    const masterKey = getMasterKey()
    const { ciphertext, iv, authTag, salt } = encryptData(apiKey, masterKey)

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider,
        key_name: keyName || `${provider} key`,
        encrypted_key: ciphertext,
        encryption_iv: iv,
        encryption_auth_tag: authTag,
        encryption_salt: salt,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as UserAPIKey
  } catch (error) {
    console.error('Error storing API key:', error)
    throw error
  }
}

/**
 * Get all API keys for a user (without secrets)
 */
export async function getUserAPIKeys(userId: string): Promise<APIKeyWithoutSecret[]> {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, user_id, provider, key_name, is_active, last_used_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Add key preview from the encrypted key
    const keysWithPreview = data.map((key) => ({
      ...key,
      key_preview: key.key_name ? getKeyPreview(key.key_name) : undefined,
    }))

    return keysWithPreview as APIKeyWithoutSecret[]
  } catch (error) {
    console.error('Error fetching API keys:', error)
    throw error
  }
}

/**
 * Retrieve and decrypt an API key (only on server side)
 * WARNING: Only use this to make API calls, never expose to client
 */
export async function getDecryptedAPIKey(keyId: string, userId: string): Promise<string> {
  try {
    const masterKey = getMasterKey()

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, encryption_iv, encryption_auth_tag, encryption_salt')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error('API key not found or you do not have access')
    }

    const decrypted = decryptData(
      data.encrypted_key,
      masterKey,
      data.encryption_iv,
      data.encryption_auth_tag,
      data.encryption_salt
    )

    // Update last_used_at timestamp
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId)
      .select()

    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    throw error
  }
}

/**
 * Delete an API key
 */
export async function deleteAPIKey(keyId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting API key:', error)
    throw error
  }
}

/**
 * Update API key status (active/inactive)
 */
export async function updateAPIKeyStatus(
  keyId: string,
  userId: string,
  isActive: boolean
): Promise<UserAPIKey> {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as UserAPIKey
  } catch (error) {
    console.error('Error updating API key status:', error)
    throw error
  }
}

/**
 * Test an API key by making a simple request to a provider
 * This is a placeholder - implement provider-specific tests
 */
export async function testAPIKey(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Provider-specific testing would go here
    // For now, just validate the key format

    if (!apiKey || apiKey.length < 10) {
      return {
        success: false,
        message: 'API key appears to be invalid (too short)',
      }
    }

    return {
      success: true,
      message: `${provider} API key appears valid`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to test API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get the active API key for a provider (user's default)
 */
export async function getActiveAPIKey(
  userId: string,
  provider: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, encrypted_key, encryption_iv, encryption_auth_tag, encryption_salt')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      throw new Error(`No active API key found for ${provider}`)
    }

    const masterKey = getMasterKey()
    const decrypted = decryptData(
      data.encrypted_key,
      masterKey,
      data.encryption_iv,
      data.encryption_auth_tag,
      data.encryption_salt
    )

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .select()

    return decrypted
  } catch (error) {
    console.error(`Error getting active API key for ${provider}:`, error)
    throw error
  }
}
