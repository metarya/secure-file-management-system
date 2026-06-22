package com.project.filemanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@NoArgsConstructor
@Setter
@Entity
@Table(name = "permission_types")
public class PermissionType {

    @Id
    @Column(name = "code", length = 50, nullable = false)
    private String code;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    public PermissionType(String code, String description, Boolean active) {
        this.code = code;
        this.description = description;
        this.active = active;
    }
}
