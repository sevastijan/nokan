/**
 * Nokan Client SDK - Error Classes
 */

/**
 * Base error class for Nokan API errors
 */
export class NokanError extends Error {
    public readonly statusCode?: number;
    public readonly code?: string;

    constructor(message: string, statusCode?: number, code?: string) {
        super(message);
        this.name = 'NokanError';
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, NokanError.prototype);
    }
}

/**
 * Thrown when authentication fails (invalid/expired token)
 */
export class AuthenticationError extends NokanError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Thrown when the token doesn't have required permission
 */
export class PermissionError extends NokanError {
    public readonly requiredPermission?: string;

    constructor(message: string = 'Permission denied', requiredPermission?: string) {
        super(message, 403, 'PERMISSION_ERROR');
        this.name = 'PermissionError';
        this.requiredPermission = requiredPermission;
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends NokanError {
    public readonly retryAfter?: number;
    public readonly resetAt?: Date;

    constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
        if (retryAfter) {
            this.resetAt = new Date(Date.now() + retryAfter * 1000);
        }
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * Thrown when requested resource is not found
 */
export class NotFoundError extends NokanError {
    public readonly resourceType?: string;
    public readonly resourceId?: string;

    constructor(message: string = 'Resource not found', resourceType?: string, resourceId?: string) {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends NokanError {
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Thrown when request times out
 */
export class TimeoutError extends NokanError {
    constructor(message: string = 'Request timeout') {
        super(message, 408, 'TIMEOUT');
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}

/**
 * Thrown when network connection fails
 */
export class NetworkError extends NokanError {
    constructor(message: string = 'Network error') {
        super(message, undefined, 'NETWORK_ERROR');
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}
