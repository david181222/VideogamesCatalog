# VG//Catalog

Catálogo táctico de videojuegos construido con **Next.js 15+**, **Supabase** y **Tailwind CSS v4**. Estética oscura militar-verde inspirada en MGS3: Snake Eater. Los usuarios autenticados navegan el catálogo; los administradores gestionan el CRUD completo desde un panel dedicado.

---

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Variables de Entorno](#variables-de-entorno)
4. [Ejecución Local](#ejecución-local)
5. [Esquema de Base de Datos](#esquema-de-base-de-datos)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Flujo de Autenticación](#flujo-de-autenticación)
8. [Arquitectura de Rutas](#arquitectura-de-rutas)
9. [Middleware y Protección de Rutas](#middleware-y-protección-de-rutas)
10. [Páginas](#páginas)
11. [Componentes](#componentes)
12. [Server Actions](#server-actions)
13. [Clientes de Supabase](#clientes-de-supabase)
14. [Flujo de Datos: Consulta del Catálogo](#flujo-de-datos-consulta-del-catálogo)
15. [Principios de Diseño (KISS / DRY)](#principios-de-diseño-kiss--dry)
16. [Sistema de Diseño Visual](#sistema-de-diseño-visual)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Lenguaje | TypeScript |
| Base de Datos / Auth | Supabase (PostgreSQL + Auth) |
| Estilos | Tailwind CSS v4 (`@theme inline`) |
| Fuentes | Geist Sans + Geist Mono (Google Fonts) |
| Estado | React 19 `useActionState`, parámetros de URL |
| Hosting de imágenes | URLs externas (Wikipedia, etc.) |

---

## Estructura del Proyecto

```
videogames/
├── middleware.ts               Guardia de rutas — verifica auth + admin en cada request
│
├── lib/
│   ├── types.ts                Tipos TypeScript compartidos (Profile, Videojuego, etc.)
│   ├── queries.ts              Consultas reutilizables (filtros, ordenamiento, paginación)
│   └── supabase/
│       ├── client.ts           Cliente Supabase para el navegador (Client Components)
│       ├── server.ts           Cliente Supabase para el servidor (Server Components, Actions)
│       └── middleware.ts       Cliente Supabase para middleware (Edge Runtime)
│
├── components/
│   ├── navbar.tsx              Barra de navegación fija con enlace Admin (condicional)
│   ├── videogame-card.tsx      Tarjeta: portada, título, año, puntuación, etiquetas
│   ├── search-bar.tsx          Input de búsqueda → escribe `q` en la URL
│   ├── filter-bar.tsx          Dropdowns de género / plataforma / año / orden → URL params
│   ├── pagination.tsx          Botones Anterior / Siguiente → param `page` en URL
│   ├── videogame-form.tsx      Formulario compartido de crear y editar
│   └── delete-button.tsx       Botón eliminar con diálogo de confirmación
│
└── app/
    ├── globals.css             Tokens del tema Tailwind v4 + efectos CSS (grid, scanlines)
    ├── layout.tsx              Layout raíz: fuentes, metadata, lang="es"
    ├── not-found.tsx           Página 404 personalizada
    ├── error.tsx               Límite de error global con botón "Reintentar"
    ├── actions.ts              Todas las Server Actions (auth + CRUD)
    │
    ├── (auth)/                 Grupo de rutas — sin Navbar, layout centrado
    │   ├── layout.tsx          Layout centrado con fondo grid-pattern
    │   ├── login/
    │   │   ├── page.tsx        Página de login
    │   │   └── login-form.tsx  Formulario de login (Client Component, useActionState)
    │   └── register/
    │       ├── page.tsx        Página de registro
    │       └── register-form.tsx  Formulario de registro (Client Component)
    │
    ├── (catalog)/              Grupo de rutas — con Navbar
    │   ├── layout.tsx          Lee usuario + perfil, pasa isAdmin al Navbar
    │   ├── page.tsx            Catálogo público (búsqueda, filtros, orden, 12/página)
    │   └── loading.tsx         Skeleton de carga mientras la página se renderiza
    │
    └── admin/                  Requiere role = 'admin' (verificado por middleware)
        ├── layout.tsx          Navbar con isAdmin=true
        ├── page.tsx            Tabla admin (búsqueda, filtros, orden, 20/página)
        ├── loading.tsx         Estado de carga
        ├── create/
        │   └── page.tsx        Carga opciones, renderiza VideogameForm (modo crear)
        └── edit/
            └── [id]/
                └── page.tsx    Carga juego + opciones, renderiza VideogameForm (modo editar)
```

---

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
```

Ambas variables tienen el prefijo `NEXT_PUBLIC_` para que estén disponibles en el navegador (necesarias para el cliente Supabase en Client Components). También se leen del lado del servidor.

La clave anónima es segura de exponer al navegador porque el acceso está controlado por las políticas RLS en la base de datos.

---

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

La app corre en `http://localhost:3000`.

Se debe configurar Supabase (ver [Esquema de BD](#esquema-de-base-de-datos) y [RLS](#row-level-security-rls)) antes de que la app pueda cargar o autenticar usuarios.

---

## Esquema de Base de Datos

Todas las tablas viven en el esquema `public` del proyecto Supabase.

### `profiles`
Extiende la tabla `auth.users` de Supabase. Se crea automáticamente mediante un trigger cuando un usuario se registra.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` (PK) | Referencia a `auth.users.id` |
| `role` | `text` | `'user'` o `'admin'` |

**Trigger para crear perfil automáticamente al registrarse:**
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

**Promover un usuario a admin** (ejecutar en el SQL Editor de Supabase):
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid-del-usuario>';
```

---

### `desarrolladores`
Desarrolladores/publicadores de videojuegos.

| Columna | Tipo |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `generos`
Géneros (ej: Acción, RPG, Puzzle).

| Columna | Tipo |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `plataformas`
Plataformas (ej: PC, PS5, Switch).

| Columna | Tipo |
|---|---|
| `id` | `serial` (PK) |
| `nombre` | `text` |

---

### `videojuegos`
Registros principales de juegos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `serial` (PK) | |
| `titulo` | `text` | Obligatorio |
| `anio` | `integer` | Año de lanzamiento |
| `puntuacion` | `integer` | 0–100, puede ser nulo |
| `imagen_url` | `text` | URL externa de portada, puede ser nulo |
| `desarrollador_id` | `integer` | FK → `desarrolladores.id`, puede ser nulo |

---

### `videojuegos_generos`
Tabla de unión entre juegos y géneros (muchos a muchos).

| Columna | Tipo |
|---|---|
| `videojuego_id` | `integer` (FK → `videojuegos.id`) |
| `genero_id` | `integer` (FK → `generos.id`) |

---

### `videojuegos_plataformas`
Tabla de unión entre juegos y plataformas (muchos a muchos).

| Columna | Tipo |
|---|---|
| `videojuego_id` | `integer` (FK → `videojuegos.id`) |
| `plataforma_id` | `integer` (FK → `plataformas.id`) |

---

### Relaciones entre Entidades

```
auth.users  ──(trigger)──>  profiles
                                │ role

videojuegos ───────────────> desarrolladores
     │                       (muchos a uno)
     ├──> videojuegos_generos ──> generos
     │         (N:M)
     └──> videojuegos_plataformas ──> plataformas
               (N:M)
```

---

## Row-Level Security (RLS)

RLS está habilitado en todas las tablas. Ejecuta el siguiente SQL en el SQL Editor de Supabase.

### `profiles`
```sql
-- Los usuarios pueden leer su propio perfil
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
```

### Políticas de lectura (todos los usuarios autenticados)
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

### Políticas de escritura para admin

El subquery `EXISTS` lee `profiles` para verificar el rol `admin`:

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

## Flujo de Autenticación

1. **Registro** — El usuario envía `/register`. La Server Action `register` llama a `supabase.auth.signUp`. Supabase crea una fila en `auth.users`, y el trigger inserta automáticamente una fila en `public.profiles` con `role = 'user'`. Se redirige a `/`.

2. **Inicio de sesión** — El usuario envía `/login`. La Server Action `login` llama a `supabase.auth.signInWithPassword`. Al tener éxito, Supabase escribe una cookie de sesión y se redirige a `/`.

3. **Renovación de sesión** — `lib/supabase/middleware.ts` llama a `supabase.auth.getUser()` en cada request. Esto valida el JWT contra el servidor de Supabase Auth y renueva la cookie si es necesario.

4. **Cierre de sesión** — El Navbar tiene un formulario que invoca la Server Action `signOut`. Llama a `supabase.auth.signOut()`, limpia la cookie y redirige a `/login`.

5. **Verificación de rol** — `profiles.role` es la única fuente de verdad. Se verifica en el middleware (protección de `/admin/*`), en los layouts (prop `isAdmin` para el Navbar) y en cada Server Action de escritura (helper `verifyAdmin`).

---

## Arquitectura de Rutas

Los **Route Groups** de Next.js (carpetas en paréntesis) organizan páginas sin afectar las URLs:

| Grupo de Rutas | Prefijo URL | Layout |
|---|---|---|
| `(auth)` | `/login`, `/register` | Tarjeta centrada, sin Navbar |
| `(catalog)` | `/` (índice) | Navbar, `isAdmin` calculado desde la BD |
| `admin` (carpeta normal) | `/admin/**` | Navbar con `isAdmin=true` (middleware ya verificó) |

El layout del catálogo consulta el rol del usuario para mostrar condicionalmente el enlace "Admin", mientras que el layout de admin puede saltarse esa verificación — el middleware ya validó el rol antes de que el request llegara a la página.

---

## Middleware y Protección de Rutas

`middleware.ts` se ejecuta en cada request que coincida con este patrón:
```
/((?!_next/static|_next/image|favicon.ico|.*\.(svg|png|jpg|jpeg|gif|webp)$).*)
```

Se aplican tres reglas en orden:

```
Request
  │
  ├─ No autenticado + ruta ≠ /login o /register
  │     → redirigir a /login
  │
  ├─ Autenticado + ruta = /login o /register
  │     → redirigir a /
  │
  └─ Ruta empieza con /admin
        + role ≠ 'admin' (consultado desde profiles)
        → redirigir a /
```

El middleware usa un cliente Supabase dedicado (`lib/supabase/middleware.ts`) que lee cookies del `NextRequest` entrante y las escribe de vuelta en el `NextResponse`, asegurando que la sesión esté fresca antes de que se ejecute el handler de la ruta.

**¿Por qué `getUser()` en lugar de `getSession()`?** `getSession()` solo lee la cookie local sin validarla contra el servidor de Supabase. `getUser()` hace una petición de red para validar el JWT — esto previene que tokens falsificados o expirados pasen la verificación del middleware.

---

## Páginas

### `/login` — Inicio de Sesión
Renderiza `LoginForm` dentro de una tarjeta centrada. `LoginForm` es un Client Component que usa `useActionState` con la Server Action `login`.

### `/register` — Registro
Renderiza `RegisterForm` dentro de una tarjeta centrada. Mismo patrón que login.

### `/` — Catálogo Público (`app/(catalog)/page.tsx`)
Server Component que:
1. Espera `searchParams` (Promise en Next.js 15+)
2. Consulta opciones de género / plataforma / año en paralelo (`fetchFilterOptions`)
3. Ejecuta la consulta principal con filtros, búsqueda, ordenamiento y paginación (`fetchVideojuegos`)
4. Pagina a **12 resultados por página**
5. Renderiza `SearchBar`, `FilterBar` (con dropdown de orden), grid responsiva de tarjetas y `Pagination`

### `/admin` — Panel de Administración (`app/admin/page.tsx`)
Mismo flujo de datos que el catálogo, usando los mismos helpers de `lib/queries.ts`, pero:
- **20 resultados por página**
- Renderiza una `<table>` en vez de la cuadrícula de tarjetas
- Cada fila tiene un enlace de Editar y un `DeleteButton`

### `/admin/create` — Crear Juego
Consulta todos los desarrolladores, géneros y plataformas en paralelo, luego renderiza `VideogameForm` con la acción `createVideojuego` y sin `defaultValues`.

### `/admin/edit/[id]` — Editar Juego
Espera el `params.id` dinámico (Promise en Next.js 15+). Consulta el juego existente (con todas las relaciones) + listas de opciones en paralelo. Renderiza `VideogameForm` con `defaultValues` prellenados y la acción `updateVideojuego`. Llama a `notFound()` si el ID no existe.

---

## Componentes

### `Navbar` (`components/navbar.tsx`)

Barra superior fija. El enlace "Admin" solo se renderiza cuando `isAdmin === true`. El cierre de sesión se implementa como un formulario que invoca directamente la Server Action `signOut`.

| Prop | Tipo | Descripción |
|---|---|---|
| `userEmail` | `string \| null` | Muestra el email del usuario actual |
| `isAdmin` | `boolean` | Controla la visibilidad del enlace Admin |

---

### `VideogameCard` (`components/videogame-card.tsx`)

Muestra un juego individual en la cuadrícula del catálogo.

| Prop | Tipo | Descripción |
|---|---|---|
| `videojuego` | `Videojuego` | Registro completo del juego con relaciones anidadas |

**Umbrales de color para puntuación:**
- `≥ 75` — verde (`text-accent`) con resplandor
- `≥ 50` — ámbar (`text-warning`)
- `< 50` — rojo (`text-danger`)
- `null` — muestra "N/A"

Los géneros y plataformas se extraen de los arrays de las tablas de unión (`videojuegos_generos[].generos`) y se renderizan como etiquetas pequeñas debajo de la información del juego.

---

### `SearchBar` (`components/search-bar.tsx`)

Client Component. Input controlado que refleja el parámetro URL `q` actual como estado local.

Al enviar, actualiza el parámetro `q` (o lo elimina si está vacío) y reinicia `page` a 1. No recibe props — lee y escribe parámetros URL internamente vía `useSearchParams` y `useRouter`.

---

### `FilterBar` (`components/filter-bar.tsx`)

Client Component. Tres dropdowns siempre visibles (género, plataforma, año) más un dropdown de ordenamiento opcional.

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `generos` | `Genero[]` | — | Opciones para el select de género |
| `plataformas` | `Plataforma[]` | — | Opciones para el select de plataforma |
| `anios` | `number[]` | — | Opciones para el select de año |
| `showSort` | `boolean` | `false` | Habilita el dropdown de ordenamiento |

Cada cambio llama inmediatamente a `router.push(...)` con los parámetros URL actualizados. Cambiar cualquier filtro reinicia `page` a 1. Un botón **Clear** aparece cuando algún filtro está activo; navega al pathname sin query string.

**Valores de ordenamiento** (pasados como `?sort=`):

| Valor | Significado |
|---|---|
| *(vacío)* | Alfabético A → Z (por defecto) |
| `titulo_desc` | Alfabético Z → A |
| `puntuacion_desc` | Puntuación más alta primero |
| `puntuacion_asc` | Puntuación más baja primero |
| `anio_desc` | Más recientes primero |
| `anio_asc` | Más antiguos primero |

---

### `Pagination` (`components/pagination.tsx`)

Client Component. Renderiza botones **Anterior** / **Siguiente**. Retorna `null` cuando `totalPages <= 1`.

| Prop | Tipo | Descripción |
|---|---|---|
| `currentPage` | `number` | Página actual (empieza en 1) |
| `totalPages` | `number` | Número total de páginas |

Preserva todos los parámetros URL existentes (filtros, búsqueda, orden) y solo actualiza `page`.

---

### `VideogameForm` (`components/videogame-form.tsx`)

Client Component. Formulario compartido de crear/editar usado en `/admin/create` y `/admin/edit/[id]`.

| Prop | Tipo | Descripción |
|---|---|---|
| `desarrolladores` | `Desarrollador[]` | Opciones para el select de desarrollador |
| `generos` | `Genero[]` | Opciones para los checkboxes de género |
| `plataformas` | `Plataforma[]` | Opciones para los checkboxes de plataforma |
| `defaultValues` | `Videojuego` (opcional) | Cuando se proporciona, el formulario está en modo edición |
| `action` | Server Action | `createVideojuego` o `updateVideojuego` |

Usa `useActionState(action, { error: null })` de React 19. El booleano `pending` deshabilita el botón de envío mientras la acción se ejecuta.

**Toggle del campo desarrollador:**
Un estado `devMode` controla qué campo se renderiza:
- `'select'` — `<select name="desarrollador_id">` con desarrolladores existentes
- `'new'` — `<input name="new_desarrollador">` para escribir un nombre nuevo

La Server Action lee `new_desarrollador` primero. Si está presente, inserta en `desarrolladores` y usa el ID retornado; de lo contrario parsea `desarrollador_id`.

**Modo edición:** Cuando se proporciona `defaultValues`, se agrega un `<input name="id">` oculto y todos los campos se prellenan. El botón de envío dice "Update Videogame" en vez de "Create Videogame".

---

### `DeleteButton` (`components/delete-button.tsx`)

Client Component. Envuelve el formulario de eliminación para mostrar un diálogo de confirmación antes de enviar y mostrar cualquier error retornado por la acción.

| Prop | Tipo | Descripción |
|---|---|---|
| `videojuegoId` | `number` | ID del juego a eliminar |
| `titulo` | `string` | Se usa en el mensaje de `window.confirm` |

Se necesita un wrapper de cliente porque `deleteVideojuego` retorna `{ error }` en vez de `void`, lo cual es incompatible con el tipo del atributo nativo `form action`.

---

## Server Actions

Todas las acciones están en `app/actions.ts` y marcadas con `'use server'`.

### `login(prevState, formData) → AuthState`
Llama a `supabase.auth.signInWithPassword`. Redirige a `/` si es exitoso, retorna `{ error }` si falla.

### `register(prevState, formData) → AuthState`
Llama a `supabase.auth.signUp`. Redirige a `/` si es exitoso, retorna `{ error }` si falla.

### `signOut() → void`
Llama a `supabase.auth.signOut()` y redirige a `/login`.

### `verifyAdmin()` — helper interno
Se llama al inicio de cada acción CRUD. Obtiene el usuario actual vía `getUser()` y lee su rol desde `public.profiles`. Retorna `{ supabase, error: null }` si está autorizado, o `{ supabase, error: string }` si no lo está.

### `createVideojuego(prevState, formData) → FormState`
1. Verifica rol admin
2. Lee: `titulo`, `anio`, `puntuacion`, `imagen_url`, `desarrollador_id`, `new_desarrollador`, `generos[]`, `plataformas[]`
3. Si `new_desarrollador` está presente → inserta nuevo desarrollador, usa su ID
4. Inserta juego en `videojuegos`
5. Inserta filas en `videojuegos_generos` y `videojuegos_plataformas`
6. `revalidatePath('/')` + `revalidatePath('/admin')` para limpiar caché de Next.js
7. Redirige a `/admin`

### `updateVideojuego(prevState, formData) → FormState`
Mismo flujo que crear, con dos diferencias:
- Lee `id` desde un campo oculto del formulario; llama `.update()` en vez de `.insert()`
- **Reemplaza** las relaciones de unión: elimina todas las filas existentes de género/plataforma, luego reinserta la nueva selección

### `deleteVideojuego(formData) → { error } | void`
1. Verifica rol admin
2. Elimina todas las filas de `videojuegos_generos` del juego
3. Elimina todas las filas de `videojuegos_plataformas` del juego
4. Elimina el juego de `videojuegos`

El orden de eliminación es obligatorio — las tablas de unión tienen foreign keys apuntando a `videojuegos.id`. Eliminar el padre primero violaría esas restricciones.

---

## Clientes de Supabase

Tres clientes separados se conectan al mismo proyecto Supabase pero manejan cookies de forma diferente según el contexto de ejecución.

### `lib/supabase/client.ts` — Cliente del navegador
```ts
import { createBrowserClient } from '@supabase/ssr'
```
Usado en **Client Components** (`'use client'`). Lee variables de entorno desde el proceso del navegador.

### `lib/supabase/server.ts` — Cliente del servidor
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
```
Usado en **Server Components, Server Actions y Route Handlers**. Debe ser `async` porque `cookies()` es async en Next.js 15+. La implementación de `setAll` captura silenciosamente errores cuando se llama desde un Server Component (donde no se pueden establecer cookies) — el middleware se encarga de renovar la sesión en esos casos.

### `lib/supabase/middleware.ts` — Cliente del middleware
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
```
Usado exclusivamente dentro de `middleware.ts`. Corre en el **Edge Runtime**. Lee cookies del `NextRequest` y escribe cookies actualizadas en el `NextResponse` para que el token de sesión se renueve en cada request antes de que se ejecute el handler de la página.

---

## Flujo de Datos: Consulta del Catálogo

Cómo se procesa un request a `/?q=zelda&genero=3&plataforma=1&page=2`:

```
Navegador
  │
  ├─ middleware.ts
  │    └─ updateSession() — renueva cookie, valida usuario vía getUser()
  │
  └─ (catalog)/page.tsx  [Server Component]
       │
       ├─ await searchParams  →  { q: 'zelda', genero: '3', plataforma: '1', page: '2' }
       │
       ├─ fetchFilterOptions(supabase)  ← poblar dropdowns de filtros
       │    └─ Promise.all([generos, plataformas, anios])
       │
       ├─ fetchVideojuegos(supabase, params, 12)  ← consulta principal
       │    │
       │    ├─ fetchFilterIds() — filtro de tablas de unión (dos consultas):
       │    │    ├─ SELECT videojuego_id FROM videojuegos_generos WHERE genero_id = 3
       │    │    │    → [12, 45, 78, ...]
       │    │    └─ SELECT videojuego_id FROM videojuegos_plataformas WHERE plataforma_id = 1
       │    │         → intersección con lista anterior (lógica AND)
       │    │         → filterIds = [45, 78, ...]
       │    │
       │    ├─ SELECT *, desarrolladores(*), videojuegos_generos(generos(*)), ...
       │    │    FROM videojuegos
       │    │    WHERE titulo ILIKE '%zelda%'
       │    │      AND id IN (45, 78, ...)
       │    │    ORDER BY titulo
       │    │    RANGE 12..23   (página 2, PAGE_SIZE = 12)
       │    │
       │    └─ return { videojuegos, count, totalPages, currentPage, error }
       │
       └─ Renderizar:
            SearchBar  (controlado, prellenado desde ?q)
            FilterBar  (dropdowns preseleccionados desde ?genero, ?plataforma, ?sort)
            Cuadrícula de componentes VideogameCard
            Pagination (currentPage=2, totalPages=N)
```

**¿Por qué el enfoque de dos consultas?** Supabase PostgREST no puede filtrar por columnas de tablas de unión anidadas con semántica AND a través de múltiples relaciones en una sola consulta. La app consulta los IDs que coinciden en cada tabla de unión, calcula su intersección en el código de la aplicación, y aplica `.in('id', filterIds)` en la consulta principal.

Si ningún juego coincide con el filtro de unión, `filterIds` se establece en `[-1]` — un valor centinela que garantiza que la consulta principal retorne cero resultados sin causar un error.

---

## Principios de Diseño (KISS / DRY)

El proyecto sigue los principios **KISS** (Keep It Simple, Stupid) y **DRY** (Don't Repeat Yourself):

### DRY — No te repitas
- **`lib/queries.ts`**: La lógica de consulta (filtros, ordenamiento, paginación) está centralizada en funciones reutilizables (`fetchFilterOptions`, `fetchFilterIds`, `fetchVideojuegos`). Tanto la página del catálogo como la de admin usan las mismas funciones, variando solo el tamaño de página.
- **`lib/types.ts`**: Los tipos TypeScript se definen una sola vez y se importan en todo el proyecto.
- **`VideogameForm`**: Un solo componente de formulario sirve para crear y editar juegos, controlado por la presencia de `defaultValues`.
- **`FilterBar`**: Un solo componente maneja filtros en catálogo y admin, con el prop `showSort` para habilitar el dropdown de orden.

### KISS — Mantenlo simple
- **Estado basado en URL**: En vez de usar Redux, Context, o Zustand, todos los filtros, búsqueda y paginación viven en los parámetros de la URL. Esto simplifica el estado, habilita compartir URLs con filtros, y funciona con el botón atrás del navegador.
- **Server Components por defecto**: Solo se usan Client Components donde se necesita interactividad (formularios, filtros). La obtención de datos se hace del lado del servidor.
- **Sin abstracciones innecesarias**: Las Server Actions están en un solo archivo (`actions.ts`). Los clientes de Supabase son funciones simples. No hay capas de servicios o repositorios intermedios.
- **Convenciones de Next.js**: Se aprovechan Route Groups, layouts anidados, `loading.tsx` y `error.tsx` del framework en vez de construir soluciones propias.

---

## Sistema de Diseño Visual

El tema visual se define en `app/globals.css` usando la directiva `@theme inline` de Tailwind v4. No hay `tailwind.config.js` — todos los tokens son propiedades CSS personalizadas.

### Paleta de Colores

| Token | Valor | Uso |
|---|---|---|
| `--color-background` | `#0a0a0a` | Fondo de página |
| `--color-surface` | `#111111` | Superficies de tarjetas, navbar |
| `--color-surface-elevated` | `#1a1a1a` | Tarjetas elevadas, filas de tabla |
| `--color-olive` | `#4a7c59` | Verde oliva principal |
| `--color-olive-dark` | `#2d5a3d` | Botones, bordes activos |
| `--color-olive-light` | `#6b9e7a` | Estados hover, enlaces |
| `--color-accent` | `#00ff41` | Verde neón — puntuaciones, logo, títulos |
| `--color-text-primary` | `#e8e8e8` | Texto principal |
| `--color-text-secondary` | `#a0a0a0` | Texto secundario / etiquetas |
| `--color-text-muted` | `#606060` | Placeholders, estados deshabilitados |
| `--color-border-custom` | `#2a2a2a` | Todos los bordes |
| `--color-danger` | `#ff4444` | Errores, acciones de eliminar, puntuación baja |
| `--color-warning` | `#ffaa00` | Puntuación media |

### Efectos CSS

- **`grid-pattern`** — overlay sutil de cuadrícula en fondos de página vía CSS `background-image` con `linear-gradient`. Crea la estética de mapa táctico en toda la app.

### Tipografía

Todo el texto de la UI usa **Geist Mono** (`font-mono`) para títulos, etiquetas, puntuaciones y botones — reforzando la estética de terminal / táctico. El contenido del cuerpo usa Geist Sans. Ambas fuentes se cargan vía `next/font/google` en `app/layout.tsx`.
