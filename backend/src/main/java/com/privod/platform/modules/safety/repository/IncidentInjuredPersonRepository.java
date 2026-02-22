package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.IncidentInjuredPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentInjuredPersonRepository extends JpaRepository<IncidentInjuredPerson, UUID> {

    List<IncidentInjuredPerson> findByIncidentIdAndDeletedFalse(UUID incidentId);

    Optional<IncidentInjuredPerson> findByIdAndIncidentIdAndDeletedFalse(UUID id, UUID incidentId);

    @Query("SELECT COUNT(p) FROM IncidentInjuredPerson p WHERE p.incidentId = :incidentId AND p.deleted = false")
    long countByIncidentId(@Param("incidentId") UUID incidentId);

    @Query("SELECT COALESCE(SUM(p.workDaysLost), 0) FROM IncidentInjuredPerson p " +
            "WHERE p.incidentId = :incidentId AND p.deleted = false")
    int sumWorkDaysLostByIncidentId(@Param("incidentId") UUID incidentId);
}
