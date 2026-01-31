## 2024-05-22 - Index Performance on Complex OR Queries
**Learning:** Adding an index on a foreign key column (`overrides_expense_id`) actually slowed down a complex query involving multiple `OR` conditions and `IS NULL` checks by ~15%, whereas a simple index on the filtering column (`year_month`) improved performance by ~30%.
**Action:** When optimizing complex queries with `OR` clauses in SQLite, benchmark incrementally. Don't assume all foreign keys need indexing, especially if used primarily for `IS NULL` checks or if the query optimizer might be misled by multiple available indexes.

## 2025-01-28 - Removing State Dependencies from Event Handlers
**Learning:** Passing full objects (like `Expense`) to handlers instead of IDs allows removing the parent state array (`expenses`) from `useCallback` dependencies. This stabilizes the handler references, ensuring `React.memo` effectively skips re-renders for unchanged list items.
**Action:** When optimizing lists with `React.memo`, refactor child-to-parent callbacks to pass necessary data directly, avoiding lookups in parent state that force handler recreation on every state change.

## 2025-01-28 - Explicit Naming for Pre-Filtered Optimizations
**Learning:** Optimizing by removing redundant filters can trigger "breaking change" or "safety" concerns if the function's contract isn't explicit. Reviewers worry about callers passing unfiltered data.
**Action:** When removing internal safeguards (like filters) for performance, rename the function (e.g., `calculateMonthlyOverviewPreFiltered`) to explicitly state the input requirements in the name, preventing misuse and satisfying safety concerns.

## 2025-05-22 - Test Isolation with Persistent SQLite
**Learning:** `vitest` with `singleFork: true` and `isolate: true` reloads modules but shares the underlying filesystem. Persistent SQLite databases (file-based) are NOT reset between test files unless explicitly handled. `db.test.ts` failing after other tests confirmed that the shared DB file state persists across test files.
**Action:** When testing with file-based SQLite, ensure `beforeEach` hooks rigorously clean the shared state (e.g., deleting all data) or use in-memory databases (`:memory:`) if possible to prevent inter-test interference.

## 2025-05-22 - Splitting Static and Dynamic Data Loading
**Learning:** Fetching static data (like categories) alongside dynamic data (like monthly expenses) in a single `loadData` function causes unnecessary API calls when the dynamic parameter (month) changes.
**Action:** Split data loading into distinct functions (`loadCategories`, `loadMonthData`) and use separate `useEffect` hooks or combined callbacks (`loadAllData`) to optimize network usage without sacrificing data consistency.
