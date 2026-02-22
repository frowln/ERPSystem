package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.MultiProjectAllocation;
import com.privod.platform.modules.planning.domain.MultiProjectResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MultiProjectAllocationRepository extends JpaRepository<MultiProjectAllocation, UUID> {

    Page<MultiProjectAllocation> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<MultiProjectAllocation> findByProjectIdAndDeletedFalse(UUID projectId);

    List<MultiProjectAllocation> findByResourceIdAndDeletedFalse(UUID resourceId);

    /**
     * Find allocations overlapping a date range for a given organization.
     */
    @Query("SELECT a FROM MultiProjectAllocation a WHERE a.deleted = false " +
            "AND a.organizationId = :orgId " +
            "AND a.startDate <= :endDate AND a.endDate >= :startDate")
    List<MultiProjectAllocation> findByDateRange(@Param("orgId") UUID orgId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    /**
     * Find allocations overlapping a date range with optional filters.
     */
    @Query("SELECT a FROM MultiProjectAllocation a WHERE a.deleted = false " +
            "AND a.organizationId = :orgId " +
            "AND a.startDate <= :endDate AND a.endDate >= :startDate " +
            "AND (:resourceType IS NULL OR a.resourceType = :resourceType) " +
            "AND (:projectIds IS NULL OR a.projectId IN :projectIds)")
    List<MultiProjectAllocation> findByDateRangeFiltered(@Param("orgId") UUID orgId,
                                                          @Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate,
                                                          @Param("resourceType") MultiProjectResourceType resourceType,
                                                          @Param("projectIds") List<UUID> projectIds);

    /**
     * Find overlapping allocations for a specific resource in a date range (excluding a given allocation ID).
     * Used for conflict detection.
     */
    @Query("SELECT a FROM MultiProjectAllocation a WHERE a.deleted = false " +
            "AND a.resourceId = :resourceId " +
            "AND a.startDate <= :endDate AND a.endDate >= :startDate " +
            "AND (:excludeId IS NULL OR a.id <> :excludeId)")
    List<MultiProjectAllocation> findOverlappingAllocations(@Param("resourceId") UUID resourceId,
                                                             @Param("startDate") LocalDate startDate,
                                                             @Param("endDate") LocalDate endDate,
                                                             @Param("excludeId") UUID excludeId);

    /**
     * Find all allocations for resources that have total allocation > 100% in an overlapping period.
     * Returns all allocations in the date range for the organization so the service can compute conflicts.
     */
    @Query("SELECT a FROM MultiProjectAllocation a WHERE a.deleted = false " +
            "AND a.organizationId = :orgId " +
            "AND a.startDate <= :endDate AND a.endDate >= :startDate " +
            "ORDER BY a.resourceId, a.startDate")
    List<MultiProjectAllocation> findAllForConflictDetection(@Param("orgId") UUID orgId,
                                                              @Param("startDate") LocalDate startDate,
                                                              @Param("endDate") LocalDate endDate);
}
