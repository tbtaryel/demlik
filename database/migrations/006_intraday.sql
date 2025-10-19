-- Intraday (Gün içi işlem) sayfa içeriği ve kayıtları için tablolar
-- Bu migrasyon, tamamen dinamik yönetim için ayarlar, emirler ve işlemler yapısını sağlar

-- Sayfa ayarları: başlıklar, yer tutucular, buton metni ve rehber içeriği
CREATE TABLE IF NOT EXISTS intraday_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_label VARCHAR(255) NOT NULL DEFAULT 'Fonlara katılmak',
  amount_placeholder VARCHAR(255) NOT NULL DEFAULT 'Lütfen tutarı giriniz',
  submit_label VARCHAR(100) NOT NULL DEFAULT 'Kaydet',
  guide_text TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Emir kayıtları: kullanıcı girişleri ve gerçekleşen emirler
CREATE TABLE IF NOT EXISTS intraday_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(16,2) NOT NULL,
  status ENUM('pending','executed','cancelled') NOT NULL DEFAULT 'pending',
  application_time DATETIME NULL,
  review_time DATETIME NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_created_at (created_at)
);

-- İşlemler: süreçler ve detayları
CREATE TABLE IF NOT EXISTS intraday_operations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status ENUM('pending','running','completed','cancelled') NOT NULL DEFAULT 'pending',
  details_json TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_op_status (status),
  KEY idx_op_created_at (created_at)
);

-- Varsayılan ayar kaydı (seed)
INSERT INTO intraday_settings (title_label, amount_placeholder, submit_label, guide_text, active)
SELECT 'Fonlara katılmak', 'Lütfen tutarı giriniz', 'Kaydet',
  'Gün içi işlem, grup içindeki kurumsal fonlar ve bireysel yatırımcı fonlarının birleşerek bir hisse senedinin fiyatını yukarı çekmesi sürecidir. Büyük sermayenin yönlendirmesiyle hisse fiyatı yükseltilir ve belirlenen kâr hedefi gerçekleştirilir. Bu süreçte, aynı gün içinde alım ve satım işlemleri yapılabilir. Yükseltmeyi planladığımız hisse senedinin proje kodunun sızmasını ve diğer kurumlar tarafından fiyatın bilinçli olarak baskılanarak zarara uğratılmamızı önlemek amacıyla, bu sayfada yükseltilecek hisse kodu ve detayları paylaşılmayacaktır.',
  1
WHERE NOT EXISTS (SELECT 1 FROM intraday_settings LIMIT 1);