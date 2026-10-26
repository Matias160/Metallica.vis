import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import copiesRoutes from './routes/copies.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    name: 'metallica.vis API',
    status: 'ok',
    version: '0.1.0'
  });
});

app.use('/api/auth', authRoutes);
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
