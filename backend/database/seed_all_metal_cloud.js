// Script para poblar todas las pistas de metal, prensajes y copias físicas en TiDB Cloud.
import { pool } from '../src/config/database.js';

async function seedMetalCatalog() {
  console.log('--- Poblando catálogo de metal en TiDB Cloud ---');

  const [artistRows] = await pool.query("SELECT id FROM artists WHERE name = 'Elektra & Megaforce Vaults' LIMIT 1");
  const artistId = artistRows[0]?.id || 1;

  const [collectorRows] = await pool.query("SELECT id FROM users WHERE email = 'collector@metallica.vis' LIMIT 1");
  const collectorId = collectorRows[0]?.id || 1;

  const metalTracks = [
    {
      title: 'Master of Puppets (Soundboard Master Reel 1986)',
      description: 'Toma directa de consola Soundboard 1986. Prensaje máster en cinta Metal Type IV.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b8/5a/82/b85a8259-60d9-bfaa-770a-2baac8380e87/858978005196.png/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration_seconds: 515,
      is_featured: 1,
      total_copies: 50,
      generation_limit: 4
    },
    {
      title: 'Ride the Lightning (Sweet Silence Studio Rough 1984)',
      description: 'Mezcla cruda de estudio en Copenhague 1984 grabada en cinta Cromo Type II High Bias.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/0f/7a/74/0f7a7472-92fa-e77d-384a-1e4304705e83/dj.jbiruenb.png/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration_seconds: 396,
      is_featured: 1,
      total_copies: 40,
      generation_limit: 3
    },
    {
      title: 'Seek & Destroy (Chateau Liberté 1982 Demo)',
      description: 'La maqueta fundacional de Kill Em All grabada en vivo en cinta Ferro Type I.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Features124/v4/73/06/19/73061928-34a2-6462-963a-039203d507fe/dj.cloeijsr.png/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration_seconds: 415,
      is_featured: 1,
      total_copies: 35,
      generation_limit: 5
    },
    {
      title: 'One (Master Tape One on One Studios 1988)',
      description: 'Prensaje máster de 1988 ...And Justice for All. Doble bombo y guitarras percusivas.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/f3/83/b5f38312-5b95-9a09-fcb9-5622dd5ea077/858978005820.png/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duration_seconds: 446,
      is_featured: 1,
      total_copies: 30,
      generation_limit: 3
    },
    {
      title: 'Enter Sandman (One on One Mix 1991)',
      description: 'El sonido monumental del Black Album producido por Bob Rock. 30 IPS bobina abierta.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2e/94/95/2e9495d7-dfe3-ddc8-87ef-6ef797a60218/850007452056.png/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      duration_seconds: 331,
      is_featured: 0,
      total_copies: 60,
      generation_limit: 4
    },
    {
      title: 'Holy Wars... The Punishment Due (1990 Master Tape)',
      description: 'Pista de velocidad extrema de Megadeth - Rust in Peace. Sonido crudo de consola.',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1d/98/fa/1d98fa0e-9d9f-b259-12c7-dca7ef1f6fa8/13UABIM52455.rgb.jpg/600x600bb.jpg',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      duration_seconds: 392,
      is_featured: 0,
      total_copies: 25,
      generation_limit: 2
    }
  ];

  for (const track of metalTracks) {
    // Buscar o insertar track
    const [existing] = await pool.query('SELECT id FROM tracks WHERE title = ?', [track.title]);
    let trackId;
    if (existing.length > 0) {
      trackId = existing[0].id;
      await pool.query(
        'UPDATE tracks SET description = ?, cover_url = ?, audio_url = ?, duration_seconds = ?, is_featured = ? WHERE id = ?',
        [track.description, track.cover_url, track.audio_url, track.duration_seconds, track.is_featured, trackId]
      );
    } else {
      const [insertRes] = await pool.query(
        'INSERT INTO tracks (artist_id, title, description, cover_url, audio_url, duration_seconds, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [artistId, track.title, track.description, track.cover_url, track.audio_url, track.duration_seconds, track.is_featured]
      );
      trackId = insertRes.insertId;
    }

    // Buscar o insertar prensaje
    const [existingPressing] = await pool.query('SELECT id FROM pressings WHERE track_id = ?', [trackId]);
    let pressingId;
    if (existingPressing.length > 0) {
      pressingId = existingPressing[0].id;
    } else {
      const [pressRes] = await pool.query(
        'INSERT INTO pressings (track_id, total_copies, available_copies, generation_limit) VALUES (?, ?, ?, ?)',
        [trackId, track.total_copies, track.total_copies - 1, track.generation_limit]
      );
      pressingId = pressRes.insertId;
    }

    // Asegurar copia en la colección de collector@metallica.vis
    const [existingCopy] = await pool.query(
      'SELECT id FROM copies WHERE pressing_id = ? AND current_owner_id = ?',
      [pressingId, collectorId]
    );

    if (existingCopy.length === 0) {
      await pool.query(
        `INSERT INTO copies (pressing_id, current_owner_id, copy_number, generation, condition_value, status, playback_count)
         VALUES (?, ?, 1, 0, 100, 'owned', 0)`,
        [pressingId, collectorId]
      );
    }
  }

  const [tCount] = await pool.query('SELECT COUNT(*) as total FROM tracks');
  const [cCount] = await pool.query('SELECT COUNT(*) as total FROM copies');
  console.log(`✓ Catálogo actualizado con ${tCount[0].total} álbumes legendarios de metal y ${cCount[0].total} copias físicas activas en la nube.`);
  process.exit(0);
}

seedMetalCatalog().catch((e) => {
  console.error(e);
  process.exit(1);
});
