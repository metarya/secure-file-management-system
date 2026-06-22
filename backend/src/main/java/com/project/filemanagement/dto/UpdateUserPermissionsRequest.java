package com.project.filemanagement.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserPermissionsRequest {

    // The complete set of permission codes this user should have granted
    // directly (replace semantics, mirroring how role updates work).
    private List<String> permissions;
}
