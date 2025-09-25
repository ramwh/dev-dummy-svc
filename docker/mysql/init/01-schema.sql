-- Initialize database schema
CREATE DATABASE IF NOT EXISTS dev_dummy_svc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dev_dummy_svc;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  age INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at),
  INDEX idx_name_email (name, email)
) ENGINE=InnoDB;

-- Insert sample data
INSERT IGNORE INTO users (email, name, age, is_active) VALUES
  ('john.doe@example.com', 'John Doe', 30, TRUE),
  ('jane.smith@example.com', 'Jane Smith', 25, TRUE),
  ('bob.wilson@example.com', 'Bob Wilson', 35, FALSE),
  ('alice.johnson@example.com', 'Alice Johnson', 28, TRUE),
  ('charlie.brown@example.com', 'Charlie Brown', 45, TRUE);

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_dummy_svc.* TO 'appuser'@'%';
FLUSH PRIVILEGES;