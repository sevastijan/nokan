/**
 * Token generation and validation utilities for Public API
 */

import crypto from 'crypto';

const TOKEN_PREFIX = 'nkn_live_';
const TOKEN_PAYLOAD_BYTES = 24; // 32 chars in base64url

/**
 * Simple CRC32 implementation for token checksum
 */
function crc32(str: string): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Generate a new API token
 * Format: nkn_live_[32 chars base64url]_[4 char checksum]
 *
 * @returns Object with token (full), hash (SHA256), and prefix (for display)
 */
export function generateApiToken(): { token: string; hash: string; prefix: string } {
    // Generate random payload
    const payload = crypto.randomBytes(TOKEN_PAYLOAD_BYTES).toString('base64url');

    // Calculate checksum
    const checksum = crc32(payload).toString(16).padStart(8, '0').slice(0, 4);

    // Assemble token
    const token = `${TOKEN_PREFIX}${payload}_${checksum}`;

    // Hash for storage
    const hash = hashToken(token);

    // Prefix for identification (show in UI)
    const prefix = token.slice(0, 16);

    return { token, hash, prefix };
}

/**
 * Hash a token using SHA256
 * This is what we store in the database
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate token format before attempting database lookup
 * This is a quick check to reject obviously invalid tokens
 */
export function validateTokenFormat(token: string): boolean {
    // Must start with our prefix
    if (!token.startsWith(TOKEN_PREFIX)) {
        return false;
    }

    // Split into parts: nkn, live, payload, checksum
    const withoutPrefix = token.slice(TOKEN_PREFIX.length);
    const lastUnderscore = withoutPrefix.lastIndexOf('_');

    if (lastUnderscore === -1) {
        return false;
    }

    const payload = withoutPrefix.slice(0, lastUnderscore);
    const checksum = withoutPrefix.slice(lastUnderscore + 1);

    // Checksum should be 4 hex chars
    if (checksum.length !== 4 || !/^[0-9a-f]{4}$/i.test(checksum)) {
        return false;
    }

    // Verify checksum
    const expectedChecksum = crc32(payload).toString(16).padStart(8, '0').slice(0, 4);
    return checksum.toLowerCase() === expectedChecksum.toLowerCase();
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer nkn_live_xxx"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
        return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice(7).trim();
}

/**
 * Mask token for display (show only prefix)
 * Example: nkn_live_abc... -> nkn_live_abc***
 */
export function maskToken(token: string): string {
    if (token.length <= 16) {
        return token;
    }
    return token.slice(0, 16) + '***';
}
