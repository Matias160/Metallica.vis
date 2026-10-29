CREATE DATABASE IF NOT EXISTS metallica_vis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE metallica_vis;

CREATE TABLE roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE artists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  biography TEXT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE tracks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artist_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  audio_url VARCHAR(500) NOT NULL,
  cover_url VARCHAR(500) NULL,
  duration_seconds INT UNSIGNED NULL,
  license_type VARCHAR(80) NOT NULL DEFAULT 'original',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE pressings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  track_id BIGINT UNSIGNED NOT NULL,
  total_copies INT UNSIGNED NOT NULL,
  available_copies INT UNSIGNED NOT NULL,
  generation_limit TINYINT UNSIGNED NOT NULL DEFAULT 5,
  status ENUM('draft', 'active', 'sold_out', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id)
);

CREATE TABLE copies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pressing_id BIGINT UNSIGNED NOT NULL,
  current_owner_id BIGINT UNSIGNED NULL,
  parent_copy_id BIGINT UNSIGNED NULL,
  copy_number INT UNSIGNED NOT NULL,
  generation TINYINT UNSIGNED NOT NULL DEFAULT 0,
  condition_value TINYINT UNSIGNED NOT NULL DEFAULT 100,
  playback_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('available', 'owned', 'transferred', 'archived', 'restored') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (pressing_id, copy_number),
  FOREIGN KEY (pressing_id) REFERENCES pressings(id),
  FOREIGN KEY (current_owner_id) REFERENCES users(id),
  FOREIGN KEY (parent_copy_id) REFERENCES copies(id)
);

CREATE TABLE lineage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_copy_id BIGINT UNSIGNED NOT NULL,
  child_copy_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NOT NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  generation TINYINT UNSIGNED NOT NULL,
  transferred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_copy_id) REFERENCES copies(id),
  FOREIGN KEY (child_copy_id) REFERENCES copies(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE TABLE playback_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  copy_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  degradation_applied TINYINT UNSIGNED NOT NULL DEFAULT 1,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (copy_id) REFERENCES copies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE social_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google', 'facebook', 'apple') NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, provider_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO roles (name, description) VALUES
  ('collector', 'Recibe, reproduce y dubbea copias'),
  ('artist', 'Administra artistas, pistas y tiradas'),
  ('admin', 'Verifica, audita y modera el sistema');
