# Reference Guide

## Layout and Spacing

- Default to 8px rhythm for spacing and sizing decisions
- Use clear section separation (`py-8`, `py-12`, `gap-6`, `gap-8`)
- Keep line length readable with sensible max widths
- Maintain predictable vertical rhythm between headings, text, and actions

## Typography and Hierarchy

- Establish clear heading levels with visible contrast
- Keep body text legible (`text-sm` or `text-base` with adequate line height)
- Use emphasis sparingly to avoid visual noise
- Keep CTA prominence consistent across similar screens

## Accessibility Baseline

- Use semantic tags (`header`, `main`, `section`, `nav`, `button`, `form`, `label`)
- Ensure interactive elements are keyboard reachable and visibly focused
- Add ARIA only when semantics alone are insufficient
- Prefer explicit labels and helper text for form controls
- Verify color contrast for text, borders, and focus states

## React Architecture Heuristics

- Start local state; promote to context only when shared across distant nodes
- Keep business logic in hooks or container components
- Keep presentational components mostly props-in/UI-out
- Move repeated view patterns into shared components early

## Tailwind Practices

- Group classes logically: layout -> spacing -> typography -> color -> state
- Reuse class patterns via shared components before introducing abstraction utilities
- Avoid hardcoded pixel values unless design requirements demand it
- Keep breakpoint usage intentional (`sm`, `md`, `lg`) and mobile-first

## Next.js Conventions (If Relevant)

- Keep route-level data concerns near route files
- Keep reusable UI independent from route framework details
- Separate server/data boundaries from purely visual components

## Quality Gate Before Final Output

- UI is visually coherent and aligned
- Spacing follows the 8px system
- Components are reusable and reasonably decomposed
- Accessibility semantics and keyboard flow are covered
- Explanation includes concise UX/design rationale
