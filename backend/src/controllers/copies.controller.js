// Gestiona las copias físicas, su estado y sus transferencias.
import { pool } from '../config/database.js';

const copySelect = `SELECT c.*, p.track_id, t.title AS track_title, t.audio_url, t.cover_url,
  u.display_name AS owner_name FROM copies c
  JOIN pressings p ON p.id = c.pressing_id JOIN tracks t ON t.id = p.track_id
  LEFT JOIN users u ON u.id = c.current_owner_id`;

export async function getCollection(req, res, next) {
  try {
    const [rows] = await pool.query(`${copySelect} WHERE c.current_owner_id = ? AND c.status = 'owned' ORDER BY c.updated_at DESC`, [req.auth.sub]);
    res.json({ copies: rows });
  } catch (error) { next(error); }
}

export async function getCopy(req, res, next) {
  try {
    const [rows] = await pool.query(`${copySelect} WHERE c.id = ?`, [req.params.id]);
    const copy = rows[0];
    if (!copy) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Copia inexistente' } });
    if (copy.current_owner_id !== req.auth.sub && !req.auth.roles.includes('admin')) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No podés consultar esta copia' } });
    res.json({ copy });
  } catch (error) { next(error); }
}

export async function playCopy(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM copies WHERE id = ? FOR UPDATE', [req.params.id]);
    const copy = rows[0];
    if (!copy) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Copia inexistente' } });
    if (copy.current_owner_id !== req.auth.sub) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Solo el propietario puede reproducir la copia' } });
    const degradation = Math.max(1, Math.floor(copy.generation / 2) + 1);
    const condition = Math.max(0, copy.condition_value - degradation);
    await connection.query('UPDATE copies SET condition_value = ?, playback_count = playback_count + 1 WHERE id = ?', [condition, copy.id]);
    await connection.query('INSERT INTO playback_history (copy_id, user_id, degradation_applied) VALUES (?, ?, ?)', [copy.id, req.auth.sub, degradation]);
    await connection.commit();
    res.json({ message: 'Reproducción registrada', conditionValue: condition, degradationApplied: degradation });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function dubCopy(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { recipientUserId } = req.body;
    if (!recipientUserId) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'recipientUserId es obligatorio' } });
    await connection.beginTransaction();
    const [rows] = await connection.query(`SELECT c.*, p.generation_limit FROM copies c JOIN pressings p ON p.id = c.pressing_id WHERE c.id = ? FOR UPDATE`, [req.params.id]);
    const parent = rows[0];
    if (!parent) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Copia inexistente' } });
    if (parent.current_owner_id !== req.auth.sub || parent.status !== 'owned') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Solo podés dubbear una copia que poseés' } });
    if (parent.generation >= parent.generation_limit) return res.status(422).json({ error: { code: 'GENERATION_LIMIT', message: 'La copia alcanzó el límite de generaciones' } });
    const [recipients] = await connection.query('SELECT id, is_active FROM users WHERE id = ?', [recipientUserId]);
    if (!recipients[0] || !recipients[0].is_active) return res.status(404).json({ error: { code: 'RECIPIENT_NOT_FOUND', message: 'El destinatario no existe o está inactivo' } });
    const childGeneration = parent.generation + 1;
    const childCondition = Math.max(1, 100 - childGeneration * 8);
    const [child] = await connection.query(`INSERT INTO copies (pressing_id, current_owner_id, parent_copy_id, copy_number, generation, condition_value, status)
      VALUES (?, ?, ?, ?, ?, ?, 'owned')`, [parent.pressing_id, recipientUserId, parent.id, parent.copy_number, childGeneration, childCondition]);
    await connection.query("UPDATE copies SET status = 'transferred', current_owner_id = NULL WHERE id = ?", [parent.id]);
    await connection.query('INSERT INTO lineage (parent_copy_id, child_copy_id, from_user_id, to_user_id, generation) VALUES (?, ?, ?, ?, ?)', [parent.id, child.insertId, req.auth.sub, recipientUserId, childGeneration]);
    await connection.commit();
    res.status(201).json({ message: 'Copia dubbeada correctamente', copyId: child.insertId, generation: childGeneration });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function getLineage(req, res, next) {
  try {
    const [ownership] = await pool.query('SELECT current_owner_id FROM copies WHERE id = ?', [req.params.id]);
    if (!ownership[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Copia inexistente' } });
    
    const isOwner = ownership[0].current_owner_id === req.auth.sub;
    const isAdmin = req.auth.roles?.includes('admin');
    const [inLineage] = await pool.query(
      'SELECT id FROM lineage WHERE (parent_copy_id = ? OR child_copy_id = ?) AND (from_user_id = ? OR to_user_id = ?) LIMIT 1',
      [req.params.id, req.params.id, req.auth.sub, req.auth.sub]
    );

    if (!isOwner && !isAdmin && inLineage.length === 0) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No podés consultar este linaje' } });
    }

    const [rows] = await pool.query(`SELECT l.*, fu.display_name AS from_user_name, tu.display_name AS to_user_name
      FROM lineage l JOIN users fu ON fu.id = l.from_user_id JOIN users tu ON tu.id = l.to_user_id
      WHERE l.parent_copy_id = ? OR l.child_copy_id = ? ORDER BY l.transferred_at`, [req.params.id, req.params.id]);
    res.json({ lineage: rows });
  } catch (error) { next(error); }
}

export async function claimCopy(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { pressingId } = req.body;
    if (!pressingId) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'pressingId es obligatorio' } });
    await connection.beginTransaction();
    const [available] = await connection.query(
      `SELECT * FROM copies WHERE pressing_id = ? AND status = 'available' AND current_owner_id IS NULL ORDER BY copy_number ASC LIMIT 1 FOR UPDATE`,
      [pressingId]
    );
    if (!available[0]) {
      return res.status(404).json({ error: { code: 'SOLD_OUT', message: 'No quedan copias disponibles de esta tirada' } });
    }
    const copy = available[0];
    await connection.query(
      `UPDATE copies SET status = 'owned', current_owner_id = ? WHERE id = ?`,
      [req.auth.sub, copy.id]
    );
    await connection.query(
      `UPDATE pressings SET available_copies = GREATEST(0, available_copies - 1) WHERE id = ?`,
      [pressingId]
    );
    await connection.commit();
    res.status(201).json({ message: 'Copia adquirida y agregada a tu colección', copyId: copy.id, copyNumber: copy.copy_number });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function removeCopy(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM copies WHERE id = ?', [id]);
    const copy = rows[0];
    if (!copy) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Copia inexistente' } });
    if (copy.current_owner_id !== req.auth.sub && !req.auth.roles?.includes('admin')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tenés permisos para remover esta copia' } });
    }
    await pool.query(`UPDATE copies SET status = 'archived', current_owner_id = NULL WHERE id = ?`, [id]);
    res.json({ message: 'Copia archivada y removida de tu colección activa' });
  } catch (error) { next(error); }
}
