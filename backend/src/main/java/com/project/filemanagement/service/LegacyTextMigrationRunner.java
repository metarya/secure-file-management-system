package com.project.filemanagement.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * One-time legacy-data migration trigger. Disabled by default; only runs when the
 * application is started with {@code app.migrate-legacy-txt=true}. It rewrites the
 * stored bytes of any HTML-backed .txt file to plain text and is idempotent, so a
 * second run leaves already-correct files untouched.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.migrate-legacy-txt", havingValue = "true")
public class LegacyTextMigrationRunner implements ApplicationRunner {

    private final LegacyTextMigrationService legacyTextMigrationService;

    public LegacyTextMigrationRunner(LegacyTextMigrationService legacyTextMigrationService) {
        this.legacyTextMigrationService = legacyTextMigrationService;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== Legacy .txt migration: START ===");
        LegacyTextMigrationService.MigrationStats stats =
                legacyTextMigrationService.migrateAllLegacyTxt();
        log.info("=== Legacy .txt migration: DONE scanned={} migrated={} skipped={} failed={} ===",
                stats.scanned(), stats.migrated(), stats.skipped(), stats.failed());
    }
}
