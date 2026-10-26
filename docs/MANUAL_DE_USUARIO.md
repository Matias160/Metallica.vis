# Manual de Usuario — metallica.vis

**metallica.vis** es una plataforma móvil y web de coleccionismo musical académico inspirada en la cultura del *tape trading* (intercambio clandestino de casetes en la escena del metal y punk de los años 80). 

A diferencia del streaming tradicional infinito, aquí cada pista musical se publica en **tiradas físicas limitadas** (pressings), cada copia sufre **degradación física y sonora** por el uso (`condition_value`), puede ser **dubbeada** (grabada a otra cinta incrementando la generación) y conserva una **cadena de custodia histórica (linaje)** auditable.

---

## 1. Registro e Inicio de Sesión

### 1.1. Inicio de Sesión Tradicional
1. Ingresá a la pantalla de bienvenida.
2. Completá tu **Correo Electrónico** y **Contraseña**.
3. Presioná el botón **Iniciar Sesión**.

### 1.2. Usuarios Demo de Acceso Rápido
Para agilizar la evaluación académica, la pantalla de inicio incluye 3 botones de acceso rápido que precargan automáticamente las credenciales de cada rol:
- **Coleccionista:** `collector@metallica.vis` (Rol 1)
- **Artista:** `artist@metallica.vis` (Rol 2)
- **Admin:** `admin@metallica.vis` (Rol 3)
*(Todos los usuarios demo utilizan la contraseña `Password123!`)*.

### 1.3. Inicio de Sesión con Redes Sociales (3 Proveedores)
La aplicación permite autenticarse instantáneamente utilizando 3 plataformas sociales:
- **G Google:** Vincula o crea la cuenta asociada al perfil de Google.
- **f Facebook:** Autenticación rápida con perfil de Facebook.
- ** Apple:** Inicio seguro mediante Apple ID.

Al tocar cualquiera de estos botones, el sistema autentica la cuenta social mediante el endpoint seguro `/api/auth/social-login`, registrando el ID del proveedor en la base de datos y manteniendo la sesión persistente.

### 1.4. Registro de Nuevos Usuarios
1. Tocá el enlace **¿No tenés cuenta todavía? Crear cuenta** en la parte inferior del Login.
2. Completá:
   - **Nombre completo o artístico**
   - **Nombre de usuario único** (ej: `metal_trader`)
   - **Correo electrónico**
   - **Contraseña** (mínimo 8 caracteres)
   - **Selección de Rol Principal:**
     - *Coleccionista:* Orientado a adquirir cintas, escucharlas y enviarlas por correo/dubbeo.
     - *Artista / Sello:* Diseñado para publicar canciones y gestionar tiradas.
     - *Admin / Archivista:* Para supervisar, auditar y verificar el catálogo.
3. Presioná **Registrarse y Comenzar**. La sesión se inicia automáticamente tras el alta.

---

## 2. Roles y Permisos en el Sistema

La aplicación cuenta con **3 tipos de roles** claramente diferenciados con interfaces y permisos específicos:

| Rol | Pantallas Disponibles | Capacidades y Permisos |
| :--- | :--- | :--- |
| **1. Coleccionista (`collector`)** | Catálogo, Mi Colección, Mi Perfil | Explorar catálogo, adquirir copias disponibles, reproducir con degradación, dubbear a otros usuarios, consultar linaje y archivar copias. |
| **2. Artista / Sello (`artist`)** | Catálogo, Mi Colección, **Estudio Artista**, Mi Perfil | Todo lo anterior más: Alta, Modificación y Baja (ABML) de canciones, y acuñación de tiradas físicas limitadas (Pressings). |
| **3. Admin / Archivista (`admin`)** | Catálogo, Mi Colección, **Estudio Artista**, **Panel Admin**, Mi Perfil | Auditoría integral del sistema: panel de métricas en tiempo real, verificación de sellos, suspensión/activación de usuarios y cambio de roles. |

---

## 3. Guía de Uso por Pantalla y Módulo

### 3.1. Pantalla "Catálogo" (Inicio)
- Muestra el listado de pistas publicadas en el máster central.
- Cada tarjeta exhibe:
  - Título y artista (con insignia verde `✓ Verificado` si el sello fue validado por un admin).
  - Tipo de licencia (`original`, `demo`, etc.).
  - Cantidad de copias físicas disponibles sobre el total de la tirada.
  - Límite de generaciones que soporta la cinta antes de ser inaudible.
- **Acción "Adquirir Cinta":** Al presionar este botón, se toma la siguiente copia disponible de la tirada física y se agrega a tu colección personal con condición 100% (Gen 0). Si las copias se terminan, se muestra la etiqueta roja `Agotada`.

---

### 3.2. Pantalla "Mi Colección"
Aquí residen todas las cintas que poseés actualmente. En cada tarjeta podés realizar:

1. **▶ Tocar (Reproducir):**
   - Inicia la reproducción de la pista y activa la animación del vinilo/casete en movimiento.
   - Aplica el **desgaste físico y sonoro acumulativo**: cada reproducción reduce el porcentaje de condición física de la cinta según su generación (`condition_value`).
   - Registra el evento en la tabla `playback_history`.

2. **📼 Dubbear (Tape Trading):**
   - Permite grabar una cinta virgen a partir de la tuya y transferirla a otro usuario.
   - Abre una ventana emergente donde ingresás el **ID del usuario destinatario** (este número figura en el perfil de cada usuario, por ejemplo `#2`).
   - Al confirmar:
     - Tu copia original pasa al estado de archivo/histórico `transferred`.
     - El destinatario recibe una nueva copia en su colección con **Generación incrementada (Gen + 1)** y condición degradada por el traspaso de cabezal.
     - Se registra un nuevo nodo en el árbol de **Linaje**.

3. **📜 Linaje (Cadena de Custodia):**
   - Despliega la historia completa de la cinta: muestra cronológicamente todos los coleccionistas que la tuvieron en sus manos, la fecha y hora de cada traspaso, y la generación de la copia.

4. **✕ Quitar (Baja / Archivar):**
   - Permite archivar una copia para retirarla de tu colección activa.

---

### 3.3. Pantalla "Estudio Artista" *(Exclusiva para Artistas y Admin)*
Permite el ciclo de vida completo **ABML (CRUD)** del catálogo musical:

- **Alta de Canción (+ Nueva Pista):** Abre el formulario para ingresar Título, Descripción, URL del audio máster y Tipo de Licencia.
- **Modificación de Canción (✎ Editar):** Permite corregir metadatos de la pista en tiempo real.
- **Baja de Canción (🗑 Eliminar):** Elimina la pista del catálogo (el sistema valida que no existan copias en manos de coleccionistas para proteger la propiedad privada de los usuarios).
- **Acuñar Tirada Física (💿 Crear Tirada):** Define cuántas copias limitadas se fabricarán (ej: 10 copias) y el límite máximo de generaciones permitidas (ej: 5 generaciones). Una vez acuñada, las copias quedan inmediatamente a disposición en el Catálogo.

---

### 3.4. Pantalla "Panel Admin" *(Exclusiva para Administradores)*
Centro de control y auditoría institucional:

- **Métricas en Tiempo Real:**
  - Cantidad total de usuarios registrados.
  - Pistas dadas de alta.
  - Tiradas físicas fabricadas.
  - Copias físicas actualmente en manos de coleccionistas.
  - Total de reproducciones acumuladas en el sistema.
  - Total de intercambios y dubs realizados.
- **Moderación de Sellos:** Listado de sellos discográficos con botón **Verificar** para certificar la autenticidad del artista.
- **Gestión de Usuarios:**
  - Botón para **Suspender / Activar** cuentas de usuarios con 1 clic.
  - Botones de **Asignar Rol** para promover o degradar usuarios entre `Coleccionista`, `Artista` y `Admin`.

---

### 3.5. Pantalla "Mi Perfil"
- Visualiza tu nombre, correo, nombre de usuario y roles actuales.
- **Tu ID de Usuario para Dubbeo:** Muestra en grande tu identificador numérico (ej: `#1`) para que puedas pasárselo a otros coleccionistas para que te dubbeen cintas.
- **Sincronizar Permisos / Datos:** Vuelve a consultar tu sesión contra el servidor para reflejar cambios de roles inmediatos.
- **Cerrar Sesión:** Elimina los tokens locales almacenados en el dispositivo de forma segura.
