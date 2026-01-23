## 2024-05-22 - Form Accessibility Pattern
**Learning:** Forms in this application consistently lack explicit `htmlFor` + `id` associations and `aria-labels` on icon-only buttons. This forces users to rely on visual layout for context, which fails for screen readers.
**Action:** When touching any form component, immediately audit for `htmlFor`/`id` pairs and ensure all non-text buttons have `aria-label` or `title`.

## 2024-05-24 - Native Form Submission
**Learning:** Simple input-plus-button patterns (like adding a category) are often implemented as loose divs with onClick handlers. Converting these to semantic `<form>` elements provides "Enter to submit" functionality for free, benefiting both keyboard users and power users.
**Action:** Always wrap input+submit groups in a `<form>` tag and use `type="submit"` on the button instead of manual keydown handlers.
