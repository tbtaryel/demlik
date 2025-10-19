import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });
if (!process.env.MYSQL_HOST) {
  dotenv.config();
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'theshisha',
  });
  console.log('Seeding database...');
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);
  const adminPhone = '+905555000001';
  const userPhone = '+905555000002';
  await conn.execute('INSERT IGNORE INTO users (id,name,email,phone,password_hash,role) VALUES (1,?,?,?,?,?)', ['Admin', 'admin@example.com', adminPhone, adminPass, 'admin']);
  await conn.execute('INSERT IGNORE INTO users (id,name,email,phone,password_hash,role) VALUES (2,?,?,?,?,?)', ['User', 'user@example.com', userPhone, userPass, 'user']);
  // Ensure phones exist even if rows already present
  await conn.execute('UPDATE users SET phone=? WHERE id=1 AND (phone IS NULL OR phone="")', [adminPhone]);
  await conn.execute('UPDATE users SET phone=? WHERE id=2 AND (phone IS NULL OR phone="")', [userPhone]);
  await conn.execute('INSERT IGNORE INTO settings (`key`,`value`) VALUES (?,?), (?,?), (?,?), (?,?), (?,?)', [
    'app_name', 'Dia',
    'accent_color', '#800020',
    'logo_url', '',
    'country_label', 'Türkiye',
    'phone_allowed_dials', '+90'
  ]);
  await conn.execute("INSERT IGNORE INTO content (id, title, slug, body, image_url, published) VALUES (1, 'Welcome', 'welcome', 'Merhaba! İçerik sistemi hazır.', '', 1)");
  // core seed data
  await conn.execute("INSERT IGNORE INTO categories (id, name, slug) VALUES (1, 'Genel', 'genel'), (2, 'Duyurular', 'duyurular')");
  await conn.execute("INSERT IGNORE INTO tags (id, name, slug) VALUES (1, 'duyuru', 'duyuru')");
  await conn.execute("INSERT IGNORE INTO pages (id, title, slug, body, published) VALUES (1, 'Hakkında', 'hakkinda', 'Uygulama hakkında bilgi.', 1), (2, 'İletişim', 'iletisim', 'Bize ulaşın.', 1)");
  await conn.execute("INSERT IGNORE INTO menus (id, name, code) VALUES (1, 'Ana Menü', 'main')");
  await conn.execute("INSERT IGNORE INTO menu_items (id, menu_id, label, url, sort_order) VALUES (1, 1, 'Ana Sayfa', '/', 1), (2, 1, 'İçerikler', '/', 2), (3, 1, 'Bildirimler', '/notifications', 3)");
  await conn.end();
  console.log('Seed complete.');
  console.log(`Admin (email or phone): admin@example.com / ${adminPhone}  | password: admin123`);
  console.log(`User  (phone): ${userPhone}  | password: user123`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});