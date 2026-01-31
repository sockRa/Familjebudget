## 2024-05-22 - Form Accessibility Pattern
**Learning:** Forms in this application consistently lack explicit `htmlFor` + `id` associations and `aria-labels` on icon-only buttons. This forces users to rely on visual layout for context, which fails for screen readers.
**Action:** When touching any form component, immediately audit for `htmlFor`/`id` pairs and ensure all non-text buttons have `aria-label` or `title`.

## 2025-01-22 - Async List Operations Feedback
**Learning:** Deleting items from a list (like categories) without immediate visual feedback (loading state or optimistic update) leaves users unsure if the action registered, especially on slower connections.
**Action:** Implement per-item loading states (e.g., replacing the delete icon with a spinner) for list operations.

## 2025-05-15 - Loading State Accessibility
**Learning:** Replacing button text with a loading spinner removes its accessible name, making the button unidentifiable to screen readers (e.g., "unlabeled button").
**Action:** Always add `aria-label="Loading..."` or similar context when replacing text content with a purely visual indicator like a spinner.

## 2025-05-22 - Async Confirmation Dialog Feedback
**Learning:** Confirmation dialogs often trigger async operations. Closing them immediately leaves the user uncertain if the action succeeded.
**Action:** Update `ConfirmDialog` to accept Promise-returning callbacks and show a loading state within the dialog itself, keeping it open until the promise resolves.

## 2025-05-24 - Settings Form Feedback
**Learning:** The settings form lacked semantic structure (`<form>`) and visual feedback (loading/success), making it unclear if changes were saved.
**Action:** Wrap inputs in `<form>`, implement `htmlFor`/`id` association, and add explicit loading/success states to the submit button for all setting/configuration panels.

## 2025-05-25 - Implicit Labels in Tables/Lists
**Learning:** Inputs inside list items (like checkboxes or amount fields) often lack visible labels for design reasons, making them inaccessible to screen readers who just hear "checkbox" or "edit text".
**Action:** Use `aria-label` constructed from the row's context (e.g., "Amount for [Item Name]") to provide invisible but accessible names for these inputs.
