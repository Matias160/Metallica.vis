import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Se requiere autenticación' } });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
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
