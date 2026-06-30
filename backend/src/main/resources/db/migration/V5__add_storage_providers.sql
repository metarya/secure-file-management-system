-- =============================================================================
-- V5__add_storage_providers.sql
-- -----------------------------------------------------------------------------
-- User-configurable storage providers. Each user independently chooses where
-- THEIR OWN uploads are stored. This migration adds:
--
--   1. `user_storage_settings` — one row per user; the default provider and
--      per-provider configuration. Secret fields (*_enc) hold ENCRYPTED values;
--      they are never returned by the API.
--   2. `files.storage_provider` / `files.storage_key` — every file remembers
--      which backend holds its bytes. Existing rows default to LOCAL so current
--      files (stored in file_data) continue to work unchanged.
--
-- Column types/lengths mirror the JPA entities so Hibernate (`ddl-auto=validate`)
-- accepts the mappings at startup.
-- =============================================================================

CREATE TABLE `user_storage_settings` (
  `id`                         bigint       NOT NULL AUTO_INCREMENT,
  `user_id`                    bigint       NOT NULL,
  `default_provider`           varchar(32)  NOT NULL,
  `local_directory`            varchar(500)  DEFAULT NULL,
  `s3_bucket`                  varchar(255)  DEFAULT NULL,
  `s3_region`                  varchar(64)   DEFAULT NULL,
  `s3_access_key_enc`          varchar(1024) DEFAULT NULL,
  `s3_secret_key_enc`          varchar(1024) DEFAULT NULL,
  `gdrive_client_id`           varchar(512)  DEFAULT NULL,
  `gdrive_client_secret_enc`   varchar(1024) DEFAULT NULL,
  `gdrive_refresh_token_enc`   varchar(2048) DEFAULT NULL,
  `onedrive_client_id`         varchar(512)  DEFAULT NULL,
  `onedrive_client_secret_enc` varchar(1024) DEFAULT NULL,
  `onedrive_refresh_token_enc` varchar(2048) DEFAULT NULL,
  `updated_at`                 datetime(6)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_storage_settings_user` (`user_id`),
  CONSTRAINT `fk_user_storage_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Per-file provider tracking. Existing files become LOCAL (bytes already in
-- file_data); storage_key stays null for them.
ALTER TABLE `files`
  ADD COLUMN `storage_provider` varchar(32) DEFAULT 'LOCAL',
  ADD COLUMN `storage_key`      varchar(1024) DEFAULT NULL;
