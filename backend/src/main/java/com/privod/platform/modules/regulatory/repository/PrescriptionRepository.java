package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    List<Prescription> findByInspectionIdAndDeletedFalse(UUID inspectionId);

    List<Prescription> findByStatusAndDeletedFalse(PrescriptionStatus status);

    @Query("SELECT p FROM Prescription p WHERE p.deleted = false " +
            "AND p.status <> 'COMPLETED' AND p.deadline IS NOT NULL AND p.deadline < CURRENT_DATE")
    List<Prescription> findOverdue();

    @Query(value = "SELECT nextval('prescription_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
