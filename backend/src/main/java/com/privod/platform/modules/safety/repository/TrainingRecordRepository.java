package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.TrainingRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, UUID>,
        JpaSpecificationExecutor<TrainingRecord> {

    Page<TrainingRecord> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<TrainingRecord> findByOrganizationIdAndEmployeeIdAndDeletedFalse(UUID organizationId, UUID employeeId, Pageable pageable);

    @Query("SELECT COUNT(tr) FROM TrainingRecord tr WHERE tr.deleted = false " +
            "AND tr.organizationId = :orgId AND tr.expiryDate IS NOT NULL AND tr.expiryDate < :now")
    long countExpired(@Param("orgId") UUID organizationId, @Param("now") LocalDate now);

    @Query("SELECT COUNT(tr) FROM TrainingRecord tr WHERE tr.deleted = false " +
            "AND tr.organizationId = :orgId")
    long countTotal(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(tr) FROM TrainingRecord tr WHERE tr.deleted = false " +
            "AND tr.organizationId = :orgId " +
            "AND (tr.expiryDate IS NULL OR tr.expiryDate >= :now)")
    long countValid(@Param("orgId") UUID organizationId, @Param("now") LocalDate now);
}
