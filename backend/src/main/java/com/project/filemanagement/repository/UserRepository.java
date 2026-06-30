package com.project.filemanagement.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.project.filemanagement.dto.AdminUserActivityResponse;
import com.project.filemanagement.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndOtp(String email, String otp);

    boolean existsByEmail(String email);

    // Admin Users: paginated search across name + email.
    Page<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName,
            String email,
            Pageable pageable
    );

    /**
     * Admin Activity table: one page of per-user aggregates computed in the
     * database so the result can be sorted by an aggregate (file count, storage
     * used, latest upload) <em>before</em> the page is sliced.
     *
     * <p>A LEFT JOIN keeps users with no files (COUNT 0, storage 0, last-upload
     * NULL), matching the previous in-Java behaviour. Sorting is supplied via
     * the {@link Pageable}'s {@code Sort}; aggregate columns are ordered with
     * {@code JpaSort.unsafe(...)} (see {@code PageRequests.ofUnsafe}) using the
     * exact expressions below, while {@code u.*} columns sort directly.
     */
    @Query(
            value = "SELECT new com.project.filemanagement.dto.AdminUserActivityResponse(" +
                    "u.id, u.fullName, u.email, " +
                    "COUNT(f.id), " +
                    "COALESCE(SUM(f.fileSize), 0L), " +
                    "MAX(f.uploadedAt)) " +
                    "FROM User u LEFT JOIN FileEntity f ON f.owner = u " +
                    "WHERE (:search IS NULL " +
                    "  OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "GROUP BY u.id, u.fullName, u.email, u.createdAt",
            countQuery = "SELECT COUNT(u) FROM User u " +
                    "WHERE (:search IS NULL " +
                    "  OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                    "  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    Page<AdminUserActivityResponse> findUserActivity(
            @Param("search") String search,
            Pageable pageable
    );
}