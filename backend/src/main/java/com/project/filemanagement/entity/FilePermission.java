package com.project.filemanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "file_permissions",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"file_id", "shared_with_user_id"})
    }
)
public class FilePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The file that is being shared
    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    // The user who receives access to the file
    @ManyToOne
    @JoinColumn(name = "shared_with_user_id", nullable = false)
    private User sharedWithUser;

    // Permission type is now linked to permission_types.code
    @ManyToOne
    @JoinColumn(name = "permission_type", referencedColumnName = "code", nullable = false)
    private PermissionType permissionType;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public FilePermission() {
    }

    public FilePermission(FileEntity file, User sharedWithUser, PermissionType permissionType) {
        this.file = file;
        this.sharedWithUser = sharedWithUser;
        this.permissionType = permissionType;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public FileEntity getFile() {
        return file;
    }

    public User getSharedWithUser() {
        return sharedWithUser;
    }

    public PermissionType getPermissionType() {
        return permissionType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setFile(FileEntity file) {
        this.file = file;
    }

    public void setSharedWithUser(User sharedWithUser) {
        this.sharedWithUser = sharedWithUser;
    }

    public void setPermissionType(PermissionType permissionType) {
        this.permissionType = permissionType;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
