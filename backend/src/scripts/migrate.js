import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('backend/.env') });
if (!process.env.MYSQL_HOST) {
  dotenv.config();
}

function readSqlFiles(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  return files.map((f) => ({ name: f, sql: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

async function run() {
  const migrationsDir = path.resolve('..', 'database', 'migrations');
  const items = readSqlFiles(migrationsDir);
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'theshisha';
  const port = Number(process.env.MYSQL_PORT || 3306);

  // Ensure database exists
  const rootConn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
  console.log('Running migrations...');
  for (const m of items) {
    console.log('Applying', m.name);
    await conn.query(m.sql);
  }
  await conn.end();
  console.log('Migrations complete.');
}

run().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});