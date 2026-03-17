# Videogames Catalog

Catálogo de videojuegos con autenticación de usuarios y panel de administración. Construido con React 19 y alimentado por una base de datos en Supabase. El diseño sigue una estética militar/MGS con paleta de colores oscuros en tonos verde oliva.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 |
| Bundler | Vite 7 |
| Estilos | TailwindCSS 4 (con variables CSS personalizadas) |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth) |
| Routing | React Router DOM 7 |
| Linting | ESLint 9 |

---

## Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 3. Comandos disponibles

```bash
npm run dev       # Servidor de desarrollo con HMR
npm run build     # Build de producción
npm run preview   # Previsualizar el build
npm run lint      # Ejecutar ESLint
```

---

## Estructura de la base de datos (Supabase)

El proyecto asume las siguientes tablas en Supabase:

```
profiles                -> id, role ('admin' | 'user')
videojuegos             -> id, titulo, anio, puntuacion, imagen_url, desarrollador_id
desarrolladores         -> id, nombre
generos                 -> id, nombre
plataformas             -> id, nombre
videojuegos_generos     -> videojuego_id, genero_id        (relación N:M)
videojuegos_plataformas -> videojuego_id, plataforma_id    (relación N:M)
```

La tabla `profiles` se sincroniza con `auth.users` de Supabase. El campo `role` distingue si un usuario puede acceder al panel de administración.

---

## Estructura de carpetas

```
src/
├── main.jsx                  # Punto de entrada — monta App en el DOM
├── App.jsx                   # Router raíz y layout global
├── index.css                 # Variables CSS del sistema de diseño + clases globales
│
├── lib/
│   └── supabaseClient.js     # Instancia única del cliente de Supabase
│
├── context/
│   └── AuthContext.jsx       # Estado global de sesión y rol de usuario
│
├── hooks/
│   ├── useAuth.js            # Acceso rápido al contexto de autenticación
│   ├── useAuthForm.js        # Lógica compartida de formularios Login/Register
│   └── useGameFilters.js     # Estado de filtros + query a Supabase con debounce
│
├── components/
│   ├── Navbar.jsx            # Barra de navegación global
│   ├── ProtectedRoute.jsx    # Guard: redirige a /login si no hay sesión
│   ├── AdminRoute.jsx        # Guard: requiere sesión con rol 'admin'
│   ├── Button.jsx            # Botón reutilizable con variantes y tamaños
│   ├── Input.jsx             # Campo de texto con label integrado
│   ├── Modal.jsx             # Contenedor modal base (overlay centrado)
│   ├── ConfirmModal.jsx      # Modal de confirmación para eliminar
│   ├── GameCard.jsx          # Tarjeta visual de un videojuego
│   ├── GameFilters.jsx       # Barra de filtros del catálogo
│   ├── InlineAddField.jsx    # Campo inline para agregar registros desde el formulario
│   ├── ErrorMessage.jsx      # Mensaje de error reutilizable
│   └── Spinner.jsx           # Indicador de carga reutilizable
│
└── pages/
    ├── Login.jsx             # Página de inicio de sesión
    ├── Register.jsx          # Página de registro de cuenta
    ├── Catalog.jsx           # Catálogo de videojuegos (ruta protegida)
    └── admin/
        ├── AdminDashboard.jsx # Panel de administración con tabla CRUD
        └── GameForm.jsx       # Formulario para crear o editar un videojuego
```

---

## Archivos principales

### `main.jsx`
Punto de entrada de la aplicación. Monta el componente `App` en el nodo `#root` del HTML. No contiene lógica propia.

### `App.jsx`
Define el router global con `BrowserRouter` y envuelve toda la app dentro de `AuthProvider`. Declara todas las rutas del proyecto:

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | `Login` | Público |
| `/register` | `Register` | Público |
| `/catalog` | `Catalog` | Sesión activa |
| `/admin` | `AdminDashboard` | Rol `admin` |
| `/admin/new` | `GameForm` | Rol `admin` |
| `/admin/edit/:id` | `GameForm` | Rol `admin` |
| `*` (cualquier otra) | Redirige a `/catalog` | — |

### `lib/supabaseClient.js`
Crea y exporta la instancia única del cliente de Supabase usando las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Todos los archivos del proyecto importan `supabase` desde aquí, centralizando la conexión al backend.

### `index.css`
Define el sistema de diseño completo del proyecto mediante variables CSS en `:root` y las registra en Tailwind v4 a través de `@theme inline`, lo que permite usarlas como clases utilitarias (`bg-accent`, `text-danger`, etc.). Incluye clases globales personalizadas:

| Clase | Uso |
|---|---|
| `.surface-card` | Tarjeta elevada con borde, fondo y sombra del tema |
| `.score-glow` | Efecto de brillo en la puntuación de un juego |
| `.grid-pattern` | Patrón de grilla de fondo usado en Login y Register |

---

## Contexto

### `AuthContext.jsx`
Provee el estado de autenticación a toda la aplicación mediante React Context. Exporta `AuthProvider` (el componente que envuelve la app en `App.jsx`) y `AuthContext` (el contexto que consume `useAuth`).

Expone tres valores:

| Valor | Tipo | Descripción |
|---|---|---|
| `session` | object / null | Objeto de sesión de Supabase. `null` si no hay sesión activa |
| `role` | string / null | Rol del usuario: `'admin'` o `'user'`. Leído desde la tabla `profiles` |
| `loading` | boolean | `true` mientras se verifica la sesión al cargar la app por primera vez |

Al montar, recupera la sesión existente con `supabase.auth.getSession()` y se suscribe a cambios futuros con `onAuthStateChange`. Cuando detecta una sesión activa, consulta la tabla `profiles` para obtener el rol del usuario.

**Consumido por:** `Navbar`, `ProtectedRoute`, `AdminRoute` (a través del hook `useAuth`)

---

## Hooks personalizados

### `useAuth.js`

```
useAuth() → { session, role, loading }
```

Wrapper mínimo sobre `useContext(AuthContext)`. Existe para simplificar el acceso al estado de autenticación desde cualquier componente sin necesidad de importar `AuthContext` directamente.

**Usado por:** `Navbar`, `ProtectedRoute`, `AdminRoute`

---

### `useAuthForm.js`

```
useAuthForm(authFn, onSuccess) → { email, setEmail, password, setPassword, error, loading, handleSubmit }
```

Encapsula toda la lógica compartida entre los formularios de `Login` y `Register`:

- Estado de los campos `email` y `password`
- Estado de `error` y `loading`
- Función `handleSubmit` que llama a `authFn` con las credenciales y ejecuta `onSuccess` si no hay error

Al recibir la función de autenticación como parámetro es reutilizable tanto para `signInWithPassword` (login) como para `signUp` (registro) sin duplicar código.

**Usado por:** `Login`, `Register`

---

### `useGameFilters.js`

```
useGameFilters({ paginate?, pageSize? }) → { games, loading, error, filterProps, refetch, page, setPage, totalCount, pageSize }
```

El hook más complejo del proyecto. Centraliza toda la lógica de consulta, filtrado y paginación de videojuegos:

1. **Estado de filtros:** `search`, `generoId`, `plataformaId`, `anio`, `puntuacionMin`, `order`
2. **Carga de opciones:** Al montar, consulta en paralelo las tablas `generos` y `plataformas` para poblar los selectores del formulario de filtros
3. **Query dinámica a Supabase:** Construye la consulta a `videojuegos` aplicando solo los filtros activos, con resoluciones de relaciones N:M para género y plataforma
4. **Debounce de 300ms:** La consulta espera 300ms después del último cambio antes de ejecutarse, evitando peticiones excesivas mientras el usuario escribe
5. **Ordenamiento:** Soporta 6 criterios: título, puntuación y año, cada uno ascendente y descendente
6. **Paginación server-side:** Cuando `paginate` es `true` (valor por defecto), aplica `.range()` y `{ count: 'exact' }` a la query de Supabase para traer únicamente los registros de la página activa. El tamaño de página se controla con el parámetro `pageSize` (por defecto `12`, elegido porque encaja limpio en el grid de 4, 3 o 2 columnas). Cuando `paginate` es `false`, trae todos los registros sin paginar (usado por `AdminDashboard`)

Los setters de filtros son funciones envueltas que resetean la página a 0 en el mismo ciclo de render al cambiar cualquier filtro, aprovechando el batching de React 19 para evitar renders en cascada.

El objeto `filterProps` agrupa el estado y los setters de filtros para que `GameFilters` los reciba con un solo spread (`{...filterProps}`). La función `refetch` permite forzar una recarga, usada por `AdminDashboard` tras eliminar un juego.

**Usado por:** `Catalog` (con paginación), `AdminDashboard` (sin paginación)

---

## Componentes

### `Navbar.jsx`
Barra de navegación persistente en la parte superior de todas las páginas. Muestra "Mother Base" como enlace al catálogo. Su contenido cambia según el estado de sesión:

- **Sin sesión:** enlaces a `/login` y `/register`
- **Con sesión de usuario:** enlace al catálogo, email del usuario y botón de cerrar sesión
- **Con sesión de admin:** lo anterior más un enlace a `/admin`

**Depende de:** `useAuth`, `Button`, `supabaseClient`

---

### `ProtectedRoute.jsx`
Guard de ruta para páginas que requieren sesión activa. Renderiza un `Spinner` centrado mientras `AuthContext` carga. Si no hay sesión redirige a `/login`. Si hay sesión, renderiza los `children`.

**Depende de:** `useAuth`, `Spinner`
**Usado en:** `App.jsx` — envuelve la ruta `/catalog`

---

### `AdminRoute.jsx`
Guard de ruta para páginas exclusivas de administradores. Idéntico a `ProtectedRoute` con una condición adicional: si el usuario tiene sesión pero `role` no es `'admin'`, redirige a `/catalog`.

**Depende de:** `useAuth`, `Spinner`
**Usado en:** `App.jsx` — envuelve las rutas `/admin`, `/admin/new`, `/admin/edit/:id`

---

### `Button.jsx`
Botón reutilizable con sistema de variantes y tamaños controlado por props. Acepta todos los atributos nativos de `<button>` (`type`, `onClick`, `disabled`, etc.) vía spread.

| Prop | Valores posibles | Por defecto |
|---|---|---|
| `variant` | `'primary'`, `'secondary'`, `'danger'` | `'primary'` |
| `size` | `'sm'`, `'md'` | `'md'` |
| `className` | string adicional de clases | `''` |

**Usado por:** `Navbar`, `Login`, `Register`, `GameForm`, `ConfirmModal`

---

### `Input.jsx`
Campo de texto con label opcional integrado en un solo componente. El label está asociado al input mediante `htmlFor` / `id`: si el caller no pasa un `id` explícito, se genera uno automáticamente a partir del texto del label. Esto garantiza que al hacer clic en el label el foco va al campo, y que los lectores de pantalla los asocien correctamente. Acepta todos los atributos nativos de `<input>` vía spread.

**Usado por:** `Login`, `Register`, `GameForm`

---

### `Modal.jsx`
Contenedor modal base. Renderiza un overlay oscuro semitransparente a pantalla completa con una tarjeta centrada (`surface-card`). Solo provee la estructura visual; el contenido lo recibe como `children`.

**Usado por:** `ConfirmModal`

---

### `ConfirmModal.jsx`
Modal de confirmación para acciones destructivas. Compone `Modal` con un párrafo de texto y dos botones: `Cancelar` y el botón de confirmación.

| Prop | Descripción | Por defecto |
|---|---|---|
| `message` | Texto de la pregunta de confirmación | — |
| `onConfirm` | Función que se ejecuta al confirmar | — |
| `onCancel` | Función que se ejecuta al cancelar | — |
| `confirmLabel` | Texto del botón de confirmación | `'Eliminar'` |

**Depende de:** `Modal`, `Button`
**Usado por:** `AdminDashboard`

---

### `GameCard.jsx`
Tarjeta visual de presentación de un videojuego en el catálogo. Recibe el objeto `game` tal como lo retorna Supabase y muestra:

- Imagen de portada (placeholder si no hay URL o si la URL falla al cargar)
- Título, nombre del desarrollador y año de lanzamiento
- Puntuación con efecto de brillo si tiene valor asignado
- Etiquetas de géneros (color oliva) — usan el `id` del género como `key` de React
- Etiquetas de plataformas (color khaki) — usan el `id` de la plataforma como `key` de React

**Usado por:** `Catalog`

---

### `GameFilters.jsx`
Barra de controles de búsqueda y filtrado. Renderiza: campo de texto para buscar por título, selector de género, selector de plataforma, campo numérico de año, campo de puntuación mínima y selector de orden. Recibe todos sus valores y setters como props directamente desde el spread de `filterProps` que retorna `useGameFilters`.

**Usado por:** `Catalog`, `AdminDashboard`

---

### `InlineAddField.jsx`
Campo de texto con botón `+` para insertar un registro nuevo directamente en una tabla de Supabase sin salir del formulario en curso. Al insertar con éxito llama al callback `onAdded` con el objeto creado para que el componente padre actualice su lista local.

| Prop | Descripción |
|---|---|
| `tabla` | Nombre de la tabla destino en Supabase (`'desarrolladores'`, `'generos'` o `'plataformas'`) |
| `onAdded` | Callback que recibe el nuevo objeto insertado |

**Depende de:** `supabaseClient`
**Usado por:** `GameForm` (tres instancias: una por cada tabla relacionada)

---

### `ErrorMessage.jsx`
Muestra un bloque de alerta con el mensaje de error recibido por prop. Si `error` es `null` o `undefined` no renderiza nada. Centraliza el estilo de los mensajes de error en toda la aplicación.

| Prop | Descripción |
|---|---|
| `error` | Texto del error a mostrar, o `null` |

**Usado por:** `Login`, `Register`, `Catalog`, `AdminDashboard`, `GameForm`

---

### `Spinner.jsx`
Círculo de carga animado sin props. Usa `animate-spin` de Tailwind con `border-accent` para mantener coherencia con el sistema de diseño del proyecto.

**Usado por:** `ProtectedRoute`, `AdminRoute`, `Catalog`, `AdminDashboard`

---

## Páginas

### `Login.jsx`
Formulario de inicio de sesión. Delega toda su lógica a `useAuthForm`, pasándole `supabase.auth.signInWithPassword` como función de autenticación. Al completar el login con éxito redirige a `/catalog`.

**Depende de:** `useAuthForm`, `Input`, `Button`, `ErrorMessage`, `supabaseClient`

---

### `Register.jsx`
Formulario de registro de nueva cuenta. Estructura idéntica a `Login` pero usa `supabase.auth.signUp`. Al registrarse con éxito redirige a `/catalog`.

**Depende de:** `useAuthForm`, `Input`, `Button`, `ErrorMessage`, `supabaseClient`

---

### `Catalog.jsx`
Vista principal del catálogo para usuarios autenticados. Muestra la barra de filtros sobre un grid responsivo de `GameCard`. Usa `useGameFilters` (con paginación activa) para toda la lógica de datos. Mientras carga muestra un `Spinner` centrado; si no hay resultados muestra un mensaje de texto.

Al pie del grid aparece la paginación numerada cuando el total de resultados supera los 12 juegos por página: botones `←` y `→` para avanzar de a una página, y botones numerados que muestran siempre la primera y la última página más las dos adyacentes a la activa, con `…` como separador cuando hay saltos. La página activa se resalta con el color de acento del tema.

**Depende de:** `useGameFilters`, `GameCard`, `GameFilters`, `ErrorMessage`, `Spinner`

---

### `AdminDashboard.jsx`
Panel de control exclusivo para administradores. Muestra los videojuegos en una tabla con columnas de título, desarrollador, año y puntuación, con botones de editar y eliminar en cada fila. Reutiliza los mismos filtros del catálogo a través de `useGameFilters({ paginate: false })`, lo que trae todos los registros sin paginación para facilitar la gestión completa del inventario. Al eliminar un juego abre un `ConfirmModal` y ejecuta las borras en orden estricto: primero `videojuegos_generos`, luego `videojuegos_plataformas` y finalmente `videojuegos`, respetando las restricciones de integridad referencial de la base de datos.

**Depende de:** `useGameFilters`, `GameFilters`, `ConfirmModal`, `ErrorMessage`, `Spinner`, `supabaseClient`

---

### `GameForm.jsx`
Formulario de creación y edición de videojuegos. Opera en dos modos según la URL:

- **Modo creación** (`/admin/new`): todos los campos en blanco; al guardar inserta un nuevo registro en `videojuegos`
- **Modo edición** (`/admin/edit/:id`): precarga los datos del juego y sus relaciones al montar; al guardar actualiza el registro existente

Maneja los campos `titulo`, `anio`, `puntuacion`, `imagen_url` y `desarrollador_id`, además de las relaciones N:M con `generos` y `plataformas` mediante checkboxes. Para guardar las relaciones usa el patrón delete + insert: elimina todos los registros existentes en las tablas intermedias y los reinserta con los valores seleccionados. Incluye tres instancias de `InlineAddField` para agregar desarrolladores, géneros o plataformas sin abandonar el formulario.

**Depende de:** `InlineAddField`, `Input`, `Button`, `ErrorMessage`, `supabaseClient`

---

## Mapa de relaciones

```
App.jsx
├── AuthProvider (AuthContext.jsx)
│   └── estado de sesión disponible en toda la app vía useAuth
│
├── Navbar.jsx ─────────────────── useAuth, Button, supabaseClient
│
├── ProtectedRoute.jsx ─────────── useAuth, Spinner
│   └── Catalog.jsx ─────────────── useGameFilters
│                                       ├── GameFilters
│                                       ├── GameCard
│                                       ├── ErrorMessage
│                                       └── Spinner
│
└── AdminRoute.jsx ─────────────── useAuth, Spinner
    ├── AdminDashboard.jsx ─────── useGameFilters
    │                                   ├── GameFilters
    │                                   ├── ConfirmModal -> Modal, Button
    │                                   ├── ErrorMessage
    │                                   └── Spinner
    └── GameForm.jsx ───────────── Input, Button, ErrorMessage
                                        └── InlineAddField -> supabaseClient


Flujo de datos hacia Supabase
─────────────────────────────
AuthContext      ──► supabaseClient  (sesión + tabla profiles)
useGameFilters   ──► supabaseClient  (query videojuegos con joins y filtros)
useAuthForm      ──► supabaseClient  (signIn / signUp vía parámetro)
InlineAddField   ──► supabaseClient  (insert en desarrolladores/generos/plataformas)
AdminDashboard   ──► supabaseClient  (delete videojuegos y tablas intermedias)
GameForm         ──► supabaseClient  (insert/update videojuegos y tablas intermedias)
```
