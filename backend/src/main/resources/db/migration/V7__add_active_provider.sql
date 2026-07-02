-- =============================================================================
-- V7__add_active_provider.sql
-- Add active_provider to user_storage_settings so users can switch the
-- provider they are currently browsing/uploading to without changing their
-- default_provider. NULL means "use default_provider".
-- =============================================================================

ALTER TABLE `user_storage_settings`
  ADD COLUMN `active_provider` varchar(32) DEFAULT NULL;
