# Tasks: Next.js + tRPC

A small task manager built for a technical assessment. Tasks can be created, listed, edited and deleted. The backend keeps them **in memory** (no database) and exposes them through **tRPC**.

The guiding rule was the one in the assessment: *solve it in the simplest way possible*. The project has no UI library, no state manager and no extra layers, only what the requirements ask for.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **tRPC v11** with `@trpc/tanstack-react-query`
- **TanStack Query v5** (used for mutations)
- **Zod** for input validation
- Plain CSS (`app/globals.css`)

## Running locally

Requires **Node.js 20+** (developed on Node 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Lint:

```bash
npm run lint
```

No environment variables are needed.

## How it works

```text
Browser                           Next.js server (one Node process)
───────                           ─────────────────────────────────
GET /  ─────────────────────────► app/page.tsx (Server Component)
                                    └─ createCaller().task.list() ──► trpc/router.ts ──► in-memory Map
       ◄──── HTML with the list ───┘

Click "Delete" / "Save"
  useMutation ── POST /api/trpc/task.* ──► app/api/trpc/[trpc]/route.ts ──► trpc/router.ts
  on success → router.refresh() / router.push("/") → the server renders the fresh list
```

- **Reads happen on the server.** The list page and the edit page are Server Components that call the tRPC router directly with `createCaller`, so the first render already contains the data (SSR, no loading spinner, no extra HTTP round trip).
- **Writes go through tRPC over HTTP.** The client components use `useMutation` with the typed tRPC client. After a mutation, the page asks Next.js to re-render on the server (`router.refresh()` or a navigation), so the list always comes fresh from the server.

## Project structure

```text
app/
  page.tsx                    List page (/): loads tasks on the server
  TaskList.tsx                List UI: delete with feedback message
  tasks/TaskForm.tsx          Single form for create and edit, with client-side validation
  tasks/new/page.tsx          /tasks/new
  tasks/[id]/edit/page.tsx    /tasks/[id]/edit: loads the task or shows "Task not found"
  error.tsx                   Error screen when a page fails to render
  api/trpc/[trpc]/route.ts    tRPC HTTP endpoint
  layout.tsx, globals.css
trpc/
  router.ts                   Task type, in-memory store, procedures, validation
  client.tsx                  React Query + tRPC providers for client components
  limits.ts                   Length limits shared by server and form
```

## API (tRPC procedures)

| Procedure | Type | Input | Errors |
|---|---|---|---|
| `task.list` | query | none | none |
| `task.byId` | query | `{ id }` | `NOT_FOUND` |
| `task.create` | mutation | `{ title, description? }` | `BAD_REQUEST` (validation) |
| `task.update` | mutation | `{ id, title, description? }` | `BAD_REQUEST`, `NOT_FOUND` |
| `task.delete` | mutation | `{ id }` | `NOT_FOUND` |

`task.byId` is not part of the plain CRUD, but the edit page needs it to load one task and to show "Task not found".

Validation rules (Zod, on the server):

- `title` is required, trimmed (so a title of only spaces is rejected) and has at most 100 characters.
- `description` is optional, trimmed and has at most 500 characters.

Error messages are readable (e.g. `"Title is required"`, `"Task not found"`), so the UI shows them as they are.

## Field names

The assessment describes the task fields in Portuguese. The code uses English names:

| Assessment | Code | Notes |
|---|---|---|
| `id` | `id` | `crypto.randomUUID()`, generated on the server |
| `titulo` | `title` | required |
| `descricao` | `description` | optional |
| `dataCriacao` | `createdAt` | Unix timestamp in milliseconds (`Date.now()`) |

## Decisions and trade-offs

- **Next.js 15, not 16.** The assessment asks for Next.js v15, so the project uses the latest 15.x release (15.5).
- **In-memory store in `globalThis`.** Tasks live in a `Map` inside the server process. In development, Next.js re-runs modules on hot reload, which would reset a module-level variable. Keeping the `Map` on `globalThis` makes it survive those reloads. The data is lost when the server restarts, which is expected for an in-memory store. Replacing the `Map` with a database would only change `trpc/router.ts`.
- **`createdAt` as a number.** tRPC sends JSON, and JSON has no `Date` type. A timestamp in ms avoids adding a serializer such as `superjson`.
- **Server as the single source of truth.** The list is not cached on the client with `useQuery`. With `initialData`, React Query would ignore fresh server data whenever an older cache entry existed, so the list could show stale tasks after a save. Re-rendering on the server after each mutation avoids that without extra code.
- **One form for create and edit.** A single `TaskForm` component with one `useMutation`, which calls `create` or `update` depending on whether a task was passed.
- **Validation on both sides.** The form checks the title for instant feedback, and `maxLength` stops typing at the limit. The server always validates again with Zod, because the client cannot be trusted.
- **Length limits (100 / 500).** Because the store is in memory and the list is rendered into the HTML, unbounded input would let a single request fill the server's memory and every page load. The limits are shared from `trpc/limits.ts`, so the form does not import server code.
- **No double submits.** The Save and Delete buttons stay disabled until the navigation or refresh finishes, not only while the request is pending.
- **Feedback without libraries.** Success and error messages are plain elements (`role="status"` / `role="alert"`) that hide after 3 seconds. The message area has a fixed height, so the list does not jump. After a save, the form redirects to `/?saved=1`, and the list shows "Task saved".
- **Dates.** Dates are formatted with a fixed locale (`en-US`). Server and browser can be in different time zones, so the `<time>` element uses `suppressHydrationWarning`, and the server's time zone is shown.
- **"Task not found" returns HTTP 200.** The page shows the message with a link back. Returning a 404 status would need `notFound()` and an extra `not-found.tsx` file.

## Not implemented: infinite scroll (bonus)

The optional infinite scroll was left out on purpose.

It would need a paginated `task.list` (cursor-based) and a client-side cache of the loaded pages, usually with `useInfiniteQuery`. That cache is exactly what this project avoids. Today the server is the single source of truth, and every mutation simply re-renders the list on the server. With cached pages on the client, each create, update and delete would also have to update or invalidate those pages. That adds edge cases, such as deleting an item on page 3 or creating a task while several pages are loaded.

For an in-memory list in an assessment, that complexity has no real benefit. If the list grew to hundreds of items, I would:

- add a `cursor` and a `limit` to `task.list`;
- render the first page on the server;
- load the next pages with `useInfiniteQuery` when a sentinel element becomes visible (`IntersectionObserver`);
- invalidate the infinite query after each mutation.

## Known limitations

- Data is not persisted: restarting the server clears all tasks.
- The store belongs to a single process. With several server instances, each would have its own tasks.
- `npm audit` reports a vulnerability in the `postcss` version bundled inside Next.js 15 (used at build time only). The only available fix is upgrading to Next.js 16, which the assessment rules out.
