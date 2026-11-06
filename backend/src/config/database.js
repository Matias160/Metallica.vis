// Crea el pool de conexiones seguro para MySQL y TiDB Cloud.
import 'dotenv/config';
import mysql from 'mysql2/promise';

const isSslRequired = process.env.DB_SSL === 'true' || Number(process.env.DB_PORT) === 4000;

console.log(`[DB Pool Init] Conectando a ${process.env.DB_HOST}:${process.env.DB_PORT} (DB: ${process.env.DB_NAME}, SSL: ${isSslRequired})`);

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: isSslRequired ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10
});
