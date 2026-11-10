// Manejo de subida de archivos (audio y carátulas) y verificación pública de QR.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads');

// Extensiones seguras permitidas (audios e imágenes)
const ALLOWED_EXTENSIONS = new Set([
  '.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac',
  '.jpg', '.jpeg', '.png', '.webp'
]);

const router = Router();

// POST /api/upload - Subida directa de archivos de audio / imágenes en base64 (requiere usuario autenticado)
router.post('/upload', requireAuth, async (req, res, next) => {
  try {
    const { filename, base64, mimeType } = req.body;

    if (!filename || !base64) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'filename y base64 son obligatorios' }
      });
    }

    // Sanitizar y validar extensión contra whitelist estricta
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({
        error: { code: 'INVALID_FILE_TYPE', message: 'Tipo de archivo no permitido. Solo se aceptan formatos de audio (mp3, wav, flac, ogg, m4a, aac) e imagen (jpg, png, webp).' }
      });
    }

        // Limpiar prefijo data URL si existe
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // MEDIO (Auditoría de Seguridad): Validación de Magic Bytes en archivo real
    const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isRiff = buffer.length > 4 && buffer.toString('utf8', 0, 4) === 'RIFF'; // WAV o WEBP
    const isMp3 = (buffer.length > 3 && buffer.toString('utf8', 0, 3) === 'ID3') || (buffer.length > 2 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);
    const isOgg = buffer.length > 4 && buffer.toString('utf8', 0, 4) === 'OggS';
    const isFlac = buffer.length > 4 && buffer.toString('utf8', 0, 4) === 'fLaC';
    const isM4a = buffer.length > 8 && (buffer.toString('utf8', 4, 8) === 'ftyp' || buffer.toString('utf8', 4, 8) === 'M4A ');

    if (!isJpeg && !isPng && !isRiff && !isMp3 && !isOgg && !isFlac && !isM4a) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_SIGNATURE',
          message: 'El contenido del archivo no coincide con su extensión o no es un formato válido de audio/imagen.'
        }
      });
    }

    // Asegurar existencia del directorio de subidas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Nombre único no colisionable y seguro
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeBase}${ext}`;
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
      mimeType: mimeType || (ext.startsWith('.jp') || ext === '.png' || ext === '.webp' ? 'image/jpeg' : 'audio/mpeg')
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

    let tape = rows[0];
    if (!tape) {
      // Intentar buscar como código o ID de canción / pista máster
      const [trackRows] = await pool.query(
        `SELECT t.id AS track_id, t.title AS track_title, t.license_type, t.audio_url, t.cover_url,
                a.id AS artist_id, a.name AS artist_name, a.verified AS artist_verified,
                p.id AS pressing_id, p.total_copies, p.available_copies
         FROM tracks t
         JOIN artists a ON a.id = t.artist_id
         LEFT JOIN pressings p ON p.track_id = t.id
         WHERE t.id = ? LIMIT 1`,
        [copyId]
      );
      if (trackRows[0]) {
        const tr = trackRows[0];
        tape = {
          copy_id: null,
          copy_number: 1,
          generation: 0,
          condition_value: 100,
          status: 'available',
          playback_count: 0,
          created_at: new Date(),
          pressing_id: tr.pressing_id,
          total_copies: tr.total_copies || 50,
          track_id: tr.track_id,
          track_title: tr.track_title,
          license_type: tr.license_type || 'Master Tape Vault',
          audio_url: tr.audio_url,
          cover_url: tr.cover_url,
          artist_id: tr.artist_id,
          artist_name: tr.artist_name,
          artist_verified: Boolean(tr.artist_verified),
          owner_name: 'Bodega Central · Disponible para Reclamar',
          owner_username: 'bodega'
        };
      }
    }

    if (!tape) {
      return res.status(404).json({
        valid: false,
        error: { code: 'TAPE_NOT_FOUND', message: 'El código QR no corresponde a ninguna cinta física o pista registrada.' }
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
