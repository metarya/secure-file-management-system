package com.project.filemanagement.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.filemanagement.entity.ActivityLog;

@Repository
public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    // System Activity Log: paginated search across actor / action / resource /
    // status / details so the single search box matches any visible column.
    Page<ActivityLog>
    findByActorNameContainingIgnoreCaseOrActorEmailContainingIgnoreCaseOrActionContainingIgnoreCaseOrResourceNameContainingIgnoreCaseOrStatusContainingIgnoreCaseOrDetailsContainingIgnoreCase(
            String actorName,
            String actorEmail,
            String action,
            String resourceName,
            String status,
            String details,
            Pageable pageable
    );
}
