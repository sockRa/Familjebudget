## 2024-05-22 - Index Performance on Complex OR Queries
**Learning:** Adding an index on a foreign key column (`overrides_expense_id`) actually slowed down a complex query involving multiple `OR` conditions and `IS NULL` checks by ~15%, whereas a simple index on the filtering column (`year_month`) improved performance by ~30%.
**Action:** When optimizing complex queries with `OR` clauses in SQLite, benchmark incrementally. Don't assume all foreign keys need indexing, especially if used primarily for `IS NULL` checks or if the query optimizer might be misled by multiple available indexes.
