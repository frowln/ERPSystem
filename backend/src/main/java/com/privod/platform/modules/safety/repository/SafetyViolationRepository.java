package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SafetyViolationRepository extends JpaRepository<SafetyViolation, UUID> {

    Optional<SafetyViolation> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<SafetyViolation> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<SafetyViolation> findByOrganizationIdAndInspectionIdAndDeletedFalse(UUID organizationId, UUID inspectionId);

    List<SafetyViolation> findByOrganizationIdAndIncidentIdAndDeletedFalse(UUID organizationId, UUID incidentId);

    Page<SafetyViolation> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId,
                                                                       ViolationStatus status,
                                                                       Pageable pageable);

    Page<SafetyViolation> findByDeletedFalse(Pageable pageable);

    List<SafetyViolation> findByInspectionIdAndDeletedFalse(UUID inspectionId);

    List<SafetyViolation> findByIncidentIdAndDeletedFalse(UUID incidentId);

    Page<SafetyViolation> findByStatusAndDeletedFalse(ViolationStatus status, Pageable pageable);

    @Query("SELECT sv FROM SafetyViolation sv WHERE sv.deleted = false " +
            "AND sv.status <> 'RESOLVED' AND sv.dueDate IS NOT NULL AND sv.dueDate < CURRENT_DATE")
    List<SafetyViolation> findOverdue();

    @Query("SELECT sv FROM SafetyViolation sv WHERE sv.deleted = false AND sv.organizationId = :organizationId " +
            "AND sv.status <> 'RESOLVED' AND sv.dueDate IS NOT NULL AND sv.dueDate < CURRENT_DATE")
    List<SafetyViolation> findOverdueByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT sv.severity, COUNT(sv) FROM SafetyViolation sv " +
            "WHERE sv.deleted = false GROUP BY sv.severity")
    List<Object[]> countBySeverity();

    @Query("SELECT sv.severity, COUNT(sv) FROM SafetyViolation sv " +
            "WHERE sv.deleted = false AND sv.organizationId = :organizationId GROUP BY sv.severity")
    List<Object[]> countBySeverity(@Param("organizationId") UUID organizationId);

    @Query("SELECT sv.status, COUNT(sv) FROM SafetyViolation sv " +
            "WHERE sv.deleted = false GROUP BY sv.status")
    List<Object[]> countByStatus();

    @Query("SELECT sv.status, COUNT(sv) FROM SafetyViolation sv " +
            "WHERE sv.deleted = false AND sv.organizationId = :organizationId GROUP BY sv.status")
    List<Object[]> countByStatus(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(sv) FROM SafetyViolation sv WHERE sv.deleted = false")
    long countTotal();

    @Query("SELECT COUNT(sv) FROM SafetyViolation sv WHERE sv.deleted = false AND sv.organizationId = :organizationId")
    long countTotal(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(sv) FROM SafetyViolation sv WHERE sv.deleted = false " +
            "AND sv.status <> 'RESOLVED' AND sv.dueDate IS NOT NULL AND sv.dueDate < CURRENT_DATE")
    long countOverdue();

    @Query("SELECT COUNT(sv) FROM SafetyViolation sv WHERE sv.deleted = false AND sv.organizationId = :organizationId " +
            "AND sv.status <> 'RESOLVED' AND sv.dueDate IS NOT NULL AND sv.dueDate < CURRENT_DATE")
    long countOverdue(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(sv) FROM SafetyViolation sv WHERE sv.deleted = false AND sv.organizationId = :organizationId " +
            "AND sv.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenByOrganizationId(@Param("organizationId") UUID organizationId);
}
