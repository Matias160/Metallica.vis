# Documentación Técnica de la API RESTful — metallica.vis

Todas las rutas de la API responden bajo el prefijo `/api` en formato JSON. Las rutas protegidas requieren la cabecera HTTP:
`Authorization: Bearer <accessToken>`

---

## 1. Módulo de Autenticación (`/api/auth`)

### 1.1. `POST /api/auth/register`
Crea una nueva cuenta de usuario en el sistema.
- **Acceso:** Público.
- **Body (JSON):**
  - `username` (string, obligatorio): Nombre de usuario único.
  - `email` (string, obligatorio): Correo electrónico único.
  - `password` (string, obligatorio, mín. 8 caracteres): Contraseña en texto plano (se hashea con bcrypt 12 rounds).
  - `displayName` (string, obligatorio): Nombre para mostrar o nombre artístico.
  - `role` (string, opcional, por defecto `'collector'`): Puede ser `'collector'`, `'artist'` o `'admin'`.
- **Respuesta 201 Created:**
  ```json
  {
    "user": {
      "id": 5,
      "username": "dave_mustaine",
      "email": "dave@metallica.vis",
      "display_name": "Dave Mustaine",
      "roles": ["collector"]
    }
  }
  ```
- **Errores:** `400 INVALID_INPUT`, `409 DUPLICATE_USER`.

---

### 1.2. `POST /api/auth/login`
Inicia sesión con credenciales tradicionales.
- **Acceso:** Público.
- **Body (JSON):**
  - `email` (string, obligatorio)
  - `password` (string, obligatorio)
- **Respuesta 200 OK:**
  ```json
  {
    "user": {
      "id": 1,
      "username": "coleccionista_demo",
      "email": "collector@metallica.vis",
      "display_name": "Coleccionista Demo",
      "roles": ["collector"]
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Errores:** `401 INVALID_CREDENTIALS`.

---

### 1.3. `POST /api/auth/social-login`
Autenticación e integración con 3 redes sociales (Google, Facebook, Apple).
- **Acceso:** Público.
- **Body (JSON):**
  - `provider` (string, obligatorio): `'google'`, `'facebook'` o `'apple'`.
  - `providerId` (string, obligatorio): Identificador social del usuario.
  - `email` (string, obligatorio): Correo devuelto por el proveedor social.
  - `displayName` (string, opcional): Nombre devuelto por el perfil social.
- **Respuesta 200 OK:** Devuelve el objeto `user`, `accessToken`, `refreshToken` y `provider`.
- **Errores:** `400 INVALID_INPUT`.

---

### 1.4. `POST /api/auth/refresh`
Renueva un Access Token expirado usando un Refresh Token válido almacenado en base de datos.
- **Body (JSON):** `{ "refreshToken": "..." }`
- **Respuesta 200 OK:** `{ "accessToken": "..." }`
- **Errores:** `401 INVALID_REFRESH_TOKEN`.

---

### 1.5. `GET /api/auth/me`
Obtiene la información y roles actualizados del usuario autenticado.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Respuesta 200 OK:** `{ "user": { "id": 1, "username": "...", "roles": ["..."] } }`

---

## 2. Módulo de Catálogo y Artistas (`/api`)

### 2.1. `GET /api/artists`
Lista todos los sellos y artistas registrados.

### 2.2. `POST /api/artists`
Da de alta un nuevo sello discográfico o perfil artístico.
- **Permisos:** Requiere rol `artist` o `admin`.
- **Body:** `{ "name": "Megaforce Records", "biography": "Sello pionero del thrash metal" }`

### 2.3. `PUT /api/artists/:id`
Modifica los datos de un artista existente.
- **Permisos:** Dueño del artista o `admin`.

### 2.4. `POST /api/artists/:id/verify`
Certifica oficialmente a un artista/sello con insignia verificada.
- **Permisos:** Exclusivo rol `admin`.

### 2.5. `GET /api/tracks`
Lista todas las canciones registradas con datos de su sello.

### 2.6. `GET /api/tracks/:id`
Detalle de una pista por su identificador.

### 2.7. `POST /api/tracks`
Crea una nueva canción en el máster central.
- **Permisos:** Requiere rol `artist` o `admin` y que el artista esté verificado.
- **Body:**
  ```json
  {
    "artistId": 1,
    "title": "Hit the Lights (Demo 1982)",
    "description": "Primera grabación en cassette de 4 canales",
    "audioUrl": "https://dominio.com/audio/hit-the-lights.mp3",
    "licenseType": "demo"
  }
  ```

### 2.8. `PUT /api/tracks/:id`
Modifica título, descripción o URL de audio de una canción.
- **Permisos:** Dueño del artista o `admin`.

### 2.9. `DELETE /api/tracks/:id`
Elimina una pista del catálogo. Valida que no existan copias en manos de coleccionistas.
- **Permisos:** Dueño del artista o `admin`.
- **Errores:** `422 TRACK_HAS_CIRCULATION`.

### 2.10. `GET /api/pressings`
Lista las tiradas físicas activas y la cantidad de copias disponibles.

### 2.11. `POST /api/pressings`
Acuña una tirada física limitada de casetes para una pista dada.
- **Permisos:** Requiere rol `artist` o `admin`.
- **Body:** `{ "trackId": 1, "totalCopies": 10, "generationLimit": 5 }`

---

## 3. Módulo de Colección y Dubbeo (`/api`)

### 3.1. `GET /api/collection`
Lista todas las copias físicas en posesión del usuario actual (`status = 'owned'`).
- **Respuesta 200 OK:**
  ```json
  {
    "copies": [
      {
        "id": 1,
        "track_title": "Ashes on Magnetic Tape",
        "copy_number": 1,
        "generation": 0,
        "condition_value": 100,
        "playback_count": 0,
        "status": "owned"
      }
    ]
  }
  ```

### 3.2. `POST /api/copies/claim`
Adquiere la siguiente copia física disponible de una tirada y la agrega a la colección.
- **Body:** `{ "pressingId": 1 }`
- **Respuesta 201 Created:** `{ "copyId": 2, "copyNumber": 2 }`
- **Errores:** `404 SOLD_OUT`.

### 3.3. `DELETE /api/copies/:id`
Archiva y remueve una copia de la colección activa del usuario.
- **Permisos:** Dueño de la copia o `admin`.

### 3.4. `POST /api/copies/:id/play`
Registra la escucha de una cinta. Aplica degradación física y sonora (`condition_value`), incrementa el contador de reproducciones y guarda el registro en `playback_history`.
- **Permisos:** Dueño de la copia.
- **Respuesta 200 OK:** `{ "message": "Reproducción registrada", "conditionValue": 99, "degradationApplied": 1 }`

### 3.5. `POST /api/copies/:id/dub`
Realiza el proceso central de *tape trading*: graba una copia hija incrementando la generación (`parent.generation + 1`), degrada la condición sonora por traspaso analógico, transfiere la nueva copia al destinatario y marca la original como `transferred`.
- **Permisos:** Dueño de la copia.
- **Body:** `{ "recipientUserId": 2 }`
- **Respuesta 201 Created:** `{ "message": "Copia dubbeada correctamente", "copyId": 15, "generation": 1 }`
- **Errores:** `403 FORBIDDEN`, `422 GENERATION_LIMIT`, `404 RECIPIENT_NOT_FOUND`.

### 3.6. `GET /api/copies/:id/lineage`
Consulta la cadena completa de custodia y linaje histórico de una cinta (emisor, receptor, generación y fecha de transferencia).
- **Permisos:** Dueño actual, usuarios participantes de la cadena o `admin`.

---

## 4. Módulo de Administración (`/api/admin`)
*Todas las rutas bajo `/api/admin` exigen exclusivamente el rol `admin`.*

### 4.1. `GET /api/admin/stats`
Devuelve las métricas consolidadas en tiempo real:
```json
{
  "stats": {
    "totalUsers": 4,
    "totalArtists": 1,
    "totalTracks": 1,
    "totalPressings": 1,
    "totalCopiesCirculating": 1,
    "totalPlays": 1,
    "totalTransfers": 1
  }
}
```

### 4.2. `GET /api/admin/users`
Lista todos los usuarios registrados con su correo, estado (`is_active`), roles asignados y cantidad de copias activas en posesión.

### 4.3. `POST /api/admin/users/:id/role`
Asigna o añade un rol a un usuario (`"collector"`, `"artist"` o `"admin"`).
- **Body:** `{ "role": "artist" }`

### 4.4. `PATCH /api/admin/users/:id/status`
Alterna el estado de un usuario entre Activo y Suspendido.
