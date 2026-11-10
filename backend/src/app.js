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

// MEDIO (Auditoría de Seguridad): CORS restrictivo con whitelist en vez de comodín
const allowedOrigins = new Set([
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por política CORS'));
  },
  credentials: true
}));

// Rate limiter en memoria para endpoints de autenticación (máx 30 intentos por minuto por IP)
const authAttempts = new Map();
function authRateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 30;

  const userRecord = authAttempts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count++;
  }
  authAttempts.set(ip, userRecord);

  if (userRecord.count > maxAttempts) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes de autenticación. Intentá de nuevo en un minuto.'
      }
    });
  }
  next();
}

// Permitir subida de archivos con límite de 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos subidos
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({
    name: 'metallica.vis API',
    status: 'ok',
    version: '0.1.0'
  });
});

app.use('/api/auth', authRateLimiter, authRoutes);
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
