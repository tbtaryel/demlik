-- Add phone field to users and allow nullable email
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30) UNIQUE NULL AFTER name;
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(191) NULL UNIQUE;

-- Invites table for one-time registration codes
CREATE TABLE IF NOT EXISTS invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  created_by INT,
  used_by INT,
  is_used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;