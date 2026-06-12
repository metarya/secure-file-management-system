package com.project.filemanagement.dto;

import java.util.List;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UserPermissionsResponse {

    private final Long userId;

    // Inherited from the user's role — shown in the UI but not directly editable
    // (changing these means changing the role).
    private final List<String> rolePermissions;

    // Granted directly to this user — these are the editable ones.
    private final List<String> directPermissions;

    // The effective set the user actually has (role + direct, de-duplicated).
    private final List<String> effectivePermissions;
}
