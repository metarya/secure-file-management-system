-- =============================================================================
-- V4__add_file_versions.sql
-- -----------------------------------------------------------------------------
-- File Versioning: every edit creates a new immutable snapshot instead of
-- overwriting content. This migration adds:
--
--   1. `file_versions`            — the immutable per-version snapshots.
--   2. `files.current_version_id` — pointer from a file to its latest version.
--   3. `activity_logs.version_before_id` / `version_after_id`
--                                 — audit integration: an edit records the two
--                                   version ids (not file contents) so the
--                                   Phase-2 diff viewer can compare them.
--
-- Column types/lengths mirror the JPA entities exactly so Hibernate
-- (`ddl-auto=validate`) accepts the mappings at startup.
--
-- `file_versions.file_data` holds the RAW (uncompressed) content bytes, making
-- each version self-contained for future diffing. FileEntity continues to store
-- the served (compressed) bytes, so preview/download/streaming are unchanged.
--
-- `files.current_version_id` is intentionally a plain indexed column WITHOUT a
-- foreign key, to avoid a circular files <-> file_versions FK cycle; integrity
-- is maintained in the service layer.
-- =============================================================================

CREATE TABLE `file_versions` (
  `id`             bigint       NOT NULL AUTO_INCREMENT,
  `file_id`        bigint       NOT NULL,
  `version_number` int          NOT NULL,
  `file_data`      longblob,
  `file_size`      bigint       NOT NULL,
  `checksum`       varchar(64)  DEFAULT NULL,
  `mime_type`      varchar(255) DEFAULT NULL,
  `created_by`     varchar(150) DEFAULT NULL,
  `created_at`     datetime(6)  NOT NULL,
  `comment`        varchar(500) DEFAULT NULL,
  `is_current`     bit(1)       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_file_versions_file_id` (`file_id`),
  KEY `idx_file_versions_file_current` (`file_id`,`is_current`),
  CONSTRAINT `fk_file_versions_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Pointer to the latest version (plain column; see header note on the FK cycle).
ALTER TABLE `files`
  ADD COLUMN `current_version_id` bigint DEFAULT NULL,
  ADD KEY `idx_files_current_version` (`current_version_id`);

-- Audit integration: store the version ids on either side of an edit.
ALTER TABLE `activity_logs`
  ADD COLUMN `version_before_id` bigint DEFAULT NULL,
  ADD COLUMN `version_after_id`  bigint DEFAULT NULL;
