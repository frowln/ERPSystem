package com.privod.platform.modules.legal.repository;

import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.CaseType;
import com.privod.platform.modules.legal.domain.LegalCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LegalCaseRepository extends JpaRepository<LegalCase, UUID>,
        JpaSpecificationExecutor<LegalCase> {

    Optional<LegalCase> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<LegalCase> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<LegalCase> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Page<LegalCase> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, CaseStatus status, Pageable pageable);

    Page<LegalCase> findByOrganizationIdAndLawyerIdAndDeletedFalse(UUID organizationId, UUID lawyerId, Pageable pageable);

    Page<LegalCase> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<LegalCase> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    Page<LegalCase> findByStatusAndDeletedFalse(CaseStatus status, Pageable pageable);

    Page<LegalCase> findByCaseTypeAndDeletedFalse(CaseType caseType, Pageable pageable);

    Page<LegalCase> findByLawyerIdAndDeletedFalse(UUID lawyerId, Pageable pageable);

    @Query("SELECT c FROM LegalCase c WHERE c.deleted = false AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LegalCase> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM LegalCase c WHERE c.deleted = false AND c.organizationId = :organizationId AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LegalCase> searchByOrganizationId(@Param("search") String search,
                                           @Param("organizationId") UUID organizationId,
                                           Pageable pageable);

    @Query("SELECT c FROM LegalCase c WHERE c.deleted = false AND c.hearingDate = :date")
    List<LegalCase> findByHearingDate(@Param("date") LocalDate date);

    @Query("SELECT c FROM LegalCase c WHERE c.deleted = false AND c.hearingDate BETWEEN :from AND :to")
    List<LegalCase> findUpcomingHearings(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT c FROM LegalCase c WHERE c.deleted = false AND c.organizationId = :organizationId AND c.hearingDate BETWEEN :from AND :to")
    List<LegalCase> findUpcomingHearingsByOrganizationId(@Param("organizationId") UUID organizationId,
                                                          @Param("from") LocalDate from,
                                                          @Param("to") LocalDate to);

    long countByStatusAndDeletedFalse(CaseStatus status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM LegalCase c WHERE c.deleted = false " +
            "AND c.status NOT IN ('CLOSED', 'WON', 'LOST')")
    BigDecimal sumActiveClaimsAmount();

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM LegalCase c WHERE c.deleted = false " +
            "AND c.organizationId = :organizationId AND c.status NOT IN ('CLOSED', 'WON', 'LOST')")
    BigDecimal sumActiveClaimsAmountByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT c.status, COUNT(c) FROM LegalCase c WHERE c.deleted = false GROUP BY c.status")
    List<Object[]> countByStatus();

    @Query("SELECT c.status, COUNT(c) FROM LegalCase c WHERE c.deleted = false AND c.organizationId = :organizationId GROUP BY c.status")
    List<Object[]> countByStatusAndOrganizationId(@Param("organizationId") UUID organizationId);
}
