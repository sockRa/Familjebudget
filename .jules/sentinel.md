# Sentinel's Security Journal

## 2024-05-22 - Unused Security Middleware
**Vulnerability:** Rate limiting middleware was fully implemented in `backend/src/middleware/rateLimit.ts` but never imported or used in `backend/src/index.ts`.
**Learning:** The presence of security code does not guarantee its execution. In this case, the feature was likely built but the integration step was missed.
**Prevention:** Verify security controls with integration tests (like the `verify_rate_limit.ts` script I used) rather than assuming code existence means protection.

## 2024-05-24 - Unbounded Statistics Loop
**Vulnerability:** The `/api/statistics/monthly` endpoint accepted arbitrary integer ranges for `start` and `end`, allowing a loop to run for millions of iterations if inputs like `1` and `99999999` were provided.
**Learning:** Manual parsing of query parameters (`parseInt`) often skips validation steps that schema libraries (like Zod) enforce automatically.
**Prevention:** Use standardized validation schemas for all query parameters, especially those driving loop logic or database queries.

## 2024-05-25 - Type Coercion Bypass in Filters
**Vulnerability:** Passing `year_month=invalid` to expenses API caused `parseInt` to return `NaN`. The database logic `if (!yearMonth)` treated `NaN` as "no filter", returning all records instead of an error or empty list.
**Learning:** Relying on JavaScript's truthiness/falsiness for control flow with user input is dangerous. `NaN` is falsy but is not `undefined` or `null`.
**Prevention:** Strictly validate input types and values using middleware (Zod) before they reach route handlers. Do not rely on manual parsing inside handlers.
