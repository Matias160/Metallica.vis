import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function createRefreshToken(user) {
  const token = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { token, hash: crypto.createHash('sha256').update(token).digest('hex') };
}
