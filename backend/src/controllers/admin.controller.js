import { pool } from '../config/database.js';

export async function listUsers(_req, res, next) {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.is_active, u.created_at,
              COALESCE(GROUP_CONCAT(r.name), '') AS roles_csv,
              (SELECT COUNT(*) FROM copies c WHERE c.current_owner_id = u.id AND c.status = 'owned') AS owned_copies_count
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
        GROUP BY u.id
        ORDER BY u.id ASC`
    );

    const formatted = users.map(u => ({
      ...u,
      roles: u.roles_csv ? u.roles_csv.split(',') : [],
      roles_csv: undefined
    }));

    res.json({ users: formatted });
  } catch (error) { next(error); }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['collector', 'artist', 'admin'].includes(role)) {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Rol inválido' } });
    }

    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roles[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rol no encontrado' } });

    await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id', [id, roles[0].id]);
    res.json({ message: `Rol ${role} asignado al usuario ${id}` });
  } catch (error) { next(error); }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT is_active FROM users WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario inexistente' } });

    const newStatus = !rows[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
    res.json({ message: `Usuario ${newStatus ? 'activado' : 'suspendido'} correctamente`, isActive: newStatus });
  } catch (error) { next(error); }
}

export async function getStats(_req, res, next) {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalArtists }]] = await pool.query('SELECT COUNT(*) AS totalArtists FROM artists');
    const [[{ totalTracks }]] = await pool.query('SELECT COUNT(*) AS totalTracks FROM tracks');
    const [[{ totalPressings }]] = await pool.query('SELECT COUNT(*) AS totalPressings FROM pressings');
    const [[{ totalCopiesCirculating }]] = await pool.query("SELECT COUNT(*) AS totalCopiesCirculating FROM copies WHERE status = 'owned'");
    const [[{ totalPlays }]] = await pool.query('SELECT COUNT(*) AS totalPlays FROM playback_history');
    const [[{ totalTransfers }]] = await pool.query('SELECT COUNT(*) AS totalTransfers FROM lineage');

    res.json({
      stats: {
        totalUsers,
        totalArtists,
        totalTracks,
        totalPressings,
        totalCopiesCirculating,
        totalPlays,
        totalTransfers
      }
    });
  } catch (error) { next(error); }
}
