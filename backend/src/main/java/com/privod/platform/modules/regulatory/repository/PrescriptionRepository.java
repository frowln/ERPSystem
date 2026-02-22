package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    Optional<Prescription> findByIdAndDeletedFalse(UUID id);

    Optional<Prescription> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<Prescription> findByInspectionIdAndDeletedFalse(UUID inspectionId);

    List<Prescription> findByStatusAndDeletedFalse(PrescriptionStatus status);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false " +
            "AND p.status <> 'COMPLETED' AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdue();

    @Query("SELECT p FROM Prescription p, RegulatoryInspection i WHERE p.deleted = false AND i.deleted = false " +
            "AND p.inspectionId = i.id AND i.projectId IN :projectIds " +
            "AND p.status <> 'COMPLETED' AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdueByProjectIds(@Param("projectIds") List<UUID> projectIds);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND p.status NOT IN ('COMPLETED', 'CLOSED') " +
            "AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdueByOrganizationId(@Param("orgId") UUID orgId);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND (:projectId IS NULL OR p.projectId = :projectId) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:bodyType IS NULL OR p.regulatoryBodyType = :bodyType) " +
            "AND (:search IS NULL OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(p.number) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Prescription> findAllFiltered(@Param("orgId") UUID orgId,
                                        @Param("projectId") UUID projectId,
                                        @Param("status") PrescriptionStatus status,
                                        @Param("bodyType") RegulatoryBodyType bodyType,
                                        @Param("search") String search,
                                        Pageable pageable);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND p.status NOT IN ('COMPLETED', 'CLOSED')")
    long countActiveByOrg(@Param("orgId") UUID orgId);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND p.status NOT IN ('COMPLETED', 'CLOSED') " +
            "AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    long countOverdueByOrg(@Param("orgId") UUID orgId);

    @Query("SELECT COALESCE(SUM(p.fineAmount), 0) FROM Prescription p WHERE p.deleted = false " +
            "AND p.organizationId = :orgId")
    BigDecimal sumFinesByOrg(@Param("orgId") UUID orgId);

    @Query("SELECT p.status, COUNT(p) FROM Prescription p WHERE p.deleted = false " +
            "AND p.organizationId = :orgId GROUP BY p.status")
    List<Object[]> countByStatusForOrg(@Param("orgId") UUID orgId);

    @Query("SELECT p.regulatoryBodyType, COUNT(p) FROM Prescription p WHERE p.deleted = false " +
            "AND p.organizationId = :orgId AND p.status NOT IN ('COMPLETED', 'CLOSED') " +
            "GROUP BY p.regulatoryBodyType")
    List<Object[]> countActiveByBodyTypeForOrg(@Param("orgId") UUID orgId);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false AND p.organizationId = :orgId " +
            "AND p.status NOT IN ('COMPLETED', 'CLOSED') " +
            "AND p.deadline IS NOT NULL AND p.deadline <= :deadlineBefore AND p.deadline >= CURRENT_DATE " +
            "ORDER BY p.deadline ASC")
    List<Prescription> findApproachingDeadline(@Param("orgId") UUID orgId,
                                                @Param("deadlineBefore") LocalDate deadlineBefore);

    @Query(value = "SELECT nextval('prescription_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
