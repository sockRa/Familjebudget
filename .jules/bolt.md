## 2024-05-22 - Index Performance on Complex OR Queries
**Learning:** Adding an index on a foreign key column (`overrides_expense_id`) actually slowed down a complex query involving multiple `OR` conditions and `IS NULL` checks by ~15%, whereas a simple index on the filtering column (`year_month`) improved performance by ~30%.
**Action:** When optimizing complex queries with `OR` clauses in SQLite, benchmark incrementally. Don't assume all foreign keys need indexing, especially if used primarily for `IS NULL` checks or if the query optimizer might be misled by multiple available indexes.

## 2025-01-28 - Removing State Dependencies from Event Handlers
**Learning:** Passing full objects (like `Expense`) to handlers instead of IDs allows removing the parent state array (`expenses`) from `useCallback` dependencies. This stabilizes the handler references, ensuring `React.memo` effectively skips re-renders for unchanged list items.
**Action:** When optimizing lists with `React.memo`, refactor child-to-parent callbacks to pass necessary data directly, avoiding lookups in parent state that force handler recreation on every state change.
