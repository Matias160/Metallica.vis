# metallica.vis — Coleccionismo Musical & Tape Trading

> Aplicación académica full-stack desarrollada en **React Native (Expo)** y **Node.js (Express) con MySQL/MariaDB**, inspirada en la cultura del *tape trading* clandestino.

---

## 🎯 Cumplimiento de Consignas del Proyecto

### 1. Requisitos Funcionales
- **Registro e Inicio de Sesión:**
  - Formulario de Registro con selección de rol inicial y validación en tiempo real.
  - Inicio de sesión tradicional con email y contraseña.
  - **Autenticación con 3 Redes Sociales:** Google, Facebook y Apple integradas mediante endpoint `/api/auth/social-login`.
  - Botones de acceso rápido para evaluar los 3 roles demo en 1 clic.
- **Roles de Usuario (3 Mínimo):**
  - **1. Coleccionista (`collector`):** Catálogo, adquisición de cintas físicas, escucha con degradación y desgaste, dubbeo a otros usuarios y consulta de linaje.
  - **2. Artista / Sello (`artist`):** Acceso al *Estudio Artista*, con **ABML completo** de canciones y acuñación de tiradas limitadas (pressings).
  - **3. Administrador / Archivista (`admin`):** Acceso al *Panel Admin* con estadísticas del sistema en tiempo real, auditoría, verificación de sellos, suspensión/activación de usuarios y asignación de roles.
- **Consumo de API (ABML / CRUD Completo):**
  - **Alta (Create):** Registro de usuario, alta de pistas, acuñación de tiradas físicas, adquisición de copias, creación de dubs de cintas.
  - **Baja (Delete):** Baja de pistas (valida que no haya copias en manos de usuarios) y baja/archivo de copias de la colección activa.
  - **Modificación (Update):** Edición de canciones, degradación física de condición por reproducción, verificación de artistas, cambio de roles y estados.
  - **Lectura (Read):** Catálogo de pistas, tiradas, colección personal, detalle de copias, linaje de custodia, listado de usuarios y métricas de auditoría.
- **Manejo de Errores y UI:**
  - Respuestas JSON estructuradas con códigos semánticos (`code` y `message`).
  - Mensajes de estado dentro de la interfaz, sin `alert` ni ventanas emergentes, y validación amigable en formularios.
  - Modo día/noche persistente: se cambia desde **Mi Perfil** y se conserva al volver a abrir la aplicación.

### 2. Requisitos Técnicos de Frontend (React Native)
- **Navegación:** `React Navigation` fluido con combinación de `NativeStackNavigator` (Auth) y `BottomTabNavigator` (Main) con pestañas dinámicas condicionales según el rol del usuario autenticado.
- **Estado y Contexto:** `AuthContext` (Context API) centralizado para gestionar el usuario, token JWT, roles, inicio de sesión, registro, social login y refresco de permisos.
- **Autenticación Persistente:** Persistencia mediante `@react-native-async-storage/async-storage` para que el usuario mantenga su sesión activa al cerrar y volver a abrir la app.
- **Diseño Responsivo:** Paleta retro adaptable con modos día/noche, animaciones fluidas con `Animated` y soporte para Web y Android.

### 3. Requisitos Técnicos de Backend
- **Node.js + Express (ES Modules):** Arquitectura modular dividida en rutas, controladores, middlewares de autenticación/roles y utilidades.
- **Seguridad y JWT:** Autenticación por tokens JWT (Access Token de 15 min y Refresh Token persistido en BD de 7 días). Hasheo de contraseñas con `bcryptjs` (cost factor 12).
- **Base de Datos MySQL / MariaDB:** Base relacional normalizada en tercera forma normal (`users`, `roles`, `user_roles`, `social_accounts`, `artists`, `tracks`, `pressings`, `copies`, `lineage`, `playback_history`, `refresh_tokens`). Compatible tanto con MySQL 8.0 como con MariaDB 10.4+.
- **Gestión de Permisos:** Middlewares `requireAuth` y `requireRole('artist', 'admin')` protegiendo endpoints sensibles.

---

## 📁 Estructura del Proyecto

```
metallica-vis/
├── backend/
│   ├── database/
│   │   ├── schema.sql           # DDL con tablas, llaves foráneas y roles
│   │   └── seed.sql             # Datos demo con contraseñas bcrypt válidas
│   ├── src/
│   │   ├── config/              # Conexión a la base de datos (Pool mysql2)
│   │   ├── controllers/         # Lógica de negocio (Auth, Catálogo, Copias, Admin)
│   │   ├── middlewares/         # Validación de JWT, roles y manejo de errores
│   │   ├── routes/              # Definición de rutas RESTful
│   │   ├── utils/               # Generación y hash de tokens JWT
│   │   ├── app.js               # Configuración de Express y CORS
│   │   └── server.js            # Punto de entrada del servidor
│   ├── .env.example             # Plantilla de variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Cliente fetch tipado con token Bearer
│   │   ├── context/             # AuthContext y sesión persistente
│   │   ├── navigation/          # React Navigation (Stacks y BottomTabs con roles)
│   │   ├── screens/             # Pantallas (Login, Register, Home, Collection, Artist, Admin, Profile)
│   │   └── theme/               # Paleta de colores consistente
│   ├── eas.json                 # Configuración para compilación de APK Android
│   ├── app.json                 # Configuración de Expo
│   └── package.json
├── docs/
│   ├── MANUAL_DE_USUARIO.md     # Manual paso a paso para el usuario
│   ├── GUIA_INSTALACION.md      # Instrucciones de configuración y compilación de APK
│   ├── api.md                   # Documentación detallada de endpoints REST
│   └── architecture.md          # Arquitectura de dominio y tape trading
├── .gitignore                   # Exclusión de node_modules, .env, .expo, etc.
└── README.md                    # Este documento
```

---

## ⚡ Inicio Rápido (Quickstart)

### 1. Base de Datos
Crear la base `metallica_vis` y ejecutar `schema.sql` y `seed.sql`:
```powershell
mysql -u root -p metallica_vis < backend/database/schema.sql
mysql -u root -p metallica_vis < backend/database/seed.sql
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
API lista en `http://localhost:3000`.

### 3. Frontend
```bash
cd frontend
npm install
npx expo start
```
- Presioná `w` para abrir en Navegador Web (`http://localhost:8081`).
- O escaneá el código QR con **Expo Go** en Android.

---

## 👤 Usuarios Demo de Prueba

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Coleccionista** | `collector@metallica.vis` | `Password123!` |
| **Artista** | `artist@metallica.vis` | `Password123!` |
| **Admin** | `admin@metallica.vis` | `Password123!` |

---

## 📱 Compilación del APK para Android

El archivo de configuración `frontend/eas.json` ya está preparado para generar el archivo instalable `.apk`:
```bash
cd frontend
eas build -p android --profile preview
```
Consultá la [Guía de Instalación y APK](docs/GUIA_INSTALACION.md) para más detalles.

---

## 📚 Documentación Adicional
- 📖 [Manual de Usuario](docs/MANUAL_DE_USUARIO.md)
- 🛠 [Guía de Instalación y Configuración](docs/GUIA_INSTALACION.md)
- 🔌 [Documentación Técnica de la API](docs/api.md)
