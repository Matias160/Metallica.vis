// Verifica tokens, permisos y estado activo de usuarios antes de ejecutar rutas protegidas.
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Se requiere autenticación' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.auth = payload;

    // ALTO (Auditoría de Seguridad): Validar que el usuario no esté suspendido en DB
    if (payload?.sub) {
      const [rows] = await pool.query('SELECT is_active FROM users WHERE id = ?', [payload.sub]);
      if (!rows[0] || !rows[0].is_active) {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Tu cuenta ha sido desactivada o suspendida por un administrador.'
          }
        });
      }
    }

    next();
  } catch {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'El token no es válido o expiró' } });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.auth?.roles || [];
    if (!allowedRoles.some((role) => roles.includes(role))) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tenés permisos para realizar esta acción' } });
    }
    next();
  };
}
