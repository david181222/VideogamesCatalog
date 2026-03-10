# VG//Catalog

A tactical videogame catalog built with Next.js 15+, Supabase, and Tailwind CSS v4. Features a dark military-green aesthetic inspired by MGS3: Snake Eater. Authenticated users browse the catalog; admin users manage the full CRUD from a dedicated panel.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Running Locally](#running-locally)
5. [Database Schema](#database-schema)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Authentication Flow](#authentication-flow)
8. [Route Architecture](#route-architecture)
9. [Middleware & Route Protection](#middleware--route-protection)
10. [Pages](#pages)
11. [Components](#components)
12. [Server Actions](#server-actions)
13. [Supabase Client Variants](#supabase-client-variants)
14. [Data Flow: Catalog Query](#data-flow-catalog-query)
15. [Design System](#design-system)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 (`@theme inline`) |
| Fonts | Geist Sans + Geist Mono (Google Fonts) |
| State | React 19 `useActionState`, URL search params |
| Image hosting | External URLs (Wikipedia, etc.) |

---

## Project Structure

```
videogames/
├── .env.local.example          Environment variable template
├── next.config.ts              Allows external images from any HTTPS host
├── middleware.ts               Route guard — auth + admin checks on every request
│
├── lib/
│   ├── types.ts                Shared TypeScript types (Profile, Videojuego, etc.)
│   └── supabase/
│       ├── client.ts           Browser-side Supabase client (Client Components)
│       ├── server.ts           Server-side Supabase client (Server Components, Actions)
│       └── middleware.ts       Middleware-specific Supabase client (Edge Runtime)
│
├── components/
│   ├── navbar.tsx              Sticky top navigation with admin link (conditional)
│   ├── videogame-card.tsx      Grid card: cover image, title, year, score, pills
│   ├── search-bar.tsx          Controlled text input that writes `q` to URL
│   ├── filter-bar.tsx          Genre / platform / year / sort dropdowns → URL params
│   ├── pagination.tsx          Prev / Next page buttons → URL param `page`
│   ├── videogame-form.tsx      Create + edit form with developer toggle
│   └── delete-button.tsx       Delete button with browser confirm dialog
│
└── app/
    ├── globals.css             Tailwind v4 theme tokens + scanline / grid CSS effects
    ├── layout.tsx              Root layout: fonts, metadata, lang="es"
    ├── not-found.tsx           Custom 404 page
    ├── error.tsx               Global error boundary with "Try Again" button
    ├── actions.ts              All Server Actions (auth + CRUD)
    │
    ├── (auth)/                 Route group — no Navbar, centered layout
    │   ├── layout.tsx          Centered card layout with grid-pattern background
    │   ├── login/
    │   │   ├── page.tsx        Login page shell
    │   │   └── login-form.tsx  Login form Client Component (useActionState)
    │   └── register/
    │       ├── page.tsx        Register page shell
    │       └── register-form.tsx Register form Client Component (useActionState)
    │
    ├── (catalog)/              Route group — with Navbar, isAdmin computed server-side
    │   ├── layout.tsx          Reads user + profile, passes isAdmin to Navbar
    │   ├── page.tsx            Public catalog (search, filters, 12/page grid)
    │   └── loading.tsx         Skeleton card grid while page streams
    │
    └── admin/                  Requires role = 'admin' (enforced by middleware)
        ├── layout.tsx          Navbar with isAdmin=true (middleware already verified)
        ├── page.tsx            Admin table with search, filters, sort, pagination
        ├── loading.tsx         Loading state for admin list
        ├── create/
        │   └── page.tsx        Fetches options, renders VideogameForm (create mode)
        └── edit/
            └── [id]/
                └── page.tsx    Fetches game + options, renders VideogameForm (edit mode)
```

---

## Environment Variables

Create a `.env.local` file at the root of `videogames/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both variables are prefixed `NEXT_PUBLIC_` so they are available in the browser (required for the browser Supabase client used in Client Components). They are also read server-side by the server and middleware clients.

The anonymous key is safe to expose to the browser because access is controlled by Row-Level Security policies on the database.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:3000`.

You must configure Supabase (see [Database Schema](#database-schema) and [RLS](#row-level-security-rls)) before the app can load or authenticate users.

---

## Database Schema

All tables live in the `public` schema of your Supabase project.

### `profiles`
Extends Supabase's built-in `auth.users`. Created automatically via a database trigger when a user signs up.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | References `auth.users.id` |
| `role` | `text` | `'user'` or `'admin'` |

**Trigger to auto-create profile on sign-up:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Promote a user to admin** (run in Supabase SQL Editor):
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

---

### `desarrolladores`
Videogame developers/publishers.

| Column | Type |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `generos`
Genres (e.g., Action, RPG, Puzzle).

| Column | Type |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `plataformas`
Platforms (e.g., PC, PS5, Switch).

| Column | Type |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `videojuegos`
Main game records.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` (PK) | |
| `titulo` | `text` | Required |
| `anio` | `integer` | Release year |
| `puntuacion` | `integer` | 0–100, nullable |
| `imagen_url` | `text` | External cover image URL, nullable |
| `desarrollador_id` | `integer` | FK → `desarrolladores.id`, nullable |

---

### `videojuegos_generos`
Junction table linking games to genres (many-to-many).

| Column | Type |
|---|---|
| `videojuego_id` | `integer` (FK → `videojuegos.id`) |
| `genero_id` | `integer` (FK → `generos.id`) |

---

### `videojuegos_plataformas`
Junction table linking games to platforms (many-to-many).

| Column | Type |
|---|---|
| `videojuego_id` | `integer` (FK → `videojuegos.id`) |
| `plataforma_id` | `integer` (FK → `plataformas.id`) |

---

### Entity Relationships

```
auth.users  ──(trigger)──>  profiles
                                │ role

videojuegos ───────────────> desarrolladores
     │                       (many-to-one)
     ├──> videojuegos_generos ──> generos
     │         (N:M)
     └──> videojuegos_plataformas ──> plataformas
               (N:M)
```

---

## Row-Level Security (RLS)

RLS is enabled on all tables. Run the following SQL in the Supabase SQL Editor.

### `profiles`
```sql
-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
```

### Read policies (all authenticated users)
```sql
CREATE POLICY "authenticated_read" ON public.videojuegos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON public.desarrolladores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON public.generos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON public.plataformas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON public.videojuegos_generos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON public.videojuegos_plataformas
  FOR SELECT TO authenticated USING (true);
```

### Admin write policies

The `EXISTS` subquery reads `profiles` to verify the `admin` role:

```sql
-- videojuegos
CREATE POLICY "admin_insert_videojuegos" ON public.videojuegos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_update_videojuegos" ON public.videojuegos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_delete_videojuegos" ON public.videojuegos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- desarrolladores
CREATE POLICY "admin_insert_desarrolladores" ON public.desarrolladores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_update_desarrolladores" ON public.desarrolladores
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_delete_desarrolladores" ON public.desarrolladores
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- videojuegos_generos
CREATE POLICY "admin_insert_vg" ON public.videojuegos_generos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_delete_vg" ON public.videojuegos_generos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- videojuegos_plataformas
CREATE POLICY "admin_insert_vp" ON public.videojuegos_plataformas
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_delete_vp" ON public.videojuegos_plataformas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## Authentication Flow

1. **Sign up** — user submits `/register`. The `register` Server Action calls `supabase.auth.signUp`. Supabase creates a row in `auth.users`, and the database trigger automatically inserts a row in `public.profiles` with `role = 'user'`. The user is redirected to `/`.

2. **Sign in** — user submits `/login`. The `login` Server Action calls `supabase.auth.signInWithPassword`. On success, Supabase writes a session cookie and the user is redirected to `/`.

3. **Session refresh** — `lib/supabase/middleware.ts` calls `supabase.auth.getUser()` on every request. This validates the JWT against the Supabase Auth server and refreshes the session cookie if needed, ensuring it never goes stale.

4. **Sign out** — the Navbar has a form that invokes the `signOut` Server Action. That calls `supabase.auth.signOut()`, which clears the session cookie and redirects to `/login`.

5. **Role check** — `profiles.role` is the single source of truth. It is checked in middleware (`/admin/*` protection), in layouts (`isAdmin` prop for Navbar), and in every write Server Action (`verifyAdmin` helper).

---

## Route Architecture

Next.js **Route Groups** (folders in parentheses) organize pages without affecting URLs:

| Route Group | URL prefix | Layout |
|---|---|---|
| `(auth)` | `/login`, `/register` | Centered card, no Navbar |
| `(catalog)` | `/` (index) | Navbar, `isAdmin` computed from DB |
| `admin` (plain folder) | `/admin/**` | Navbar with `isAdmin=true` (middleware already verified) |

The catalog layout fetches the user's role to conditionally show the "Admin" nav link, while the admin layout can skip that check — the middleware already verified the role before the request reached the page.

---

## Middleware & Route Protection

`middleware.ts` runs on every request matching this pattern:
```
/((?!_next/static|_next/image|favicon.ico|.*\.(svg|png|jpg|jpeg|gif|webp)$).*)
```

Three rules are applied in order:

```
Request
  │
  ├─ Not authenticated + route ≠ /login or /register
  │     → redirect /login
  │
  ├─ Authenticated + route = /login or /register
  │     → redirect /
  │
  └─ Route starts with /admin
        + role ≠ 'admin' (queried from profiles)
        → redirect /
```

The middleware uses a dedicated Supabase client (`lib/supabase/middleware.ts`) that reads cookies from the incoming `NextRequest` and writes them back to the `NextResponse`, ensuring the session is fresh before the route handler runs.

**Why `getUser()` instead of `getSession()`?** `getSession()` only reads the local cookie without validating it against the Supabase server. `getUser()` makes a network request to validate the JWT — this prevents forged or expired tokens from passing the middleware check.

---

## Pages

### `/login` — Login
Renders `LoginForm` inside a centered card. `LoginForm` is a Client Component that uses `useActionState` with the `login` Server Action.

### `/register` — Register
Renders `RegisterForm` inside a centered card. Same pattern as login.

### `/` — Public Catalog (`app/(catalog)/page.tsx`)
A Server Component that:
1. Awaits `searchParams` (Promise in Next.js 15+)
2. Fetches genre / platform / year options in parallel
3. Runs the two-query junction filter for genre and platform (see [Data Flow](#data-flow-catalog-query))
4. Runs the main `videojuegos` query with search, year filter, default `ORDER BY titulo`
5. Paginates at **12 results per page**
6. Renders `SearchBar`, `FilterBar` (no sort dropdown), a responsive card grid, and `Pagination`

### `/admin` — Admin Panel (`app/admin/page.tsx`)
Same data flow as the catalog but:
- **20 results per page**
- `FilterBar` rendered with `showSort` prop — sorts by title, score, or year
- Renders a `<table>` instead of a card grid
- Each row has an Edit link and a `DeleteButton`

### `/admin/create` — Create Game
Fetches all developers, genres, and platforms in parallel, then renders `VideogameForm` with the `createVideojuego` action and no `defaultValues`.

### `/admin/edit/[id]` — Edit Game
Awaits the dynamic `params.id` (Promise in Next.js 15+). Fetches the existing game (with all relations) + option lists in parallel. Renders `VideogameForm` with `defaultValues` pre-populated and the `updateVideojuego` action. Calls `notFound()` if the ID does not exist.

---

## Components

### `Navbar` (`components/navbar.tsx`)

Sticky top bar. The "Admin" link is only rendered when `isAdmin === true`. Sign Out is implemented as a form that directly invokes the `signOut` Server Action.

| Prop | Type | Description |
|---|---|---|
| `userEmail` | `string \| null` | Displays the current user's email |
| `isAdmin` | `boolean` | Controls visibility of the Admin nav link |

---

### `VideogameCard` (`components/videogame-card.tsx`)

Displays a single game in the catalog grid.

| Prop | Type | Description |
|---|---|---|
| `videojuego` | `Videojuego` | Full game record with nested relations |

**Score color thresholds:**
- `≥ 75` — green (`text-accent`) with glow
- `≥ 50` — amber (`text-warning`)
- `< 50` — red (`text-danger`)
- `null` — displays "N/A"

Genres and platforms are unwrapped from the junction table arrays (`videojuegos_generos[].generos`) and rendered as small pills below the game info.

---

### `SearchBar` (`components/search-bar.tsx`)

Client Component. Controlled input that mirrors the current `q` URL param as local state.

On submit, updates the `q` query param (or removes it if empty) and resets `page` to 1. No props — reads and writes URL params internally via `useSearchParams` and `useRouter`.

---

### `FilterBar` (`components/filter-bar.tsx`)

Client Component. Three always-visible dropdowns (genre, platform, year) plus an optional sort dropdown.

| Prop | Type | Default | Description |
|---|---|---|---|
| `generos` | `Genero[]` | — | Options for the genre select |
| `plataformas` | `Plataforma[]` | — | Options for the platform select |
| `anios` | `number[]` | — | Options for the year select |
| `showSort` | `boolean` | `false` | Enables the sort dropdown (admin only) |

Every change immediately calls `router.push(...)` with the updated URL params. Changing any filter resets `page` to 1. A **Clear** button appears when any filter is active; it navigates to the pathname with no query string.

**Sort values** (passed as `?sort=`):

| Value | Meaning |
|---|---|
| *(empty)* | Alphabetical A → Z (default) |
| `titulo_desc` | Alphabetical Z → A |
| `puntuacion_desc` | Score highest first |
| `puntuacion_asc` | Score lowest first |
| `anio_desc` | Newest first |
| `anio_asc` | Oldest first |

---

### `Pagination` (`components/pagination.tsx`)

Client Component. Renders **Prev** / **Next** buttons. Returns `null` when `totalPages <= 1`.

| Prop | Type | Description |
|---|---|---|
| `currentPage` | `number` | Current page (1-indexed) |
| `totalPages` | `number` | Total number of pages |

Preserves all existing URL params (filters, search, sort) and only updates `page`.

---

### `VideogameForm` (`components/videogame-form.tsx`)

Client Component. Shared create/edit form used in both `/admin/create` and `/admin/edit/[id]`.

| Prop | Type | Description |
|---|---|---|
| `desarrolladores` | `Desarrollador[]` | Options for the developer select |
| `generos` | `Genero[]` | Options for genre checkboxes |
| `plataformas` | `Plataforma[]` | Options for platform checkboxes |
| `defaultValues` | `Videojuego` (optional) | When provided, the form is in edit mode |
| `action` | Server Action | `createVideojuego` or `updateVideojuego` |

Uses `useActionState(action, { error: null })` from React 19. The `pending` boolean disables the submit button while the action runs.

**Developer field toggle:**
A `devMode` state controls what field is rendered:
- `'select'` — `<select name="desarrollador_id">` with existing developers
- `'new'` — `<input name="new_desarrollador">` to type a new developer name

The Server Action reads `new_desarrollador` first. If present, it inserts to `desarrolladores` and uses the returned ID; otherwise it parses `desarrollador_id`.

**Edit mode:** When `defaultValues` is supplied, a hidden `<input name="id">` is added and all fields are pre-populated. The submit button reads "Update Videogame" instead of "Create Videogame".

---

### `DeleteButton` (`components/delete-button.tsx`)

Client Component. Wraps the delete form to show a confirmation dialog before submitting, and to display any error returned by the action.

| Prop | Type | Description |
|---|---|---|
| `videojuegoId` | `number` | ID of the game to delete |
| `titulo` | `string` | Used in the `window.confirm` message |

A client wrapper is required because `deleteVideojuego` returns `{ error }` instead of `void`, which is incompatible with the native `form action` attribute type.

---

## Server Actions

All actions are in `app/actions.ts` and marked `'use server'`.

### `login(prevState, formData) → AuthState`
Calls `supabase.auth.signInWithPassword`. Redirects to `/` on success, returns `{ error }` on failure.

### `register(prevState, formData) → AuthState`
Calls `supabase.auth.signUp`. Redirects to `/` on success, returns `{ error }` on failure.

### `signOut() → void`
Calls `supabase.auth.signOut()` and redirects to `/login`.

### `verifyAdmin()` — internal helper
Called at the start of every CRUD action. Gets the current user via `getUser()` and reads their role from `public.profiles`. Returns `{ supabase, error: null }` if authorized, or `{ supabase, error: string }` if not.

### `createVideojuego(prevState, formData) → FormState`
1. Verifies admin role
2. Reads: `titulo`, `anio`, `puntuacion`, `imagen_url`, `desarrollador_id`, `new_desarrollador`, `generos[]`, `plataformas[]`
3. If `new_desarrollador` is present → insert new developer, use its ID
4. Insert game into `videojuegos`
5. Insert rows into `videojuegos_generos` and `videojuegos_plataformas`
6. `revalidatePath('/')` + `revalidatePath('/admin')` to bust Next.js cache
7. Redirect to `/admin`

### `updateVideojuego(prevState, formData) → FormState`
Same flow as create, with two differences:
- Reads `id` from a hidden form field; calls `.update()` instead of `.insert()`
- **Replaces** junction relations: deletes all existing genre/platform rows, then re-inserts the new selection

### `deleteVideojuego(formData) → { error } | void`
1. Verifies admin role
2. Deletes all `videojuegos_generos` rows for the game
3. Deletes all `videojuegos_plataformas` rows for the game
4. Deletes the game from `videojuegos`

The deletion order is mandatory — the junction tables have foreign keys pointing to `videojuegos.id`. Deleting the parent first would violate those constraints.

---

## Supabase Client Variants

Three separate clients connect to the same Supabase project but handle cookies differently depending on the execution context.

### `lib/supabase/client.ts` — Browser client
```ts
import { createBrowserClient } from '@supabase/ssr'
```
Used in **Client Components** (`'use client'`). Reads environment variables from the browser's process env. Suitable for real-time subscriptions or client-side queries; in this project, all data fetching happens server-side.

### `lib/supabase/server.ts` — Server client
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
```
Used in **Server Components, Server Actions, and Route Handlers**. Must be `async` because `cookies()` is async in Next.js 15+. The `setAll` implementation silently catches errors when called from a Server Component (where setting cookies is not allowed) — the middleware handles session refresh in those cases.

### `lib/supabase/middleware.ts` — Middleware client
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
```
Used exclusively inside `middleware.ts`. Runs in the **Edge Runtime**. Reads cookies from `NextRequest` and writes updated cookies to `NextResponse` so the session token is refreshed on every request before the page handler runs.

---

## Data Flow: Catalog Query

How a request for `/?q=zelda&genero=3&plataforma=1&page=2` is processed:

```
Browser
  │
  ├─ middleware.ts
  │    └─ updateSession() — refreshes cookie, validates user via getUser()
  │
  └─ (catalog)/page.tsx  [Server Component]
       │
       ├─ await searchParams  →  { q: 'zelda', genero: '3', plataforma: '1', page: '2' }
       │
       ├─ Promise.all([generos, plataformas, anios])  ← populate filter dropdowns
       │
       ├─ Two-query junction filter:
       │    │
       │    ├─ SELECT videojuego_id FROM videojuegos_generos WHERE genero_id = 3
       │    │    → [12, 45, 78, ...]
       │    │
       │    └─ SELECT videojuego_id FROM videojuegos_plataformas WHERE plataforma_id = 1
       │         → intersect with prior list (AND logic)
       │         → filterIds = [45, 78, ...]
       │
       ├─ Main query:
       │    SELECT *, desarrolladores(*), videojuegos_generos(generos(*)), ...
       │    FROM videojuegos
       │    WHERE titulo ILIKE '%zelda%'
       │      AND id IN (45, 78, ...)
       │    ORDER BY titulo
       │    RANGE 12..23   (page 2, PAGE_SIZE = 12)
       │
       └─ Render:
            SearchBar  (controlled, pre-filled from ?q)
            FilterBar  (dropdowns pre-selected from ?genero, ?plataforma)
            Grid of VideogameCard components
            Pagination (currentPage=2, totalPages=N)
```

**Why the two-query approach?** Supabase PostgREST cannot filter by nested junction table columns with AND semantics across multiple relations in a single query. The app fetches matching IDs from each junction table, computes their intersection in application code, and applies `.in('id', filterIds)` on the main query.

If no games match the junction filter, `filterIds` is set to `[-1]` — a sentinel that guarantees the main query returns zero results without causing an error.

---

## Design System

The visual theme is defined in `app/globals.css` using Tailwind v4's `@theme inline` directive. There is no `tailwind.config.js` — all tokens are CSS custom properties.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#0a0a0a` | Page background |
| `--color-surface` | `#111111` | Card surfaces, navbar |
| `--color-surface-elevated` | `#1a1a1a` | Elevated cards, table rows |
| `--color-olive` | `#4a7c59` | Primary olive green |
| `--color-olive-dark` | `#2d5a3d` | Buttons, active borders |
| `--color-olive-light` | `#6b9e7a` | Hover states, links |
| `--color-accent` | `#00ff41` | Neon green — scores, logo, headings |
| `--color-text-primary` | `#e8e8e8` | Main body text |
| `--color-text-secondary` | `#a0a0a0` | Secondary / label text |
| `--color-text-muted` | `#606060` | Placeholders, disabled states |
| `--color-border-custom` | `#2a2a2a` | All borders |
| `--color-danger` | `#ff4444` | Errors, delete actions, low score |
| `--color-warning` | `#ffaa00` | Mid-range score |

### CSS Effects

- **`grid-pattern`** — subtle grid overlay on page backgrounds via CSS `background-image` with `linear-gradient`. Creates the tactical map aesthetic throughout the app.

### Typography

All UI text uses **Geist Mono** (`font-mono`) for headings, labels, scores, and buttons — reinforcing the terminal / tactical aesthetic. Body content uses Geist Sans. Both fonts are loaded via `next/font/google` in `app/layout.tsx`.
