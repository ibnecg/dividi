# Dividi Design System (DESIGN.md)

This document outlines the core design principles, tokens, and component architecture for the Dividi open-source donation management system. All future UI development must adhere to these guidelines to ensure consistency, accessibility, and maintainability.

## 1. Design Philosophy

- **Simplicity first:** The UI should be minimal, avoiding unnecessary visual noise (e.g., heavy drop shadows, complex gradients, or extraneous borders).
- **High contrast:** We rely on a stark black and white aesthetic. This guarantees maximum readability and accessibility, focusing the user's attention purely on the content and actions.
- **Usability over flair:** Interactive elements must have clear focus states (rings) and obvious hover states. 

## 2. Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **Component Architecture:** Radix-inspired primitives using `class-variance-authority` (CVA) and `tailwind-merge`.
- **Icons:** `lucide-react` (clean, consistent line-art SVG icons).

## 3. Design Tokens (Tailwind v4)

Our tokens are defined as CSS variables in `src/app/globals.css` and exposed to Tailwind via the `@theme inline` directive. Do **not** use arbitrary hex codes (e.g., `bg-[#123123]`) in the codebase. Always use the semantic tokens.

### Colors

| Token | Light Theme | Dark Theme | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#ffffff` | `#000000` | Main application background |
| `foreground` | `#000000` | `#ffffff` | Default text color |
| `primary` | `#000000` | `#ffffff` | Primary buttons, active states |
| `primary-foreground` | `#ffffff` | `#000000` | Text on primary backgrounds |
| `muted` | `#f4f4f5` (zinc-100) | `#27272a` (zinc-800) | Secondary buttons, subtle backgrounds |
| `muted-foreground` | `#71717a` (zinc-500) | `#a1a1aa` (zinc-400) | Secondary text, placeholder text |
| `border` | `#e4e4e7` (zinc-200) | `#27272a` (zinc-800) | Borders for inputs, cards, dividers |
| `ring` | `#000000` | `#ffffff` | Keyboard focus indicators |
| `destructive` | `#ef4444` (red-500) | `#7f1d1d` (red-900) | Error states, dangerous actions (delete) |

### Radii

- `radius` base is set to `0.5rem` (8px). 
- Use standard tailwind rounding classes (`rounded-md`, `rounded-lg`) which map to our CSS variables.

## 4. Component Architecture

We use a variant-driven component model. All reusable UI elements belong in `src/components/ui/`. 

### The `cn` Utility
Always use the `cn` utility (from `src/lib/utils.ts`) to merge Tailwind classes, especially when building reusable components. It safely resolves conflicting Tailwind classes.

```tsx
import { cn } from "@/lib/utils"

export function MyComponent({ className }: { className?: string }) {
  return <div className={cn("base-classes here", className)} />
}
```

### Building Components with CVA
For components with multiple visual variants (like Buttons or Badges), use `cva` (Class Variance Authority).

- **Base styles:** Core styles that apply to all variants (padding, fonts, transitions, focus rings).
- **Variants:** Semantic variations (e.g., `default`, `outline`, `ghost`, `destructive`).
- **Sizes:** Standardized sizing scales (e.g., `sm`, `default`, `lg`, `icon`).

### Accessibility (a11y)
- **Focus Rings:** Ensure all interactive elements include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- **Forms:** Input components must support `aria-invalid` and `aria-describedby` to link to validation error messages natively. Always wrap inputs with a `<Label>`.

## 5. Do's and Don'ts

### ✅ Do
- Use `text-muted-foreground` for secondary information to establish visual hierarchy.
- Use the `Card` compound components (`Card`, `CardHeader`, `CardContent`, `CardFooter`) to encapsulate related information (e.g., a donation tier).
- Rely on spacing primitives (`space-y-4`, `gap-6`) rather than arbitrary margins for consistent rhythm.
- Test components in both Light and Dark mode.

### ❌ Don't
- Don't use brand colors or bright hues outside of `destructive` states. Stick to the black and white palette.
- Don't hardcode colors using standard Tailwind color scales (e.g., `text-zinc-500`). Use semantic tokens (`text-muted-foreground`).
- Don't build complex shadow elevations. The design relies on flat backgrounds and simple 1px borders (`border border-border`) for separation.
