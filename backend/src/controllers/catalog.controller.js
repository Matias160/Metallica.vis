// Consultas y edición del catálogo musical.
import { pool } from '../config/database.js';

export async function listArtists(_req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name, biography, verified, created_at FROM artists ORDER BY name');
    res.json({ artists: rows });
  } catch (error) { next(error); }
}

export async function createArtist(req, res, next) {
  try {
    const { name, biography = null } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'El nombre del artista es obligatorio' } });
    const [result] = await pool.query('INSERT INTO artists (owner_user_id, name, biography) VALUES (?, ?, ?)', [req.auth.sub, name.trim(), biography]);
    const [rows] = await pool.query('SELECT * FROM artists WHERE id = ?', [result.insertId]);
    res.status(201).json({ artist: rows[0] });
  } catch (error) { next(error); }
}

export async function verifyArtist(req, res, next) {
  try {
    const [result] = await pool.query('UPDATE artists SET verified = TRUE WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Artista inexistente' } });
    res.json({ message: 'Artista verificado correctamente' });
  } catch (error) { next(error); }
}

export async function listTracks(_req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT t.*, a.name AS artist_name, a.verified
      FROM tracks t JOIN artists a ON a.id = t.artist_id
      ORDER BY t.created_at DESC`);
    res.json({ tracks: rows });
  } catch (error) { next(error); }
}

export async function getTrack(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT t.*, a.name AS artist_name, a.verified
      FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE t.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista inexistente' } });
    res.json({ track: rows[0] });
  } catch (error) { next(error); }
}

export async function createTrack(req, res, next) {
  try {
    const { artistId, title, description = null, audioUrl, coverUrl = null, durationSeconds = null, licenseType = 'original' } = req.body;
    if (!artistId || !title?.trim() || !audioUrl?.trim()) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'artistId, title y audioUrl son obligatorios' } });
    const [artists] = await pool.query('SELECT id, owner_user_id, verified FROM artists WHERE id = ?', [artistId]);
    const artist = artists[0];
    if (!artist) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Artista inexistente' } });
    if (!artist.verified) return res.status(422).json({ error: { code: 'ARTIST_NOT_VERIFIED', message: 'El artista debe estar verificado' } });
    if (artist.owner_user_id !== req.auth.sub && !req.auth.roles.includes('admin')) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Solo el dueño del artista puede crear pistas' } });
    const [result] = await pool.query(`INSERT INTO tracks (artist_id, title, description, audio_url, cover_url, duration_seconds, license_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [artistId, title.trim(), description, audioUrl.trim(), coverUrl, durationSeconds, licenseType]);
    const [rows] = await pool.query('SELECT * FROM tracks WHERE id = ?', [result.insertId]);
    res.status(201).json({ track: rows[0] });
  } catch (error) { next(error); }
}

export async function listPressings(_req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT p.*, t.title AS track_title, a.name AS artist_name
      FROM pressings p JOIN tracks t ON t.id = p.track_id JOIN artists a ON a.id = t.artist_id
      WHERE p.status <> 'archived' ORDER BY p.created_at DESC`);
    res.json({ pressings: rows });
  } catch (error) { next(error); }
}

export async function createPressing(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { trackId, totalCopies, generationLimit = 5 } = req.body;
    if (!trackId || !Number.isInteger(totalCopies) || totalCopies < 1) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'trackId y una cantidad positiva son obligatorios' } });
    await connection.beginTransaction();
    const [tracks] = await connection.query(`SELECT t.id, a.owner_user_id, a.verified FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE t.id = ? FOR UPDATE`, [trackId]);
    const track = tracks[0];
    if (!track) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista inexistente' } });
    if (!track.verified) return res.status(422).json({ error: { code: 'ARTIST_NOT_VERIFIED', message: 'El artista debe estar verificado' } });
    if (track.owner_user_id !== req.auth.sub && !req.auth.roles.includes('admin')) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No podés crear una tirada para este artista' } });
    const [result] = await connection.query('INSERT INTO pressings (track_id, total_copies, available_copies, generation_limit, status) VALUES (?, ?, ?, ?, \'active\')', [trackId, totalCopies, totalCopies, generationLimit]);
    for (let copyNumber = 1; copyNumber <= totalCopies; copyNumber += 1) {
      await connection.query('INSERT INTO copies (pressing_id, copy_number) VALUES (?, ?)', [result.insertId, copyNumber]);
    }
    await connection.commit();
    res.status(201).json({ pressingId: result.insertId, copiesCreated: totalCopies });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function updateTrack(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, audioUrl, coverUrl, durationSeconds, licenseType } = req.body;
    const [rows] = await pool.query('SELECT t.*, a.owner_user_id FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE t.id = ?', [id]);
    const track = rows[0];
    if (!track) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista inexistente' } });
    if (track.owner_user_id !== req.auth.sub && !req.auth.roles.includes('admin')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tenés permisos para modificar esta pista' } });
    }

    await pool.query(
      `UPDATE tracks SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        audio_url = COALESCE(?, audio_url),
        cover_url = COALESCE(?, cover_url),
        duration_seconds = COALESCE(?, duration_seconds),
        license_type = COALESCE(?, license_type)
      WHERE id = ?`,
      [title?.trim() || null, description, audioUrl?.trim() || null, coverUrl, durationSeconds, licenseType, id]
    );

    const [updated] = await pool.query(`SELECT t.*, a.name AS artist_name, a.verified FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE t.id = ?`, [id]);
    res.json({ track: updated[0], message: 'Pista actualizada correctamente' });
  } catch (error) { next(error); }
}

export async function deleteTrack(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT t.*, a.owner_user_id FROM tracks t JOIN artists a ON a.id = t.artist_id WHERE t.id = ? FOR UPDATE', [id]);
    const track = rows[0];
    if (!track) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pista inexistente' } });
    if (track.owner_user_id !== req.auth.sub && !req.auth.roles.includes('admin')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tenés permisos para eliminar esta pista' } });
    }

    const [ownedCopies] = await connection.query(
      `SELECT c.id FROM copies c JOIN pressings p ON p.id = c.pressing_id WHERE p.track_id = ? AND c.status IN ('owned', 'transferred')`,
      [id]
    );
    if (ownedCopies.length > 0) {
      return res.status(422).json({ error: { code: 'TRACK_HAS_CIRCULATION', message: 'No podés eliminar una pista con copias en circulación' } });
    }

    await connection.query(`DELETE c FROM copies c JOIN pressings p ON p.id = c.pressing_id WHERE p.track_id = ?`, [id]);
    await connection.query('DELETE FROM pressings WHERE track_id = ?', [id]);
    await connection.query('DELETE FROM tracks WHERE id = ?', [id]);
    await connection.commit();
    res.json({ message: 'Pista eliminada correctamente' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function updateArtist(req, res, next) {
  try {
    const { id } = req.params;
    const { name, biography } = req.body;
    const [rows] = await pool.query('SELECT * FROM artists WHERE id = ?', [id]);
    const artist = rows[0];
    if (!artist) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Artista inexistente' } });
    if (artist.owner_user_id !== req.auth.sub && !req.auth.roles.includes('admin')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tenés permisos para modificar este artista' } });
    }

    await pool.query('UPDATE artists SET name = COALESCE(?, name), biography = COALESCE(?, biography) WHERE id = ?', [name?.trim() || null, biography, id]);
    const [updated] = await pool.query('SELECT * FROM artists WHERE id = ?', [id]);
    res.json({ artist: updated[0], message: 'Artista actualizado correctamente' });
  } catch (error) { next(error); }
}
