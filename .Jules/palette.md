## 2024-05-22 - Form Accessibility Pattern
**Learning:** Forms in this application consistently lack explicit `htmlFor` + `id` associations and `aria-labels` on icon-only buttons. This forces users to rely on visual layout for context, which fails for screen readers.
**Action:** When touching any form component, immediately audit for `htmlFor`/`id` pairs and ensure all non-text buttons have `aria-label` or `title`.
