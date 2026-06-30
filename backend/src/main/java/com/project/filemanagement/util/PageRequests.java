package com.project.filemanagement.util;

import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;

/**
 * Builds a validated {@link Pageable} from the raw request parameters every
 * paginated endpoint accepts ({@code page}, {@code size}, {@code sort},
 * {@code direction}).
 *
 * <p>Centralizing this here means individual controllers/services never:
 * <ul>
 *   <li>trust a client-supplied sort field — only fields present in the
 *       supplied allowlist can ever reach Spring Data, so arbitrary entity
 *       property paths can't be injected via the query string;</li>
 *   <li>re-implement the page/size clamping or the deterministic tiebreaker
 *       that keeps ordering stable when the sort column has ties.</li>
 * </ul>
 */
public final class PageRequests {

    // Hard ceiling so a client can't request a truly unbounded page. Generous
    // enough that "give me everything" reads (e.g. the permissions user picker,
    // which has no paged UI) still work, while keeping a sane upper bound.
    private static final int MAX_SIZE = 1000;
    private static final int DEFAULT_SIZE = 10;

    private PageRequests() {
    }

    /**
     * @param page          requested zero-based page index (negatives clamp to 0)
     * @param size          requested page size (clamped to 1..{@value #MAX_SIZE})
     * @param sort          client-supplied sort key (validated against allowlist)
     * @param direction     {@code asc} or {@code desc} (anything else = desc)
     * @param sortAllowlist maps public sort keys to entity property paths
     * @param defaultSort   allowlist key used when {@code sort} is unknown/blank
     * @param tiebreaker    entity property appended as a stable secondary sort
     *                      (e.g. {@code "id"}); pass {@code null} to skip
     */
    public static Pageable of(
            int page,
            int size,
            String sort,
            String direction,
            Map<String, String> sortAllowlist,
            String defaultSort,
            String tiebreaker
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);

        String property = sortAllowlist.getOrDefault(
                sort, sortAllowlist.get(defaultSort));

        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Sort resolved = Sort.by(dir, property);

        // Append the tiebreaker in the same direction so rows that tie on the
        // primary column still have a deterministic, reversible order.
        if (tiebreaker != null && !tiebreaker.equals(property)) {
            resolved = resolved.and(Sort.by(dir, tiebreaker));
        }

        return PageRequest.of(safePage, safeSize, resolved);
    }

    /** Convenience overload using the conventional {@code "id"} tiebreaker. */
    public static Pageable of(
            int page,
            int size,
            String sort,
            String direction,
            Map<String, String> sortAllowlist,
            String defaultSort
    ) {
        return of(page, size, sort, direction, sortAllowlist, defaultSort, "id");
    }

    /**
     * Like {@link #of}, but for queries that must sort by a raw JPQL
     * <em>expression</em> rather than a mapped entity property — e.g. an
     * aggregate such as {@code SUM(f.fileSize)} or {@code MAX(f.uploadedAt)} in
     * a grouped projection query. The allowlist maps each public sort key to the
     * exact ORDER BY expression, and {@link JpaSort#unsafe} inserts it literally.
     *
     * <p>Because the expressions come from a fixed, server-side allowlist (never
     * straight from the request), there is no injection risk despite "unsafe".
     *
     * @param sortAllowlist  maps public sort keys to raw ORDER BY expressions
     * @param tiebreakerExpr raw expression appended as a stable secondary sort
     *                       (e.g. {@code "u.id"}); pass {@code null} to skip
     */
    public static Pageable ofUnsafe(
            int page,
            int size,
            String sort,
            String direction,
            Map<String, String> sortAllowlist,
            String defaultSort,
            String tiebreakerExpr
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);

        String expr = sortAllowlist.getOrDefault(
                sort, sortAllowlist.get(defaultSort));

        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Sort resolved = JpaSort.unsafe(dir, expr);

        if (tiebreakerExpr != null && !tiebreakerExpr.equals(expr)) {
            resolved = resolved.and(JpaSort.unsafe(dir, tiebreakerExpr));
        }

        return PageRequest.of(safePage, safeSize, resolved);
    }

    public static int defaultSize() {
        return DEFAULT_SIZE;
    }
}
