package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.CertificateType;
import com.privod.platform.modules.quality.domain.QualityCertificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface QualityCertificateRepository extends JpaRepository<QualityCertificate, UUID>,
        JpaSpecificationExecutor<QualityCertificate> {

    Page<QualityCertificate> findByDeletedFalse(Pageable pageable);

    Page<QualityCertificate> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    Page<QualityCertificate> findBySupplierIdAndDeletedFalse(UUID supplierId, Pageable pageable);

    List<QualityCertificate> findByCertificateTypeAndDeletedFalse(CertificateType certificateType);

    @Query("SELECT qc FROM QualityCertificate qc " +
            "WHERE qc.deleted = false AND qc.expiryDate IS NOT NULL AND qc.expiryDate <= :date")
    List<QualityCertificate> findExpiredCertificates(@Param("date") LocalDate date);

    @Query("SELECT qc FROM QualityCertificate qc " +
            "WHERE qc.deleted = false AND qc.expiryDate IS NOT NULL " +
            "AND qc.expiryDate > :today AND qc.expiryDate <= :warningDate")
    List<QualityCertificate> findExpiringCertificates(@Param("today") LocalDate today,
                                                       @Param("warningDate") LocalDate warningDate);
}
