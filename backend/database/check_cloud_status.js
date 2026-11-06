// Inspecciona y muestra el estado en vivo de la base de datos en TiDB Cloud.
import 'dotenv/config';
import { pool } from '../src/config/database.js';

async function checkStatus() {
  console.log('\n================ ESTADO EN VIVO DE TIDB CLOUD ================');
  console.log(`📡 Servidor: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`📦 Base de Datos: ${process.env.DB_NAME}`);
  console.log('--------------------------------------------------------------');

  const [tables] = await pool.query('SHOW TABLES');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [cnt] = await pool.query('SELECT COUNT(*) as c FROM ' + tableName);
    console.log(`• Tabla '${tableName}': ${cnt[0].c} registros`);
  }

  console.log('--------------------------------------------------------------');
  console.log('🎸 PISTAS Y DISCOS EN LA NUBE:');
  const [tracks] = await pool.query('SELECT id, title, is_featured FROM tracks ORDER BY id ASC');
  tracks.forEach((t) => {
    console.log(`  [ID ${t.id}] ${t.title} ${t.is_featured ? '★ DESTACADA' : ''}`);
  });

  console.log('==============================================================\n');
  process.exit(0);
}

checkStatus().catch((e) => {
  console.error(e);
  process.exit(1);
});
