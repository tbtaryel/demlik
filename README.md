# Dia Uygulama Altyapısı

Modern, mobil odaklı ve PWA destekli bir web uygulaması altyapısı. Tek bir yönetim panelinden içerikler, kullanıcılar ve ayarlar yönetilir. WebView/Natively/Capacitor ile APK/IPA paketlenebilir.

## Klasör Yapısı
- backend/ (REST API - Node.js/Express, JWT, MySQL)
- frontend/ (React + Tailwind + Vite, PWA)
- database/ (migrations & seeders)

## Hızlı Başlangıç
1) MySQL erişim bilgilerini `backend/.env` içinde ayarlayın (bkz: `.env.example`).
2) Bağımlılıkları yükleyin:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3) Veritabanı tablolarını oluşturun:
   - `cd backend && npm run migrate`
4) Örnek verileri yükleyin:
   - `cd backend && npm run seed`
5) API’yi çalıştırın:
   - `cd backend && npm run dev` (http://localhost:4000)
6) Frontend’i çalıştırın ve PWA önizlemeyi açın:
   - `cd frontend && npm run dev` (http://localhost:5173)

Varsayılan admin: `admin@example.com / admin123`