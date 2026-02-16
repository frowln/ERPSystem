package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentContainerRepository extends JpaRepository<DocumentContainer, UUID>,
        JpaSpecificationExecutor<DocumentContainer> {

    Page<DocumentContainer> findByDeletedFalse(Pageable pageable);

    Page<DocumentContainer> findByLifecycleStateAndDeletedFalse(DocumentLifecycleState state, Pageable pageable);

    @Query("SELECT d FROM DocumentContainer d WHERE d.deleted = false AND " +
            "(LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(d.documentNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DocumentContainer> searchByTitleOrNumberGlobal(
            @Param("search") String search,
            Pageable pageable);

    Optional<DocumentContainer> findByProjectIdAndDocumentNumberAndDeletedFalse(UUID projectId, String documentNumber);

    Page<DocumentContainer> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<DocumentContainer> findByProjectIdAndLifecycleStateAndDeletedFalse(
            UUID projectId, DocumentLifecycleState state, Pageable pageable);

    @Query("SELECT d FROM DocumentContainer d WHERE d.deleted = false AND d.projectId = :projectId AND " +
            "(LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(d.documentNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DocumentContainer> searchByTitleOrNumber(
            @Param("projectId") UUID projectId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT d.lifecycleState, COUNT(d) FROM DocumentContainer d " +
            "WHERE d.deleted = false AND d.projectId = :projectId GROUP BY d.lifecycleState")
    List<Object[]> countByLifecycleState(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(d) FROM DocumentContainer d WHERE d.deleted = false AND d.projectId = :projectId")
    long countActiveByProject(@Param("projectId") UUID projectId);
}
