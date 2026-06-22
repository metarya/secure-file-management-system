package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminStatsResponse {

    private final long totalUsers;
    private final long totalAdmins;
    private final long totalRegularUsers;
}