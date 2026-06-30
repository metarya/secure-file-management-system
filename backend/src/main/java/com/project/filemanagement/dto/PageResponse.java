package com.project.filemanagement.dto;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * Reusable, framework-agnostic wrapper for a single page of results.
 *
 * Spring Data's own {@link Page} serializes with an unstable JSON shape (and
 * logs a deprecation warning when returned directly from a controller), so we
 * project every paginated endpoint through this fixed contract instead:
 *
 * <pre>
 * { "content": [...], "page": 0, "size": 10,
 *   "totalElements": 156, "totalPages": 16, "first": true, "last": false }
 * </pre>
 *
 * Use {@link #of(Page, Function)} to map the entity page to its response DTO in
 * one step so controllers never duplicate the metadata-copying boilerplate.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    /** Maps an entity {@link Page} to a {@code PageResponse} of mapped DTOs. */
    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    /** Wraps an already-mapped {@link Page} of DTOs. */
    public static <T> PageResponse<T> of(Page<T> page) {
        return of(page, Function.identity());
    }
}
