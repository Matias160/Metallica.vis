// Manejo de subida de archivos (audio y carátulas) y verificación pública de QR.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads');

const router = Router();

// POST /api/upload - Subida directa de archivos de audio / imágenes en base64
router.post('/upload', async (req, res, next) => {
  try {
    const { filename, base64, mimeType } = req.body;

    if (!filename || !base64) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'filename y base64 son obligatorios' }
      });
    }

    // Limpiar prefijo data URL si existe
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Sanitizar nombre de archivo
    const ext = path.extname(filename).toLowerCase() || '.mp3';
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${Date.now()}_${safeBase}${ext}`;
    const targetPath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(targetPath, buffer);

    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:3000';
    const fileUrl = `${protocol}://${host}/uploads/${uniqueName}`;

    res.status(201).json({
      message: 'Archivo subido correctamente',
      filename: uniqueName,
      url: fileUrl,
      sizeBytes: buffer.length,
      mimeType: mimeType || 'audio/mpeg'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/verify-tape/:id - Verificación pública de autenticidad criptográfica para Escaneo QR
router.get('/verify-tape/:id', async (req, res, next) => {
  try {
    const copyId = req.params.id;
    const [rows] = await pool.query(
      `SELECT c.id AS copy_id, c.copy_number, c.generation, c.condition_value, c.status, c.playback_count, c.created_at,
              p.id AS pressing_id, p.total_copies, p.generation_limit,
              t.id AS track_id, t.title AS track_title, t.license_type, t.audio_url, t.cover_url,
              a.id AS artist_id, a.name AS artist_name, a.verified AS artist_verified,
              u.id AS owner_id, u.display_name AS owner_name, u.username AS owner_username
       FROM copies c
       JOIN pressings p ON p.id = c.pressing_id
       JOIN tracks t ON t.id = p.track_id
       JOIN artists a ON a.id = t.artist_id
       LEFT JOIN users u ON u.id = c.current_owner_id
       WHERE c.id = ?`,
      [copyId]
    );

    const tape = rows[0];
    if (!tape) {
      return res.status(404).json({
        valid: false,
        error: { code: 'TAPE_NOT_FOUND', message: 'El código QR no corresponde a ninguna cinta física registrada en el máster.' }
      });
    }

    // Generar sello criptográfico SHA-256 de autenticidad
    const rawPayload = `METALLICA_VIS_AUTHENTIC:${tape.copy_id}:${tape.pressing_id}:${tape.copy_number}:${tape.artist_name}`;
    const hashSeal = crypto.createHash('sha256').update(rawPayload).digest('hex').toUpperCase();

    res.json({
      valid: true,
      certified: Boolean(tape.artist_verified),
      authenticityStamp: hashSeal,
      tape: {
        id: tape.copy_id,
        copyNumber: tape.copy_number,
        totalCopies: tape.total_copies,
        generation: tape.generation,
        conditionValue: tape.condition_value,
        status: tape.status,
        playbackCount: tape.playback_count,
        trackId: tape.track_id,
        trackTitle: tape.track_title,
        licenseType: tape.license_type,
        audioUrl: tape.audio_url,
        coverUrl: tape.cover_url,
        artistId: tape.artist_id,
        artistName: tape.artist_name,
        artistVerified: Boolean(tape.artist_verified),
        ownerName: tape.owner_name || 'Almacén Central / Colección',
        ownerUsername: tape.owner_username || 'almacen',
        pressingDate: tape.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
