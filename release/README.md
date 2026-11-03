# 📱 metallica.vis — Distribución de APK Android

Este directorio está destinado a la distribución y entrega del instalador nativo **APK** de **metallica.vis** para dispositivos Android.

---

## 📥 Enlaces Directos de Descarga Oficial

1. **GitHub Releases (Recomendado):**
   - Puedes descargar siempre la versión compilada más reciente desde la sección de Releases oficial del repositorio:
   - 🔗 **[Descargar última versión de APK en GitHub Releases](https://github.com/Matias160/Metallica.vis/releases/latest)**

2. **Panel de Compilación de Expo EAS:**
   - 🔗 **[Ver builds generados en EAS Dashboard](https://expo.dev/accounts/matusalen/projects/metallica-vis/builds)**

---

## 🚀 Cómo compilar o actualizar el archivo APK

Para generar una nueva versión de APK utilizando el servicio en la nube de Expo EAS:

```bash
cd frontend
npx eas-cli build --platform android --profile preview
```

Una vez finalizada la compilación (5-8 minutos):
1. Copia el archivo `.apk` descargado a esta carpeta (`release/metallica-vis.apk`).
2. Haz commit y push al repositorio de GitHub:
   ```bash
   git add release/metallica-vis.apk
   git commit -m "chore: actualizar archivo APK para entrega"
   git push origin main
   ```

---

## 📲 Instrucciones de Instalación en Celulares Android

1. Descarga el archivo `metallica-vis.apk` en tu dispositivo Android.
2. Abre el archivo descargado desde las notificaciones o la carpeta de **Descargas**.
3. Si el sistema te lo solicita, activa la opción **"Permitir instalar aplicaciones de fuentes desconocidas"** en la configuración de seguridad.
4. Presiona **Instalar** y luego **Abrir**.
5. Disfruta de la experiencia analógica y de tape trading de **metallica.vis**.
