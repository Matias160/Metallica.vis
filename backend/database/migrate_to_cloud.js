// Script para inicializar y migrar el esquema y semillas a TiDB Cloud / MySQL remoto.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('--- Iniciando conexión con base de datos en la nube ---');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);

  const isSslRequired = process.env.DB_SSL === 'true' || Number(process.env.DB_PORT) === 4000;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: isSslRequired ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
    multipleStatements: true
  });

  try {
    console.log('✓ Conectado exitosamente.');

    // 1. Ejecutar Schema
    console.log('-> Creando tablas (schema.sql)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('✓ Tablas creadas con éxito.');

    // 2. Ejecutar Seed
    console.log('-> Insertando datos iniciales y portadas de metal (seed.sql)...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await connection.query(seedSql);
    console.log('✓ Semillas insertadas.');

    // 3. Verificación
    const [tracks] = await connection.query('SELECT COUNT(*) as total FROM tracks');
    const [copies] = await connection.query('SELECT COUNT(*) as total FROM copies');
    const [users] = await connection.query('SELECT COUNT(*) as total FROM users');

    console.log('--- MIGRACIÓN COMPLETADA EXITOSAMENTE ---');
    console.log(`• Usuarios: ${users[0].total}`);
    console.log(`• Pistas y Álbumes de Metal: ${tracks[0].total}`);
    console.log(`• Copias Físicas en Bodega: ${copies[0].total}`);
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
