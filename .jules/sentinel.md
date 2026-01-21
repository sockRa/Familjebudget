# Sentinel's Security Journal

## 2024-05-22 - Unused Security Middleware
**Vulnerability:** Rate limiting middleware was fully implemented in `backend/src/middleware/rateLimit.ts` but never imported or used in `backend/src/index.ts`.
**Learning:** The presence of security code does not guarantee its execution. In this case, the feature was likely built but the integration step was missed.
**Prevention:** Verify security controls with integration tests (like the `verify_rate_limit.ts` script I used) rather than assuming code existence means protection.

## 2024-05-24 - Unbounded Statistics Loop
**Vulnerability:** The `/api/statistics/monthly` endpoint accepted arbitrary integer ranges for `start` and `end`, allowing a loop to run for millions of iterations if inputs like `1` and `99999999` were provided.
**Learning:** Manual parsing of query parameters (`parseInt`) often skips validation steps that schema libraries (like Zod) enforce automatically.
**Prevention:** Use standardized validation schemas for all query parameters, especially those driving loop logic or database queries.

## 2024-05-25 - Inconsistent Input Validation
**Vulnerability:** Several API routes (`incomes`, `expenses`, `categories`) manually parsed `parseInt` for IDs and date parameters, leading to potential type mismatch errors or silent failures (returning 200 OK for invalid inputs).
**Learning:** Manual validation is error-prone and inconsistent. Relying on `parseInt` alone does not strictly validate the input format (e.g., length of date string).
**Prevention:** Use standardized Zod schemas (`IdParamSchema`, `YearMonthQuerySchema`) and middleware (`validateParams`, `validateQuery`) to enforce strict type checking and consistent error responses (400 Bad Request) across the API.
