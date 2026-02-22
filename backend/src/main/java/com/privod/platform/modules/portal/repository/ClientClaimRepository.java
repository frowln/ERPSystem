package com.privod.platform.modules.portal.repository;

import com.privod.platform.modules.portal.domain.ClaimPriority;
import com.privod.platform.modules.portal.domain.ClaimStatus;
import com.privod.platform.modules.portal.domain.ClientClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientClaimRepository extends JpaRepository<ClientClaim, UUID>, JpaSpecificationExecutor<ClientClaim> {

    Page<ClientClaim> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<ClientClaim> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Page<ClientClaim> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ClaimStatus status, Pageable pageable);

    Page<ClientClaim> findByOrganizationIdAndAssignedContractorIdAndDeletedFalse(UUID organizationId, UUID contractorId, Pageable pageable);

    List<ClientClaim> findByReportedByPortalUserIdAndDeletedFalse(UUID portalUserId);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ClaimStatus status);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    long countByOrganizationIdAndProjectIdAndStatusAndDeletedFalse(UUID organizationId, UUID projectId, ClaimStatus status);

    @Query("SELECT c FROM ClientClaim c WHERE c.deleted = false " +
            "AND c.slaBreached = false " +
            "AND c.slaDeadline < CURRENT_TIMESTAMP " +
            "AND c.status NOT IN (com.privod.platform.modules.portal.domain.ClaimStatus.CLOSED, " +
            "com.privod.platform.modules.portal.domain.ClaimStatus.REJECTED)")
    List<ClientClaim> findSlaBreachedCandidates();

    @Query("SELECT c.category, COUNT(c) FROM ClientClaim c " +
            "WHERE c.organizationId = :orgId AND c.deleted = false " +
            "AND (:projectId IS NULL OR c.projectId = :projectId) " +
            "GROUP BY c.category")
    List<Object[]> countByCategory(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    @Query("SELECT c.status, COUNT(c) FROM ClientClaim c " +
            "WHERE c.organizationId = :orgId AND c.deleted = false " +
            "AND (:projectId IS NULL OR c.projectId = :projectId) " +
            "GROUP BY c.status")
    List<Object[]> countByStatus(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    @Query("SELECT c.priority, COUNT(c) FROM ClientClaim c " +
            "WHERE c.organizationId = :orgId AND c.deleted = false " +
            "AND (:projectId IS NULL OR c.projectId = :projectId) " +
            "GROUP BY c.priority")
    List<Object[]> countByPriority(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    @Query("SELECT c FROM ClientClaim c WHERE c.organizationId = :orgId AND c.deleted = false " +
            "AND c.slaBreached = true AND c.status NOT IN (" +
            "com.privod.platform.modules.portal.domain.ClaimStatus.CLOSED, " +
            "com.privod.platform.modules.portal.domain.ClaimStatus.REJECTED)" +
            "AND (:projectId IS NULL OR c.projectId = :projectId)")
    List<ClientClaim> findOverdue(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400.0) FROM client_claims c " +
            "WHERE c.organization_id = :orgId AND c.deleted = false " +
            "AND c.resolution_date IS NOT NULL " +
            "AND (:projectId IS NULL OR c.project_id = CAST(:projectId AS UUID))", nativeQuery = true)
    Double avgResolutionDays(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('client_claim_number_seq')", nativeQuery = true)
    Long getNextClaimNumber();
}
