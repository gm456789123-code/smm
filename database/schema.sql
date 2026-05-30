CREATE DATABASE IF NOT EXISTS smm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smm;

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  UNIQUE NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  phone           VARCHAR(20)  DEFAULT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  referral_code   VARCHAR(20)  UNIQUE NOT NULL,
  referred_by     INT          DEFAULT NULL,
  email_verified  TINYINT(1)   DEFAULT 0,
  balance         DECIMAL(12,4) DEFAULT 0.0000,
  role            ENUM('user','admin') DEFAULT 'user',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  token      VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP   NOT NULL,
  used       TINYINT(1)  DEFAULT 0,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

CREATE TABLE IF NOT EXISTS transactions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT            NOT NULL,
  tx_type    VARCHAR(10)    NOT NULL,
  amount     DECIMAL(12,4)  NOT NULL,
  ref        VARCHAR(255)   DEFAULT NULL,
  tx_status  VARCHAR(10)    DEFAULT 'pending',
  note       TEXT           DEFAULT NULL,
  created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  token_hash VARCHAR(100) NOT NULL,
  ip         VARCHAR(45)  DEFAULT NULL,
  user_agent TEXT         DEFAULT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT         DEFAULT NULL,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('brand_name',    'AURA SMM'),
  ('brand_tagline', 'บริการ SMM Panel คุณภาพสูง เร็ว เสถียร ราคาถูก'),
  ('brand_desc',    'เพิ่มยอดผู้ติดตาม ยอดไลค์ และ engagement บนทุกแพลตฟอร์ม'),
  ('hero_cta',      'เริ่มต้นใช้งานฟรี'),
  ('stat_orders',   '50,000+'),
  ('stat_users',    '10,000+'),
  ('stat_platforms','10+'),
  ('stat_uptime',   '99.9%');

CREATE TABLE IF NOT EXISTS blog_posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(200) UNIQUE NOT NULL,
  title        VARCHAR(300) NOT NULL,
  excerpt      TEXT         DEFAULT NULL,
  content      LONGTEXT     DEFAULT NULL,
  cover_image  VARCHAR(500) DEFAULT NULL,
  author_id    INT          DEFAULT NULL,
  published    TINYINT(1)   DEFAULT 0,
  published_at DATETIME     DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_published (published)
);
