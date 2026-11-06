import { pool } from '../src/config/database.js';

async function run() {
  console.log('Actualizando catálogo de metallica.vis con álbumes de metal auténticos...');

  // 1. Actualizar Master of Puppets
  await pool.query(
    `UPDATE tracks SET 
      title = ?,
      description = ?,
      cover_url = ?,
      audio_url = ?,
      duration_seconds = ?,
      is_featured = 1
      WHERE id = 1`,
    [
      'Master of Puppets (Soundboard Master Reel 1986)',
      'Toma directa de consola Soundboard 1986. Prensaje máster en cinta Metal Type IV.',
      'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b8/5a/82/b85a8259-60d9-bfaa-770a-2baac8380e87/858978005196.png/600x600bb.jpg',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      515
    ]
  );

  // 2. Actualizar Ride the Lightning
  await pool.query(
    `UPDATE tracks SET 
      title = ?,
      description = ?,
      cover_url = ?,
      audio_url = ?,
      duration_seconds = ?,
      is_featured = 1
      WHERE id = 3`,
    [
      'Ride the Lightning (Sweet Silence Studio Rough 1984)',
      'Mezcla cruda de estudio en Copenhague 1984. Cromo Type II High Bias.',
      'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/0f/7a/74/0f7a7472-92fa-e77d-384a-1e4304705e83/dj.jbiruenb.png/600x600bb.jpg',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      396
    ]
  );

  // 3. Actualizar Seek & Destroy
  await pool.query(
    `UPDATE tracks SET 
      title = ?,
      description = ?,
      cover_url = ?,
      audio_url = ?,
      duration_seconds = ?,
      is_featured = 1
      WHERE id = 4`,
    [
      'Seek & Destroy (Chateau Liberté 1982 Demo)',
      'La maqueta fundacional de Kill Em All grabada en vivo en cinta Ferro Type I.',
      'https://is1-ssl.mzstatic.com/image/thumb/Features124/v4/73/06/19/73061928-34a2-6462-963a-039203d507fe/dj.cloeijsr.png/600x600bb.jpg',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      415
    ]
  );

  // 4. Agregar One, Enter Sandman y Holy Wars si no existen
  const [existing] = await pool.query('SELECT id, title FROM tracks WHERE title LIKE ?', ['%One (Master Tape%']);
  if (existing.length === 0) {
    const [t5] = await pool.query(
      `INSERT INTO tracks (artist_id, title, description, cover_url, audio_url, duration_seconds, is_featured)
       VALUES (1, ?, ?, ?, ?, ?, 1)`,
      [
        'One (Master Tape 1988)',
        '...And Justice for All sesión analógica de estudio con audio original sin comprimir.',
        'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/f3/83/b5f38312-5b95-9a09-fcb9-5622dd5ea077/858978005820.png/600x600bb.jpg',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        446
      ]
    );
    const [p5] = await pool.query('INSERT INTO pressings (track_id, total_copies, available_copies, status) VALUES (?, 10, 8, "active")', [t5.insertId]);
    for (let i = 1; i <= 10; i++) {
      const owner = (i <= 3) ? 1 : null;
      await pool.query(
        'INSERT INTO copies (pressing_id, copy_number, current_owner_id, condition_value, status) VALUES (?, ?, ?, ?, ?)',
        [p5.insertId, i, owner, owner ? 97 : 100, owner ? 'owned' : 'available']
      );
    }

    const [t6] = await pool.query(
      `INSERT INTO tracks (artist_id, title, description, cover_url, audio_url, duration_seconds, is_featured)
       VALUES (1, ?, ?, ?, ?, ?, 0)`,
      [
        'Enter Sandman (One on One Studios Mix 1991)',
        'The Black Album máster de bobina abierta a 30 ips grabado en Los Ángeles.',
        'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2e/94/95/2e9495d7-dfe3-ddc8-87ef-6ef797a60218/850007452056.png/600x600bb.jpg',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        332
      ]
    );
    const [p6] = await pool.query('INSERT INTO pressings (track_id, total_copies, available_copies, status) VALUES (?, 10, 8, "active")', [t6.insertId]);
    for (let i = 1; i <= 10; i++) {
      const owner = (i <= 2) ? 1 : null;
      await pool.query(
        'INSERT INTO copies (pressing_id, copy_number, current_owner_id, condition_value, status) VALUES (?, ?, ?, ?, ?)',
        [p6.insertId, i, owner, owner ? 94 : 100, owner ? 'owned' : 'available']
      );
    }

    const [t7] = await pool.query(
      `INSERT INTO tracks (artist_id, title, description, cover_url, audio_url, duration_seconds, is_featured)
       VALUES (1, ?, ?, ?, ?, ?, 0)`,
      [
        'Holy Wars... The Punishment Due (1990 Master Tape)',
        'Rust in Peace producción analógica en Rumbo Recorders. Mezcla de Dave Mustaine.',
        'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1d/98/fa/1d98fa0e-9d9f-b259-12c7-dca7ef1f6fa8/13UABIM52455.rgb.jpg/600x600bb.jpg',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        392
      ]
    );
    const [p7] = await pool.query('INSERT INTO pressings (track_id, total_copies, available_copies, status) VALUES (?, 10, 8, "active")', [t7.insertId]);
    for (let i = 1; i <= 10; i++) {
      const owner = (i <= 2) ? 1 : null;
      await pool.query(
        'INSERT INTO copies (pressing_id, copy_number, current_owner_id, condition_value, status) VALUES (?, ?, ?, ?, ?)',
        [p7.insertId, i, owner, owner ? 91 : 100, owner ? 'owned' : 'available']
      );
    }
  }

  // Asignar copias de los álbumes al coleccionista (id: 1)
  await pool.query('UPDATE copies SET current_owner_id = 1, status = "owned" WHERE copy_number = 1 AND pressing_id IN (1, 2, 3)');

  console.log('Catálogo y copias actualizados exitosamente con álbumes de metal reales.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error actualizando catálogo:', err);
  process.exit(1);
});
