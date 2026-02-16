package com.privod.platform.modules.document.repository;

import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {

    Optional<Document> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Document> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    List<Document> findByOrganizationIdAndProjectIdAndCategoryAndDeletedFalseOrderByCreatedAtDesc(
            UUID organizationId, UUID projectId, DocumentCategory category);

    List<Document> findByOrganizationIdAndParentVersionIdAndDeletedFalseOrderByDocVersionDesc(UUID organizationId, UUID parentVersionId);

    @Query("SELECT d FROM Document d WHERE d.deleted = false AND " +
            "d.organizationId = :organizationId AND " +
            "d.expiryDate IS NOT NULL AND d.expiryDate <= :deadline AND " +
            "d.status NOT IN ('ARCHIVED', 'CANCELLED')")
    List<Document> findExpiringDocuments(@Param("organizationId") UUID organizationId,
                                         @Param("deadline") LocalDate deadline);

    @Query("SELECT d FROM Document d WHERE d.deleted = false AND " +
            "d.organizationId = :organizationId AND " +
            "(LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.tags) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:projectId IS NULL OR d.projectId = :projectId)")
    Page<Document> searchDocuments(@Param("query") String query,
                                    @Param("organizationId") UUID organizationId,
                                    @Param("projectId") UUID projectId,
                                    Pageable pageable);
}
