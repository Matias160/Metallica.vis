// Lógica de registro, acceso y recuperación de identidad.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { createAccessToken, createRefreshToken } from '../utils/tokens.js';

async function getUserWithRoles(userId) {
  const [users] = await pool.query(
    'SELECT id, username, email, display_name FROM users WHERE id = ?',
    [userId]
  );
  const user = users[0];
  if (!user) return null;

  const [roleRows] = await pool.query(
    `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?`,
    [userId]
  );
  user.roles = roleRows.map((r) => r.name);
  return user;
}

export async function register(req, res, next) {
  try {
    const { username, email, password, displayName, role = 'collector' } = req.body;
    if (!username || !email || !password || !displayName || password.length < 8) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Completá todos los campos y usá una contraseña de al menos 8 caracteres' } });
    }

    const assignedRole = ['collector', 'artist', 'admin'].includes(role) ? role : 'collector';
    const passwordHash = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
        [username, email.toLowerCase(), passwordHash, displayName]
      );
      const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', [assignedRole]);
      await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [result.insertId, roles[0].id]);
      await connection.commit();
      return res.status(201).json({ user: await getUserWithRoles(result.insertId) });
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: { code: 'DUPLICATE_USER', message: 'El usuario o email ya existe' } });
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ? AND is_active = TRUE', [email?.toLowerCase()]);
    const valid = rows[0] && rows[0].password_hash && await bcrypt.compare(password || '', rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } });
    const user = await getUserWithRoles(rows[0].id);
    const refresh = createRefreshToken(user);
    await pool.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [user.id, refresh.hash]);
    return res.json({ user, accessToken: createAccessToken(user), refreshToken: refresh.token });
  } catch (error) { next(error); }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const [rows] = await pool.query('SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()', [payload.sub, hash]);
    if (!rows[0]) return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'La sesión de renovación no es válida' } });
    const user = await getUserWithRoles(payload.sub);
    return res.json({ accessToken: createAccessToken(user) });
  } catch (error) { return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'La sesión de renovación no es válida' } }); }
}

export async function me(req, res, next) {
  try { return res.json({ user: await getUserWithRoles(req.auth.sub) }); } catch (error) { next(error); }
}

export async function socialLogin(req, res, next) {
  try {
    const { provider, providerId, email, displayName } = req.body;
    if (!['google', 'facebook', 'apple'].includes(provider) || !providerId || !email) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Proveedor (google, facebook o apple), ID social y email requeridos' } });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [socialRows] = await connection.query(
        'SELECT user_id FROM social_accounts WHERE provider = ? AND provider_account_id = ?',
        [provider, providerId]
      );

      let userId;
      if (socialRows.length > 0) {
        userId = socialRows[0].user_id;
      } else {
        const [userRows] = await connection.query(
          'SELECT id FROM users WHERE email = ?',
          [email.toLowerCase()]
        );

        if (userRows.length > 0) {
          userId = userRows[0].id;
        } else {
          const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30) || 'social_user';
          const uniqueUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;
          const [newUser] = await connection.query(
            'INSERT INTO users (username, email, display_name) VALUES (?, ?, ?)',
            [uniqueUsername, email.toLowerCase(), displayName || baseUsername]
          );
          userId = newUser.insertId;

          const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['collector']);
          await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roles[0].id]);
        }

        await connection.query(
          'INSERT INTO social_accounts (user_id, provider, provider_account_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
          [userId, provider, providerId]
        );
      }

      await connection.commit();

      const user = await getUserWithRoles(userId);
      const refresh = createRefreshToken(user);
      await pool.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [user.id, refresh.hash]);
      return res.json({ user, accessToken: createAccessToken(user), refreshToken: refresh.token, provider });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}
