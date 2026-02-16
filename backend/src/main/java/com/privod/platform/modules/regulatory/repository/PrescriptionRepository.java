package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    Optional<Prescription> findByIdAndDeletedFalse(UUID id);

    List<Prescription> findByInspectionIdAndDeletedFalse(UUID inspectionId);

    List<Prescription> findByStatusAndDeletedFalse(PrescriptionStatus status);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false " +
            "AND p.status <> 'COMPLETED' AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdue();

    @Query("SELECT p FROM Prescription p, RegulatoryInspection i WHERE p.deleted = false AND i.deleted = false " +
            "AND p.inspectionId = i.id AND i.projectId IN :projectIds " +
            "AND p.status <> 'COMPLETED' AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdueByProjectIds(@Param("projectIds") List<UUID> projectIds);

    @Query(value = "SELECT nextval('prescription_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
