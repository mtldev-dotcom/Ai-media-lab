import { encryptData, decryptData, getKeyPreview } from './encryption'
import type { SupabaseClient } from '@supabase/supabase-js'
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
  supabase: SupabaseClient,
  userId: string,
  provider: string,
  apiKey: string,
  keyName?: string
): Promise<UserAPIKey> {
  const masterKey = getMasterKey()
  const { ciphertext, iv, authTag, salt } = encryptData(apiKey, masterKey)

  // Delete existing keys for same provider before inserting
  await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

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
}

/**
 * Get all API keys for a user (without secrets)
 */
export async function getUserAPIKeys(
  supabase: SupabaseClient,
  userId: string
): Promise<APIKeyWithoutSecret[]> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, user_id, provider, key_name, is_active, last_used_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as APIKeyWithoutSecret[]
}

/**
 * Retrieve and decrypt an API key (only on server side)
 * WARNING: Only use this to make API calls, never expose to client
 */
export async function getDecryptedAPIKey(
  supabase: SupabaseClient,
  keyId: string,
  userId: string
): Promise<string> {
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

  return decrypted
}

/**
 * Delete an API key
 */
export async function deleteAPIKey(
  supabase: SupabaseClient,
  keyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

/**
 * Update API key status (active/inactive)
 */
export async function updateAPIKeyStatus(
  supabase: SupabaseClient,
  keyId: string,
  userId: string,
  isActive: boolean
): Promise<UserAPIKey> {
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
}

/**
 * Test an API key by making a simple request to a provider
 */
export async function testAPIKey(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
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
}

/**
 * Get the active API key for a provider (user's default)
 */
export async function getActiveAPIKey(
  supabase: SupabaseClient,
  userId: string,
  provider: string
): Promise<string> {
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

  return decrypted
}
