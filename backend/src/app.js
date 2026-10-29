// Configura Express, sus rutas y el manejo centralizado de errores.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import copiesRoutes from './routes/copies.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../public/uploads');

const app = express();

app.use(cors());
// Permitir subida de archivos de audio / imágenes con límite de 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos subidos (audio y carátulas)
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({
    name: 'metallica.vis API',
    status: 'ok',
    version: '0.1.0'
  });
});

app.use('/api/auth', authRoutes);
// Rutas de subida y verificación pública de QR
app.use('/api', uploadRoutes);
app.use('/api', catalogRoutes);
app.use('/api', copiesRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'La ruta solicitada no existe'
    }
  });
});

app.use(errorMiddleware);

export default app;
