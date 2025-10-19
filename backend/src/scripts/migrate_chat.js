import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('backend/.env') });
if (!process.env.MYSQL_HOST) {
  dotenv.config();
}

async function run() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'theshisha';
  const port = Number(process.env.MYSQL_PORT || 3306);

  const migrationsDir = path.resolve('..', 'database', 'migrations');
  const file = path.join(migrationsDir, '004_chat.sql');
  const sql = fs.readFileSync(file, 'utf8');

  const rootConn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
  console.log('Applying 004_chat.sql...');
  await conn.query(sql);
  await conn.end();
  console.log('004_chat.sql applied successfully.');
}

run().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});