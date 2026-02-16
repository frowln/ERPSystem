package com.privod.platform.modules.legal.repository;

import com.privod.platform.modules.legal.domain.LegalDecision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LegalDecisionRepository extends JpaRepository<LegalDecision, UUID> {

    Optional<LegalDecision> findByIdAndDeletedFalse(UUID id);

    List<LegalDecision> findByCaseIdAndDeletedFalseOrderByDecisionDateDesc(UUID caseId);

    Page<LegalDecision> findByCaseIdAndDeletedFalse(UUID caseId, Pageable pageable);

    @Query("SELECT d FROM LegalDecision d WHERE d.deleted = false AND d.enforceable = true " +
            "AND d.enforcementDeadline IS NOT NULL AND d.enforcementDeadline <= :deadline")
    List<LegalDecision> findApproachingEnforcementDeadlines(@Param("deadline") LocalDate deadline);
}
