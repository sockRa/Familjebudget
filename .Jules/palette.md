## 2024-05-22 - Form Accessibility Pattern
**Learning:** Forms in this application consistently lack explicit `htmlFor` + `id` associations and `aria-labels` on icon-only buttons. This forces users to rely on visual layout for context, which fails for screen readers.
**Action:** When touching any form component, immediately audit for `htmlFor`/`id` pairs and ensure all non-text buttons have `aria-label` or `title`.

## 2025-01-22 - Async List Operations Feedback
**Learning:** Deleting items from a list (like categories) without immediate visual feedback (loading state or optimistic update) leaves users unsure if the action registered, especially on slower connections.
**Action:** Implement per-item loading states (e.g., replacing the delete icon with a spinner) for list operations.

## 2025-05-15 - Loading State Accessibility
**Learning:** Replacing button text with a loading spinner removes its accessible name, making the button unidentifiable to screen readers (e.g., "unlabeled button").
**Action:** Always add `aria-label="Loading..."` or similar context when replacing text content with a purely visual indicator like a spinner.
