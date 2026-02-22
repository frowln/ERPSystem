package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.CorrectiveActionStatus;
import com.privod.platform.modules.safety.domain.IncidentCorrectiveAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentCorrectiveActionRepository extends JpaRepository<IncidentCorrectiveAction, UUID> {

    List<IncidentCorrectiveAction> findByIncidentIdAndDeletedFalseOrderByDueDateAsc(UUID incidentId);

    Optional<IncidentCorrectiveAction> findByIdAndIncidentIdAndDeletedFalse(UUID id, UUID incidentId);

    @Query("SELECT COUNT(a) FROM IncidentCorrectiveAction a " +
            "WHERE a.incidentId = :incidentId AND a.deleted = false " +
            "AND a.status IN ('PLANNED', 'IN_PROGRESS')")
    long countOpenByIncidentId(@Param("incidentId") UUID incidentId);

    @Query("SELECT COUNT(a) FROM IncidentCorrectiveAction a " +
            "WHERE a.incidentId = :incidentId AND a.deleted = false")
    long countByIncidentId(@Param("incidentId") UUID incidentId);
}
