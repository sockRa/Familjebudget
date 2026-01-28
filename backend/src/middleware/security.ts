import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add security headers to responses
 * and remove potentially sensitive headers.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Hide server technology information
  res.removeHeader('X-Powered-By');

  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
  );

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};
