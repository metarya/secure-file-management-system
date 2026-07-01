-- =============================================================================
-- V6__add_sftp_storage.sql
-- Add SFTP columns to user_storage_settings.
-- Existing rows default to NULL; the SFTP provider is only active when a user
-- explicitly selects it as their default_provider.
-- =============================================================================

ALTER TABLE `user_storage_settings`
  ADD COLUMN `sftp_host`         varchar(255)  DEFAULT NULL,
  ADD COLUMN `sftp_port`         varchar(10)   DEFAULT NULL,
  ADD COLUMN `sftp_username`     varchar(255)  DEFAULT NULL,
  ADD COLUMN `sftp_password_enc` varchar(1024) DEFAULT NULL,
  ADD COLUMN `sftp_remote_dir`   varchar(500)  DEFAULT NULL;
