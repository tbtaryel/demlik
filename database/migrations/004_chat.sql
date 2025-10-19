-- Chat messages table for direct user ↔ admin conversations
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  body TEXT NOT NULL,
  status ENUM('active','edited','deleted','recalled') DEFAULT 'active',
  prev_body TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  recalled_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helpful index for retrieving conversations quickly
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);