-- Search Logs Table Schema
-- This table stores exported search log entries from JSON files

CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    search_type VARCHAR(50),
    query TEXT,
    collection VARCHAR(100),
    search_model VARCHAR(100),
    score_model VARCHAR(100),
    result_count INT DEFAULT 0,
    duration INT,
    error TEXT,
    user_email VARCHAR(255),
    source_type VARCHAR(50),
    assistant_type VARCHAR(50),
    temperature DECIMAL(3,2),
    context_length INT,
    max_tokens INT,
    generate_scores BOOLEAN DEFAULT FALSE,
    test_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_search_type (search_type),
    INDEX idx_collection (collection),
    INDEX idx_user_email (user_email),
    INDEX idx_test_code (test_code)
);