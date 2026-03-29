# Examples

## Example 1: Reusable presentational component

```tsx
type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </article>
  );
}
```

Why this is good:
- Clear responsibility, reusable API, and consistent spacing
- Strong visual hierarchy (label -> value -> hint)

## Example 2: Container vs presentational split

```tsx
// hooks/useProjectFilters.ts
import { useMemo, useState } from "react";

export function useProjectFilters(items: { id: string; name: string }[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  return { query, setQuery, filtered };
}
```

```tsx
// components/ProjectList.tsx
type Project = { id: string; name: string };

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li key={project.id} className="rounded-lg border border-slate-200 p-4">
          {project.name}
        </li>
      ))}
    </ul>
  );
}
```

Why this is good:
- Logic is isolated in a hook
- UI component stays simple and reusable

## Example 3: Accessible action area

```tsx
export function PageActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        New Project
      </button>
    </div>
  );
}
```

Why this is good:
- Mobile-first layout with responsive enhancement
- Clear focus treatment for keyboard users
- Consistent button spacing and typography
