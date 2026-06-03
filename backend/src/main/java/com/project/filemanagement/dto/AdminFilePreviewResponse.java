package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor
public class AdminFilePreviewResponse {


    private final  String fileName;
    private final  String ownerName;
    private final String ownerEmail;
    private final String content;

}