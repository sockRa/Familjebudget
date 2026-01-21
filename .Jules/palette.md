## 2024-05-22 - Form Accessibility Pattern
**Learning:** Forms in this application consistently lack explicit `htmlFor` + `id` associations and `aria-labels` on icon-only buttons. This forces users to rely on visual layout for context, which fails for screen readers.
**Action:** When touching any form component, immediately audit for `htmlFor`/`id` pairs and ensure all non-text buttons have `aria-label` or `title`.

## 2026-01-21 - Async Form Interaction Pattern
**Learning:** Simple forms like category creation lacked interaction feedback, leading to uncertainty during network delays. Coupling accessibility fixes (labels) with interaction fixes (loading states, disabled buttons) provides a complete UX win.
**Action:** When fixing form accessibility, always check for and add `isSubmitting` states and disabled attributes to submit buttons and inputs.
