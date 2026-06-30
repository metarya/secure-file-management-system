package com.project.filemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Body for POST /api/markdown/render — raw Markdown to be rendered to HTML. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MarkdownRenderRequest {

    private String content;
}
