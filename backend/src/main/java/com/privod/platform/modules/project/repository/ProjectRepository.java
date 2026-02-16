package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {

    Optional<Project> findByCode(String code);

    Optional<Project> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Project> findByStatusAndDeletedFalse(ProjectStatus status, Pageable pageable);

    Page<Project> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query("SELECT p.id FROM Project p WHERE p.deleted = false AND p.organizationId = :organizationId")
    List<UUID> findAllIdsByOrganizationIdAndDeletedFalse(@Param("organizationId") UUID organizationId);

    @Query("SELECT p FROM Project p WHERE p.deleted = false AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchByName(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.deleted = false AND p.organizationId = :organizationId AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchByNameAndOrganizationId(@Param("search") String search,
                                                @Param("organizationId") UUID organizationId,
                                                Pageable pageable);

    @Query("SELECT p.status, COUNT(p) FROM Project p WHERE p.deleted = false GROUP BY p.status")
    List<Object[]> countByStatus();

    @Query("SELECT COUNT(p) FROM Project p WHERE p.deleted = false")
    long countActiveProjects();

    @Query("SELECT p.status, COUNT(p) FROM Project p WHERE p.deleted = false AND p.organizationId = :organizationId GROUP BY p.status")
    List<Object[]> countByStatusAndOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.deleted = false AND p.organizationId = :organizationId")
    long countActiveProjectsByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT SUM(p.budgetAmount) FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED'")
    BigDecimal sumBudgetAmount();

    @Query("SELECT SUM(p.contractAmount) FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED'")
    BigDecimal sumContractAmount();

    @Query("SELECT SUM(p.budgetAmount) FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED' AND p.organizationId = :organizationId")
    BigDecimal sumBudgetAmountByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT SUM(p.contractAmount) FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED' AND p.organizationId = :organizationId")
    BigDecimal sumContractAmountByOrganizationId(@Param("organizationId") UUID organizationId);

    /**
     * Get IDs of all active (non-deleted, non-cancelled) projects.
     * Used for dashboard financial aggregation.
     */
    @Query("SELECT p.id FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED'")
    List<UUID> findActiveProjectIds();

    @Query("SELECT p.id FROM Project p WHERE p.deleted = false AND p.status <> 'CANCELLED' AND p.organizationId = :organizationId")
    List<UUID> findActiveProjectIdsByOrganizationId(@Param("organizationId") UUID organizationId);

    /**
     * Batch lookup of project names by IDs.
     * Returns pairs of [projectId, projectName].
     */
    @Query("SELECT p.id, p.name FROM Project p WHERE p.id IN :ids AND p.deleted = false")
    List<Object[]> findNamesByIds(@Param("ids") List<UUID> ids);

    @Query("SELECT p.id, p.name FROM Project p WHERE p.id IN :ids AND p.deleted = false AND p.organizationId = :organizationId")
    List<Object[]> findNamesByIdsAndOrganizationId(@Param("ids") List<UUID> ids,
                                                   @Param("organizationId") UUID organizationId);

    @Query(value = "SELECT nextval('project_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
