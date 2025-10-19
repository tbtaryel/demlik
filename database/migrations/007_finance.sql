-- Finance: user bank accounts and wallet transactions

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_name VARCHAR(150) NOT NULL,
  account_name VARCHAR(150) NOT NULL,
  iban VARCHAR(34) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('deposit','withdraw','credit') NOT NULL,
  amount DECIMAL(16,2) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reference VARCHAR(191),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user ON wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(type);