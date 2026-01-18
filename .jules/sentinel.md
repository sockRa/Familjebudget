# Sentinel's Security Journal

## 2024-05-22 - Unused Security Middleware
**Vulnerability:** Rate limiting middleware was fully implemented in `backend/src/middleware/rateLimit.ts` but never imported or used in `backend/src/index.ts`.
**Learning:** The presence of security code does not guarantee its execution. In this case, the feature was likely built but the integration step was missed.
**Prevention:** Verify security controls with integration tests (like the `verify_rate_limit.ts` script I used) rather than assuming code existence means protection.
