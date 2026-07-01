package com.project.filemanagement.dto;

/**
 * One line in a rendered text diff.
 *
 * <p>{@code type} is {@code "context"} (unchanged), {@code "added"} or
 * {@code "removed"}. A modified line is represented as a {@code removed} line
 * immediately followed by an {@code added} line (the GitHub convention), so the
 * frontend needs no separate "modified" case. Line numbers are 1-based and null
 * on the side where the line does not exist.
 */
public record DiffLine(
        String type,
        Integer oldLineNumber,
        Integer newLineNumber,
        String content
) {
}
