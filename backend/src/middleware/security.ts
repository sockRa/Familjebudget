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

  // Strict Transport Security (HSTS)
  // Max-age: 1 year. includeSubDomains ensures all subdomains are also HTTPS only.
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy (CSP)
  // Restricts sources for content.
  // default-src 'self': only allow content from same origin
  // img-src 'self' data:: allow images from same origin and data URIs
  // script-src 'self' 'unsafe-inline': allow scripts from same origin and inline scripts
  // style-src 'self' 'unsafe-inline': allow styles from same origin and inline styles
  // object-src 'none': disallow plugins like Flash/Java
  // frame-ancestors 'none': prevent embedding
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none';");

  // Permissions Policy
  // Disable features not used by the application to protect privacy
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  // Cross Domain Policies
  // Prevent Adobe Flash/PDF from loading data
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Hide server technology information
  res.removeHeader('X-Powered-By');

  next();
};
