import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost parameter
  r: 8, // Block size parameter
  p: 1, // Parallelization parameter
  maxmem: 64 * 1024 * 1024, // Maximum memory to use
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param masterKey - The master encryption key (32 bytes)
 * @param salt - Salt for key derivation (optional, generated if not provided)
 * @returns Encrypted data with IV and auth tag
 */
export function encryptData(
  plaintext: string,
  masterKey: string,
  salt?: Buffer
): {
  ciphertext: string
  iv: string
  authTag: string
  salt: string
} {
  // Generate salt if not provided
  if (!salt) {
    salt = randomBytes(64)
  }

  // Derive encryption key from master key using Scrypt
  const derivedKey = scryptSync(masterKey, salt, 32, SCRYPT_PARAMS)

  // Generate random IV (96 bits / 12 bytes for GCM)
  const iv = randomBytes(12)

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv)

  // Encrypt the plaintext
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')

  // Get authentication tag
  const authTag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
  }
}

/**
 * Decrypt data encrypted with encryptData()
 * @param ciphertext - The encrypted data (hex string)
 * @param masterKey - The master encryption key (32 bytes)
 * @param iv - Initialization vector (hex string)
 * @param authTag - Authentication tag (hex string)
 * @param salt - Salt used for key derivation (hex string)
 * @returns Decrypted plaintext
 */
export function decryptData(
  ciphertext: string,
  masterKey: string,
  iv: string,
  authTag: string,
  salt: string
): string {
  try {
    // Derive the same key using the same salt
    const saltBuffer = Buffer.from(salt, 'hex')
    const derivedKey = scryptSync(masterKey, saltBuffer, 32, SCRYPT_PARAMS)

    // Convert hex strings back to buffers
    const ivBuffer = Buffer.from(iv, 'hex')
    const authTagBuffer = Buffer.from(authTag, 'hex')

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, derivedKey, ivBuffer)

    // Set the authentication tag
    decipher.setAuthTag(authTagBuffer)

    // Decrypt
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8')
    plaintext += decipher.final('utf8')

    return plaintext
  } catch (error) {
    throw new Error(
      `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Hash a value for verification (not reversible)
 * Useful for checking API key fingerprints
 */
export function hashValue(value: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Generate a random API key preview (first 4 characters)
 */
export function getKeyPreview(apiKey: string): string {
  return apiKey.substring(0, 4).toUpperCase()
}

/**
 * Validate master key format
 */
export function isValidMasterKey(key: string): boolean {
  // Should be 64 character hex string (32 bytes)
  return /^[a-f0-9]{64}$/i.test(key)
}
