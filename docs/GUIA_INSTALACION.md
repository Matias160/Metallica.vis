# Guía de Instalación y Configuración — metallica.vis

Esta guía detalla los pasos para levantar el entorno de desarrollo tanto del **Backend** como del **Frontend**, configurar la base de datos MySQL/MariaDB y generar el archivo **APK para Android**.

---

## 1. Requisitos Previos

- **Node.js**: versión 18.x o superior (se recomienda Node 20 LTS o superior).
- **Gestor de Paquetes**: `npm` (incluido con Node) o `yarn`.
- **Servidor de Base de Datos**: MySQL 8.0+ o MariaDB 10.4+ (por ejemplo a través de XAMPP, WAMP o Docker).
- **Git**: para clonar y versionar el repositorio.
- **Expo CLI**: `npm install -g expo-cli eas-cli` (opcional pero recomendado para desarrollo móvil).
- **Dispositivo de Prueba**:
  - Un navegador web moderno (para la versión Web).
  - O un teléfono móvil Android con la app **Expo Go** instalada.
  - O un emulador Android (Android Studio).

---

## 2. Base de Datos (MySQL / MariaDB)

1. Iniciar el servicio de MySQL / MariaDB (por ejemplo abriendo el Panel de Control de XAMPP y tocando *Start* en MySQL).
2. Abrir una consola o cliente gráfico (phpMyAdmin, MySQL Workbench o HeidiSQL).
3. Crear la base de datos e importar el esquema y los datos iniciales de demostración:

```sql
-- 1. Crear base de datos
CREATE DATABASE IF NOT EXISTS metallica_vis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE metallica_vis;

-- 2. Ejecutar backend/database/schema.sql
-- 3. Ejecutar backend/database/seed.sql
```

*Alternativa desde la consola de Windows (PowerShell / CMD):*
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS metallica_vis;"
mysql -u root -p metallica_vis < backend/database/schema.sql
mysql -u root -p metallica_vis < backend/database/seed.sql
```

---

## 3. Configuración del Backend (API Node.js + Express)

1. Ingresar a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```

3. Crear el archivo de variables de entorno `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```

4. Verificar los parámetros dentro de `backend/.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=metallica_vis
   DB_USER=root
   DB_PASSWORD=
   JWT_ACCESS_SECRET=metallica-vis-access-local-secret
   JWT_REFRESH_SECRET=metallica-vis-refresh-local-secret
   ```

5. Iniciar el servidor backend en modo desarrollo:
   ```bash
   npm run dev
   ```
   El servidor responderá en `http://localhost:3000`. Podés verificar su estado accediendo a `http://localhost:3000/api/health`.

---

## 4. Configuración del Frontend (React Native + Expo)

1. Abrir una nueva terminal e ingresar a la carpeta `frontend`:
   ```bash
   cd frontend
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Iniciar el entorno de desarrollo Expo:
   ```bash
   npx expo start
   ```

4. **Para probar en el Navegador Web:**
   - Presioná la tecla `w` en la consola para abrir la versión Web (`http://localhost:8081`).

5. **Para probar en un Teléfono Móvil Android (Expo Go):**
   - Asegurate de que la computadora y el teléfono estén conectados a la **misma red Wi-Fi**.
   - En `frontend/src/api/client.js`, verificá que la IP coincida con la IP local de tu PC (o utilizá `npx expo start --tunnel` si estás en redes separadas).
   - Abrí la app **Expo Go** en Android y escaneá el código QR que figura en la consola.

---

## 5. Generación del Archivo APK para Android

Para generar el archivo ejecutable `.apk` instalable en cualquier dispositivo Android, se utiliza **EAS Build** (servicio oficial de compilación en la nube de Expo) o la compilación local con Android Studio:

### Método A: Generación con EAS Build (Recomendado)
El proyecto ya cuenta con el archivo `frontend/eas.json` configurado con el perfil `preview` con tipo de compilación APK directo:

1. Instalar la herramienta EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Iniciar sesión con tu cuenta gratuita de Expo:
   ```bash
   eas login
   ```

3. Vincular el proyecto (se hace una sola vez):
   ```bash
   cd frontend
   eas project:init
   ```

4. Disparar la generación del APK para Android:
   ```bash
   eas build -p android --profile preview
   ```
5. Al finalizar el proceso en la nube, la consola te brindará un enlace directo de descarga para bajar el archivo `.apk` a tu teléfono o enviarlo al evaluador.

### Método B: Generación Local con Android Studio / Gradle
Si contás con Android Studio y Android SDK configurados en tu máquina:
```bash
cd frontend
npx expo run:android --variant release
```
El archivo APK generado se ubicará en `frontend/android/app/build/outputs/apk/release/app-release.apk`.

---

## 6. Usuarios Demo para Evaluación Rápida

| Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Coleccionista** | `collector@metallica.vis` | `Password123!` | Catálogo, Mi Colección, Reproducción, Desgaste, Dubbeo y Linaje. |
| **Artista** | `artist@metallica.vis` | `Password123!` | Todo lo anterior + Estudio Artista con ABML de canciones y tiradas. |
| **Admin** | `admin@metallica.vis` | `Password123!` | Todo lo anterior + Panel Admin con métricas, verificación y auditoría. |
