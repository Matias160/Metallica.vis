// Operaciones administrativas para usuarios, roles y moderación.
import { pool } from '../config/database.js';

export async function listUsers(_req, res, next) {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_active, u.created_at,
              COALESCE(GROUP_CONCAT(DISTINCT r.name), '') AS roles_csv,
              (SELECT COUNT(*) FROM copies c WHERE c.current_owner_id = u.id AND c.status = 'owned') AS owned_copies_count,
              (SELECT COUNT(*) FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE a.owner_user_id = u.id) AS created_tracks_count,
              (SELECT COUNT(*) FROM lineage l WHERE l.from_user_id = u.id OR l.to_user_id = u.id) AS dubs_count,
              (SELECT COUNT(*) FROM playback_history ph WHERE ph.user_id = u.id) AS plays_count,
              (SELECT a.verified FROM artists a WHERE a.owner_user_id = u.id LIMIT 1) AS artist_verified,
              (SELECT a.id FROM artists a WHERE a.owner_user_id = u.id LIMIT 1) AS artist_id
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
        GROUP BY u.id
        ORDER BY u.id ASC`
    );

    const formatted = users.map(u => ({
      ...u,
      roles: u.roles_csv ? u.roles_csv.split(',').filter(Boolean) : [],
      roles_csv: undefined,
      artist_verified: Boolean(u.artist_verified)
    }));

    res.json({ users: formatted });
  } catch (error) { next(error); }
}

export async function updateUserRole(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { role, action = 'toggle' } = req.body;
    if (!['collector', 'artist', 'admin'].includes(role)) {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Rol inválido' } });
    }

    await connection.beginTransaction();

    const [roleRow] = await connection.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRow[0]) {
      await connection.rollback();
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rol no encontrado' } });
    }
    const roleId = roleRow[0].id;

    const [currentRoles] = await connection.query(
      'SELECT r.id, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?',
      [id]
    );
    const hasRole = currentRoles.some(r => r.name === role);

    if (action === 'toggle' ? hasRole : action === 'remove') {
      if (currentRoles.length <= 1) {
        await connection.rollback();
        return res.status(400).json({ error: { code: 'CANNOT_REMOVE_ONLY_ROLE', message: 'El usuario debe conservar al menos un rol activo.' } });
      }
      await connection.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [id, roleId]);
    } else {
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id',
        [id, roleId]
      );
      if (role === 'artist') {
        const [existingArtist] = await connection.query('SELECT id FROM artists WHERE owner_user_id = ?', [id]);
        if (existingArtist.length === 0) {
          const [u] = await connection.query('SELECT username, display_name FROM users WHERE id = ?', [id]);
          const artistName = u[0]?.display_name || u[0]?.username || 'Sello Independiente';
          await connection.query(
            'INSERT INTO artists (owner_user_id, name, biography, verified) VALUES (?, ?, ?, FALSE)',
            [id, artistName, 'Sello discográfico y artista registrado en plataforma.']
          );
        }
      }
    }

    const [updatedRoles] = await connection.query(
      'SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?',
      [id]
    );

    await connection.commit();
    res.json({
      message: `Roles actualizados para el usuario #${id}`,
      roles: updatedRoles.map(r => r.name)
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function toggleUserLabelVerification(req, res, next) {
  try {
    const { id } = req.params;
    let [artist] = await pool.query('SELECT id, name, verified FROM artists WHERE owner_user_id = ? LIMIT 1', [id]);

    if (artist.length === 0) {
      const [u] = await pool.query('SELECT username, display_name FROM users WHERE id = ?', [id]);
      if (!u[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario inexistente' } });

      const artistName = u[0].display_name || u[0].username;
      await pool.query(
        'INSERT INTO artists (owner_user_id, name, biography, verified) VALUES (?, ?, ?, TRUE)',
        [id, artistName, 'Sello y creador verificado por el archivista.', true]
      );
      const [r] = await pool.query("SELECT id FROM roles WHERE name = 'artist'");
      if (r[0]) {
        await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, r[0].id]);
      }
      return res.json({ message: `Sello "${artistName}" creado y certificado como Sello Verificado`, verified: true });
    }

    const newVerified = !artist[0].verified;
    await pool.query('UPDATE artists SET verified = ? WHERE id = ?', [newVerified, artist[0].id]);
    res.json({
      message: `Sello "${artist[0].name}" ${newVerified ? 'certificado como Sello Verificado' : 'desmarcado de verificación'}`,
      verified: newVerified
    });
  } catch (error) { next(error); }
}

export async function deleteTrack(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [trackRows] = await connection.query('SELECT id, title FROM tracks WHERE id = ?', [id]);
    if (!trackRows[0]) {
      await connection.rollback();
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista no encontrada' } });
    }
    const trackTitle = trackRows[0].title;

    const [pressings] = await connection.query('SELECT id FROM pressings WHERE track_id = ?', [id]);
    const pressingIds = pressings.map(p => p.id);

    if (pressingIds.length > 0) {
      const [copies] = await connection.query('SELECT id FROM copies WHERE pressing_id IN (?)', [pressingIds]);
      const copyIds = copies.map(c => c.id);

      if (copyIds.length > 0) {
        await connection.query('DELETE FROM playback_history WHERE copy_id IN (?)', [copyIds]);
        await connection.query('DELETE FROM lineage WHERE parent_copy_id IN (?) OR child_copy_id IN (?)', [copyIds, copyIds]);
        await connection.query('DELETE FROM copies WHERE id IN (?)', [copyIds]);
      }

      await connection.query('DELETE FROM pressings WHERE id IN (?)', [pressingIds]);
    }

    await connection.query('DELETE FROM tracks WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: `Pista "${trackTitle}" eliminada del catálogo y máster con éxito` });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function getUserPublicProfile(req, res, next) {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      `SELECT id, username, display_name, avatar_url, created_at, is_active
         FROM users WHERE id = ?`,
      [id]
    );
    const user = users[0];
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } });

    const [roles] = await pool.query(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [id]
    );
    user.roles = roles.map(r => r.name);

    const [artistRows] = await pool.query(
      `SELECT id, name, biography, verified, created_at FROM artists WHERE owner_user_id = ? LIMIT 1`,
      [id]
    );
    const artist = artistRows[0] || null;

    let createdTracks = [];
    if (artist) {
      const [tracks] = await pool.query(
        `SELECT t.id, t.title, t.description, t.cover_url, t.audio_url, t.duration_seconds, t.is_featured, t.created_at,
                p.id AS pressing_id, p.total_copies, p.available_copies
           FROM tracks t
           LEFT JOIN pressings p ON p.track_id = t.id
          WHERE t.artist_id = ?
          ORDER BY t.created_at DESC`,
        [artist.id]
      );
      createdTracks = tracks;
    }

    const [copies] = await pool.query(
      `SELECT c.id, c.copy_number, c.generation, c.condition_value, c.status, c.created_at,
              t.id AS track_id, t.title AS track_title, t.cover_url, t.audio_url, a.name AS artist_name
         FROM copies c
         JOIN pressings p ON p.id = c.pressing_id
         JOIN tracks t ON t.id = p.track_id
         JOIN artists a ON a.id = t.artist_id
        WHERE c.current_owner_id = ? AND c.status = 'owned'
        ORDER BY c.created_at DESC`,
      [id]
    );

    const [dubs] = await pool.query(
      `SELECT COUNT(*) AS total FROM lineage WHERE from_user_id = ? OR to_user_id = ?`,
      [id, id]
    );
    const [plays] = await pool.query(
      `SELECT COUNT(*) AS total FROM playback_history WHERE user_id = ?`,
      [id]
    );

    res.json({
      profile: {
        user,
        artist,
        stats: {
          ownedCopiesCount: copies.length,
          createdTracksCount: createdTracks.length,
          dubsCount: dubs[0]?.total || 0,
          playsCount: plays[0]?.total || 0
        },
        createdTracks,
        copies
      }
    });
  } catch (error) { next(error); }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT is_active, username FROM users WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario inexistente' } });

    const newStatus = !rows[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
    if (!newStatus) {
      // Revocar todas sus sesiones activas de inmediato
      await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [id]);
    }
    res.json({
      message: `Usuario @${rows[0].username} ${newStatus ? 'activado' : 'baneado/suspendido'} correctamente`,
      isActive: newStatus
    });
  } catch (error) { next(error); }
}

export async function toggleTrackFeatured(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, title, is_featured FROM tracks WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista inexistente' } });

    const newFeatured = !rows[0].is_featured;
    await pool.query('UPDATE tracks SET is_featured = ? WHERE id = ?', [newFeatured, id]);

    res.json({
      message: `Pista “${rows[0].title}” ${newFeatured ? 'marcada como destacada' : 'removida de destacadas'}`,
      isFeatured: newFeatured
    });
  } catch (error) { next(error); }
}

export async function getStats(_req, res, next) {
  try {
    // Optimización SQL / Backend: Ejecución en paralelo con Promise.all para reducir latencia
    const [
      [[{ totalUsers }]],
      [[{ totalArtists }]],
      [[{ totalTracks }]],
      [[{ totalPressings }]],
      [[{ totalCopiesCirculating }]],
      [[{ totalPlays }]],
      [[{ totalTransfers }]]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS totalUsers FROM users'),
      pool.query('SELECT COUNT(*) AS totalArtists FROM artists'),
      pool.query('SELECT COUNT(*) AS totalTracks FROM tracks'),
      pool.query('SELECT COUNT(*) AS totalPressings FROM pressings'),
      pool.query("SELECT COUNT(*) AS totalCopiesCirculating FROM copies WHERE status = 'owned'"),
      pool.query('SELECT COUNT(*) AS totalPlays FROM playback_history'),
      pool.query('SELECT COUNT(*) AS totalTransfers FROM lineage')
    ]);

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
