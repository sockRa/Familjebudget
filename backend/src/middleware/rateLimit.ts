import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    max: number;       // Max requests per window
    message?: string;  // Error message
}

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const ipRecords = new Map<string, RateLimitRecord>();

// Clean up old records periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRecords.entries()) {
        if (record.resetTime < now) {
            ipRecords.delete(ip);
        }
    }
}, 60000); // Clean every minute

export function rateLimit(options: RateLimitOptions) {
    const { windowMs, max, message = 'För många förfrågningar. Försök igen senare.' } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        let record = ipRecords.get(ip);

        if (!record || record.resetTime < now) {
            // First request or window expired
            record = {
                count: 1,
                resetTime: now + windowMs,
            };
            ipRecords.set(ip, record);
            return next();
        }

        record.count++;

        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({
                error: message,
                retryAfter,
            });
        }

        next();
    };
}

// Preset configurations
export const rateLimits = {
    // Standard API limit: 100 requests per minute
    standard: rateLimit({
        windowMs: 60 * 1000,
        max: 100,
    }),

    // Strict limit for creation/mutation: 30 requests per minute
    strict: rateLimit({
        windowMs: 60 * 1000,
        max: 30,
    }),

    // Very strict for sensitive operations: 10 requests per minute
    veryStrict: rateLimit({
        windowMs: 60 * 1000,
        max: 10,
    }),
};

export default rateLimit;
