# AUM ERP — Frontend Documentation

This file tracks architectural decisions, folder structure, and the "why" behind how the frontend is built. Update it as the project grows — treat it as the source of truth for anyone (including future you) joining the codebase.

**Stack:** Next.js (App Router) · TypeScript · MUI Joy UI

---

## 1. Project Structure

```
aum-erp-frontend/
├── app/
│   ├── (dashboard)/                  ← route group, NOT part of the URL
│   │   ├── layout.tsx                ← sidebar + content shell, shared by all 4 pages
│   │   ├── dashboard/page.tsx         → /dashboard
│   │   ├── enquiries/page.tsx         → /enquiries
│   │   ├── quotations/page.tsx        → /quotations
│   │   └── feasibility-study/page.tsx → /feasibility-study
│   ├── layout.tsx                    ← root layout, wraps EVERYTHING (theme provider)
│   ├── page.tsx                      ← "/" → redirects to /dashboard (placeholder until login exists)
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               ← main sidebar shell
│   │   ├── Sidebar.styles.ts         ← styled() components for sidebar (client-only)
│   │   ├── SidebarItem.tsx           ← single nav link, handles active state
│   │   └── UserFooter.tsx            ← user avatar/name block at sidebar bottom
│   └── ui/
│       ├── PageHeading.tsx           ← reusable page title + optional action button
│       ├── DataTable.tsx             ← generic table, takes columns + data
│       └── StatusBadge.tsx           ← colored status pill, maps status text → color
│
├── constants/
│   └── navigation.ts                 ← single source of truth for the 4 sidebar items
│
├── services/
│   └── api_service.ts                ← all API calls live here (currently dummy data)
│
└── types/
    ├── navigation.ts                 ← NavItem type
    ├── table.ts                      ← Column<T>, DataTableProps<T> generic types
    └── entities.ts                   ← Enquiry, Quotation, FeasibilityStudy types
```

---

## 2. Why a Route Group — `app/(dashboard)/`

**Problem:** Enquiries, Quotations, and Feasibility Study pages all need the same sidebar. Login (built later) must NOT have a sidebar.

**Bad options ruled out:**

- Copy-pasting `<Sidebar />` into every page → duplication, hard to maintain.
- Putting `<Sidebar />` in the root `app/layout.tsx` → wraps _every_ route, including the future login page, which shouldn't have a sidebar.

**Solution — route groups:** wrapping a folder name in parentheses, e.g. `(dashboard)`, tells Next.js: _"group these routes and let them share a layout, but don't add this folder name to the URL."_

```
app/(dashboard)/dashboard/page.tsx   →   /dashboard   (NOT /dashboard/dashboard)
app/(dashboard)/enquiries/page.tsx   →   /enquiries
```

A `layout.tsx` placed directly inside `(dashboard)/` automatically wraps every page nested under it. The sidebar renders once; only the page content swaps when navigating between routes. Routes outside `(dashboard)/` (e.g. a future `app/login/page.tsx`) never see this layout.

---

## 3. Client vs Server Components

Next.js App Router defaults every component to a **Server Component** (renders on the server, ships no JS to the browser unless needed). Some things only work in the browser and require the `"use client"` directive as the **first line of the file**:

| Needs `"use client"`                                                                     | Why                                           |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| Any file calling `styled()` from `@mui/joy/styles`                                       | Uses React Context + Emotion, browser-only    |
| Any file using hooks (`useState`, `useEffect`, `usePathname`, etc.)                      | Hooks only work in client-rendered components |
| Any file with interactive handlers driving local state (`onClick` that calls `setState`) | Needs the browser's event loop                |

**Rule of thumb used in this project:** plain components that just import and render JSX (no hooks, no `styled()`) stay as Server Components by default. Add `"use client"` only when one of the triggers above applies.

Files in this project that need it: `Sidebar.styles.ts`, `SidebarItem.tsx`, `DataTable.tsx`, and every `page.tsx` under `(dashboard)/` that fetches data with `useEffect`.

---

## 4. Sidebar Architecture

- **`constants/navigation.ts`** — single array (`NAV_ITEMS`) describing all 4 sidebar items (key, label, href, icon, badge count). `Sidebar.tsx` simply maps over this array — adding/removing/reordering nav items means editing one file, not JSX in multiple places.
- **`Sidebar.tsx`** — composes brand section, nav list, and `UserFooter`. Server Component (just renders, no hooks of its own).
- **`SidebarItem.tsx`** — one nav link. Uses `usePathname()` to detect the active route and highlight it. Requires `"use client"`.
- **`Sidebar.styles.ts`** — all `styled()` definitions for the sidebar (container, brand section, nav section, footer). Requires `"use client"`. No inline styles, no hardcoded colors — uses theme tokens (`theme.palette.neutral[900]`, etc.) throughout.
- **`UserFooter.tsx`** — static placeholder for now (`Arjun Kumar / Sales Manager`). Once login/auth exists, swap the hardcoded values for real user data from an auth context.

---

## 5. PageHeading Component

`components/ui/PageHeading.tsx` — reusable heading used at the top of every page.

```typescript
interface PageHeadingProps {
  title: string;
  subtitle?: string;
  actionLabel?: string; // e.g. "New Enquiry" — if omitted, no button renders
  onActionClick?: () => void;
}
```

- Dashboard passes only `title`/`subtitle` → no button shows.
- Enquiries/Quotations/Feasibility Study pass `actionLabel` (e.g. `"New Enquiry"`) → renders a button with a `+` icon (`AddOutlinedIcon`, Joy UI's `startDecorator`).
- Conditional rendering (`{actionLabel ? (...) : null}`) means one component serves both cases — no separate "heading with button" vs "heading without" component needed.

---

## 6. Generic DataTable

**Goal:** one table component, reused across Enquiries / Quotations / Feasibility Study, driven entirely by `columns` + `data` props — no per-page table markup duplication.

### Types — `types/table.ts`

```typescript
export type ColumnType = "text" | "badge" | "link";

export interface Column<T> {
  key: keyof T; // only allows keys that actually exist on T — catches typos at compile time
  header: string;
  type?: ColumnType; // defaults to "text"
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  onRowAction?: (row: T) => void;
  rowActionLabel?: string; // e.g. "Open →" or "Edit →"
}
```

Currently supports `text` and `badge` column types only (kept intentionally simple). `link`/custom-render-per-column was considered and deferred — can be added later without a rewrite.

### Why `<T extends Record<string, unknown>>` on `DataTable`

```typescript
export default function DataTable<T extends Record<string, unknown>>({ ... }: DataTableProps<T>) {
```

Two separate things happening here:

1. **`<T>` makes the component generic.** `T` is a placeholder filled in at the call site. When called with `data={enquiries}`, TypeScript infers `T = Enquiry`, and every `T` in `DataTableProps<T>` becomes `Enquiry` for that call — so `getRowKey: (row: Enquiry) => string` is type-checked against the real `Enquiry` shape. This is what lets ONE component serve `Enquiry[]`, `Quotation[]`, and `FeasibilityStudy[]` with full type safety, instead of writing three near-identical table components.

2. **`extends Record<string, unknown>` is a constraint.** Inside `DataTable`, the code does `row[col.key]` — object property access by dynamic key. TypeScript needs proof that `T` is "indexable by a string key" before allowing that line to compile. `Record<string, unknown>` means "an object with string keys and any value type." Without this constraint, TypeScript would reject `row[col.key]` because a fully unconstrained `T` could be a `number` or `string`, which can't be indexed that way.
   - ✅ `DataTable<Enquiry>` — allowed, `Enquiry` is object-shaped
   - ❌ `DataTable<number>` — rejected at compile time, not object-shaped

### `StatusBadge.tsx`

Maps a status string (e.g. `"Approved"`, `"Pending"`, `"Conditional"`) to a Joy UI color token via a lookup object (`STATUS_COLOR_MAP`). Unknown statuses fall back to `"neutral"` so new backend statuses don't crash the UI — they just render in a neutral color until explicitly added to the map.

---

## 7. Dummy API Layer — `services/api_service.ts`

**Goal:** components never know or care whether data is fake or real. All data access goes through named functions (`getEnquiries()`, `getQuotations()`, `getFeasibilityStudies()`); swapping dummy data for real backend calls later means editing only this file, not any component.

```typescript
function simulateDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export async function getEnquiries(): Promise<Enquiry[]> {
  return simulateDelay(DUMMY_ENQUIRIES);
}
```

- `simulateDelay` fakes ~500ms of network latency, specifically so loading states are visible and testable during development (otherwise the spinner flashes for 0ms and you can never confirm it actually works).
- When the real `aum-erp-backend` is ready, each function's body becomes a real `fetch(...)` call. Function signatures (return types, async-ness) are designed to stay identical, so calling pages require zero changes.

---

## 8. Page Pattern (Enquiries / Quotations / Feasibility Study)

All three follow the same shape — a Client Component that fetches on mount and renders search + `DataTable`:

```typescript
"use client";

const COLUMNS: Column<Enquiry>[] = [ /* ... */ ];

export default function EnquiriesPage() {
  const [data, setData] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getEnquiries()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);   // empty dependency array = runs once when the page mounts

  const filtered = data.filter(/* match against searchTerm */);

  return (
    <>
      <PageHeading title="..." subtitle={`${data.length} total records`} actionLabel="New ..." />
      <Input placeholder="Search..." value={searchTerm} onChange={...} />
      <DataTable columns={COLUMNS} data={filtered} isLoading={isLoading} getRowKey={(row) => row.id} onRowAction={...} />
    </>
  );
}
```

**Why client-side fetch (`useEffect`) instead of a Server Component fetch:** chosen deliberately for production-readiness, not just convenience. Reasons:

- Live search filtering as the user types requires client state regardless.
- Future actions (creating a new record, then refreshing the table without a full page reload) need client-side state management.
- Auth tokens, loading states, error handling, and retries are naturally client concerns once hitting a real backend.
- Committing to one pattern now avoids mixing Server + Client fetch approaches later.

**Dashboard page is intentionally different** — it does not call `api_service.ts` or render `DataTable`. Per current requirements, only the 3 list pages (Enquiries, Quotations, Feasibility Study) are wired to the dummy API.

---

## 9. Coding Conventions (carried over from existing project standards)

- **No inline styles** — all styling lives in dedicated `*.styles.ts` files using Joy UI's `styled()`.
- **No hardcoded colors** — always use theme tokens (`theme.palette.neutral[900]`, `"primary.500"`, etc.), never raw hex codes in component files.
- **Reuse over duplication** — one `DataTable`, one `PageHeading`, one `StatusBadge` — driven by props/config rather than copy-pasted per page.
- **`@/` import alias** — used throughout (`@/components/...`, `@/types/...`, `@/services/...`). Relies on `tsconfig.json` having `"@/*": ["./*"]` under `compilerOptions.paths` (the `create-next-app` default).

---

## 10. Known Gotchas / Debugging Notes

### "Attempted to call styled() from the server but styled is on the client"

**Cause:** a file calling `styled()` (e.g. `Sidebar.styles.ts`) is missing `"use client"` as its first line, so Next.js tries to evaluate it as a Server Component.
**Fix:** add `"use client";` to the top of the file.

### Page stuck on loading spinner forever, no console errors

**Cause (in this project's case):** the dev server was accessed via a LAN IP (e.g. `http://192.168.1.36:3000`) instead of `http://localhost:3000`. Next.js's Hot Module Reload WebSocket gets blocked for non-localhost origins by default, which silently prevents client-side JS (and therefore `"use client"` component logic like `useEffect`) from running in that browser tab — even though the server itself responds fine (`GET ... 200`).
**Fix:** access the app via `http://localhost:3000` on the machine running `npm run dev`. To support LAN/device testing instead, add to `next.config.ts`:

```typescript
const nextConfig = {
  allowedDevOrigins: ["192.168.1.36"], // your LAN IP
};
export default nextConfig;
```

**Diagnostic technique used:** added `console.log` both inside `useEffect` and directly in the component body (outside any hook). Logs appearing in the **terminal** but not the **browser F12 console** is the signature of this exact bug — it means the server-side pre-render ran, but client-side hydration/execution never completed.

### Stale build cache (Windows/PowerShell)

If changes don't seem to take effect after editing a file:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

Note: PowerShell does NOT support CMD syntax like `rmdir /s /q .next` — use `Remove-Item -Recurse -Force` instead.

---

## 11. Not Yet Built (Future Work)

- Login page + auth flow — `app/page.tsx` currently just redirects straight to `/dashboard` as a placeholder.
- `UserFooter.tsx` — hardcoded user data, needs wiring to real auth context.
- Replacing `services/api_service.ts` dummy functions with real `fetch()` calls to `aum-erp-backend`.
- `DataTable` column types beyond `text`/`badge` (e.g. currency formatting, progress bars, custom render functions) — deferred, can be added additively.
- Dashboard page content (cards, charts) — not yet implemented beyond the heading.
- "+ New Enquiry" / "+ New Quotation" / "+ New Study" button click handlers — currently just `console.log`, need real modals/forms.
