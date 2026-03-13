package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.PpeIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PpeIssueRepository extends JpaRepository<PpeIssue, UUID>,
        JpaSpecificationExecutor<PpeIssue> {

    Optional<PpeIssue> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<PpeIssue> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndEmployeeIdAndDeletedFalse(UUID organizationId, UUID employeeId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndItemIdAndDeletedFalse(UUID organizationId, UUID itemId, Pageable pageable);

    Page<PpeIssue> findByOrganizationIdAndReturnedFalseAndDeletedFalse(UUID organizationId, Pageable pageable);

    /** P1-SAF-2: Total quantity issued to an employee for a specific item within a date range (year). */
    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM PpeIssue p " +
            "WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND p.employeeId = :employeeId AND p.itemId = :itemId " +
            "AND p.issuedDate >= :from AND p.issuedDate <= :to")
    Integer sumQuantityByEmployeeAndItemInPeriod(@Param("orgId") UUID orgId,
                                                  @Param("employeeId") UUID employeeId,
                                                  @Param("itemId") UUID itemId,
                                                  @Param("from") LocalDate from,
                                                  @Param("to") LocalDate to);
}
