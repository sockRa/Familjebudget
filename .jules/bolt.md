## 2024-05-22 - Index Performance on Complex OR Queries
**Learning:** Adding an index on a foreign key column (`overrides_expense_id`) actually slowed down a complex query involving multiple `OR` conditions and `IS NULL` checks by ~15%, whereas a simple index on the filtering column (`year_month`) improved performance by ~30%.
**Action:** When optimizing complex queries with `OR` clauses in SQLite, benchmark incrementally. Don't assume all foreign keys need indexing, especially if used primarily for `IS NULL` checks or if the query optimizer might be misled by multiple available indexes.

## 2024-05-23 - React Memoization and Callback Dependencies
**Learning:** React components wrapped in `React.memo` will still re-render if their callback props (e.g., `onDelete`) are recreated on every render. This happens if the callback depends on a changing state (like a list of items).
**Action:** To stabilize callbacks for list items, pass the item object itself to the callback from the child component. This removes the need for the parent callback to depend on the list state to find the item, breaking the dependency cycle and preventing O(N) re-renders.
