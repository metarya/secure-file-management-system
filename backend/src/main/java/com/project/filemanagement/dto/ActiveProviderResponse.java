package com.project.filemanagement.dto;

import java.util.List;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ActiveProviderResponse {
    private final String activeProvider;
    private final String defaultProvider;
    private final List<String> availableProviders;
}
