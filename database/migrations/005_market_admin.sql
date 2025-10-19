-- Market admin configuration and recommended stocks tables

-- Index (e.g., XU100) admin-configurable overrides
CREATE TABLE IF NOT EXISTS market_index_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  index_code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) DEFAULT 'XU100',
  enabled TINYINT(1) DEFAULT 0,
  color VARCHAR(20) DEFAULT '#7b1e21',
  step_ms INT DEFAULT 10000,
  series_json MEDIUMTEXT NULL,
  high DECIMAL(12,4) NULL,
  low DECIMAL(12,4) NULL,
  prev_close DECIMAL(12,4) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recommended stocks curated by admin
CREATE TABLE IF NOT EXISTS recommended_stocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  last DECIMAL(12,4) NULL,
  change_percent DECIMAL(8,4) NULL,
  series_json MEDIUMTEXT NULL,
  sort_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_code (code)
);

-- Seed default index config for XU100 if not present
INSERT INTO market_index_config (index_code, title, enabled, color, step_ms)
SELECT 'XU100', 'XU100', 0, '#7b1e21', 10000
WHERE NOT EXISTS (SELECT 1 FROM market_index_config WHERE index_code = 'XU100');