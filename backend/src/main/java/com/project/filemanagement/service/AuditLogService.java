package com.project.filemanagement.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.AuditLogResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.entity.AuditLog;
import com.project.filemanagement.repository.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository
    ) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAction(
            String action,
            String performedBy,
            String details
    ) {

        AuditLog auditLog = new AuditLog(
                action,
                performedBy,
                details
        );

        auditLogRepository.save(auditLog);
    }

    public List<AuditLogResponse> getAllLogs() {

        return auditLogRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getAction(),
                        log.getPerformedBy(),
                        log.getDetails(),
                        log.getCreatedAt()
                ))
                .toList();
    }

    /** One page of audit logs, optionally filtered by a search term. */
    public PageResponse<AuditLogResponse> getLogsPage(String search, Pageable pageable) {

        boolean hasSearch = search != null && !search.isBlank();

        Page<AuditLog> page = hasSearch
                ? auditLogRepository
                    .findByActionContainingIgnoreCaseOrPerformedByContainingIgnoreCaseOrDetailsContainingIgnoreCase(
                            search.trim(), search.trim(), search.trim(), pageable)
                : auditLogRepository.findAll(pageable);

        return PageResponse.of(page, log -> new AuditLogResponse(
                log.getId(),
                log.getAction(),
                log.getPerformedBy(),
                log.getDetails(),
                log.getCreatedAt()
        ));
    }
}