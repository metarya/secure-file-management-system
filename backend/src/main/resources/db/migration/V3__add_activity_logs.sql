-- =============================================================================
-- V3__add_activity_logs.sql
-- -----------------------------------------------------------------------------
-- System Activity Log: a single, richer audit trail of every important action
-- performed by every user (authentication, file operations, sharing,
-- administration). Successor to the minimal `audit_logs` table — it additionally
-- records the actor's role, the affected resource (type / id / name), an outcome
-- status, and lightweight version references for file edits.
--
-- Column types/lengths mirror the JPA `ActivityLog` entity exactly so Hibernate
-- (`ddl-auto=validate`) accepts the mapping at startup. Full old/new file
-- contents are deliberately NOT stored here — only `version_before` /
-- `version_after` references are kept.
-- =============================================================================

CREATE TABLE `activity_logs` (
  `id`             bigint       NOT NULL AUTO_INCREMENT,
  `actor_email`    varchar(150) DEFAULT NULL,
  `actor_name`     varchar(150) DEFAULT NULL,
  `actor_role`     varchar(50)  DEFAULT NULL,
  `action`         varchar(64)  NOT NULL,
  `resource_type`  varchar(32)  DEFAULT NULL,
  `resource_id`    bigint       DEFAULT NULL,
  `resource_name`  varchar(500) DEFAULT NULL,
  `status`         varchar(16)  NOT NULL,
  `version_before` varchar(255) DEFAULT NULL,
  `version_after`  varchar(255) DEFAULT NULL,
  `details`        varchar(2000) DEFAULT NULL,
  `created_at`     datetime(6)  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activity_created_at` (`created_at`),
  KEY `idx_activity_actor_email` (`actor_email`),
  KEY `idx_activity_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
