# Autenticación

La aplicación ofrece `/registro`, `/login` y `/cuenta` (protegida por `AuthGuard`).
El backend todavía debe implementar la autenticación. No hay usuarios ni respuestas
simuladas en la aplicación; las pruebas usan `HttpTestingController`.

La URL se configura mediante `API_BASE_URL` en `src/app/core/config/api.config.ts`.
Su valor predeterminado es `https://sherry-cards-shop-api-production.up.railway.app`.

## Contrato esperado

Todas las respuestas satisfactorias usan `ApiResponse<T>`:

```ts
{ success: true, message: string, data: T, timestamp: string }
```

| Ruta | Cuerpo enviado | Respuesta utilizada |
| --- | --- | --- |
| `POST /api/auth/register` | `username`, `email`, `nombre`, `apellidos` si se indica, `password` | `ApiResponse<unknown>` |
| `POST /api/auth/login` | `email`, `password` | `ApiResponse<unknown>`, seguido de `/me` |
| `POST /api/auth/logout` | `{}` | `ApiResponse<unknown>` |
| `POST /api/auth/refresh` | `{}` | `ApiResponse<unknown>`, seguido de `/me` |
| `GET /api/auth/me` | Sin cuerpo | `ApiResponse<User>` |

`User` contiene `id` numérico, `username`, `email`, `nombre`, `apellidos` nullable,
`role`, `status`, `emailVerifiedAt` nullable y `lastAccessAt` nullable. Las fechas
son cadenas ISO. El frontend no interpreta valores concretos de rol o estado.
La comprobación de permisos corresponde siempre a la API.

`confirmPassword` solo valida la coincidencia en el cliente. No se envían rol,
estado, `google_sub` ni permisos. El servicio construye explícitamente los DTO de
registro y login para impedir el envío accidental de campos adicionales.

El registro admite nombres de usuario de 3 a 30 caracteres, con letras ASCII
`A–Z`/`a–z`, números, guion y guion bajo. No normaliza ni elimina espacios para
evitar aceptar silenciosamente un nombre distinto al introducido.

Para conflictos, devolver HTTP `409` y un `message` que identifique `username`
(o «nombre de usuario») o `email` (o «correo»). Por ejemplo:

```json
{ "success": false, "message": "El username ya existe", "data": null, "timestamp": "2026-09-30T10:00:00Z" }
```

La interfaz muestra un mensaje en español junto al campo correspondiente. Si un
`409` no identifica el campo, muestra que el usuario o el correo ya están registrados.
Los errores de red, validación, credenciales, autorización, servicio no disponible y
límite de intentos también tienen mensajes en español.

## Sesión y cookies

- Las cinco rutas usan `withCredentials: true` y `transferCache: false`.
- El interceptor se limita a `/api/auth/` de la API configurada. Las rutas públicas
  de categorías y novedades conservan sus peticiones sin credenciales.
- No se guardan contraseñas, JWT ni refresh tokens en almacenamiento web. El único
  estado persistente de autenticación lo gestionan las cookies HttpOnly de la API.
  El perfil se mantiene en señales en memoria.
- Al abrir la aplicación en el navegador se consulta `/me`. Un `401` provoca un
  solo intento de `/refresh` y una nueva consulta a `/me`; no hay reintentos en bucle.
  Las recuperaciones y renovaciones simultáneas comparten la misma petición.
- No se consultan sesiones durante SSR/prerender. Las pantallas de autenticación
  y cuenta se renderizan en el cliente, y no se transfieren perfiles mediante la
  caché de hidratación de Angular.
- El registro redirige a login con confirmación de creación de cuenta. No presupone
  que registrar a un usuario cree una sesión automáticamente. Login recupera `/me`
  y redirige a la ruta interna solicitada, o a `/cuenta` por defecto.
- Logout espera la confirmación de la API antes de borrar el perfil. Un `401`
  también termina la sesión local; un fallo de red permite reintentar.

Al servir el frontend desde Vercel y la API desde Railway, la API debe permitir el
origen exacto del frontend mediante CORS con credenciales (no `*`) y las cookies
deben configurarse con `HttpOnly; Secure; SameSite=None`. Debe atender las peticiones
OPTIONS para JSON y validar los orígenes de las operaciones que cambian estado como
parte de su protección CSRF. Las restricciones del navegador a cookies de terceros
pueden requerir desplegar frontend y API bajo un mismo sitio.

No se han enviado registros o inicios de sesión a producción para verificar esta
interfaz. Cuando estén disponibles los endpoints, validar con el contrato anterior,
las cookies y el dominio real de Vercel.
