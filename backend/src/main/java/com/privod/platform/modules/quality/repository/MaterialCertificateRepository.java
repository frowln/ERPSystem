package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateType;
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
public interface MaterialCertificateRepository extends JpaRepository<MaterialCertificate, UUID>,
        JpaSpecificationExecutor<MaterialCertificate> {

    Page<MaterialCertificate> findByDeletedFalse(Pageable pageable);

    Page<MaterialCertificate> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    List<MaterialCertificate> findByMaterialIdAndDeletedFalse(UUID materialId);

    Page<MaterialCertificate> findByStatusAndDeletedFalse(MaterialCertificateStatus status, Pageable pageable);

    List<MaterialCertificate> findByCertificateTypeAndDeletedFalse(MaterialCertificateType certificateType);

    @Query("SELECT mc FROM MaterialCertificate mc " +
            "WHERE mc.deleted = false AND mc.expiryDate IS NOT NULL AND mc.expiryDate <= :date")
    List<MaterialCertificate> findExpiredCertificates(@Param("date") LocalDate date);

    @Query("SELECT mc FROM MaterialCertificate mc " +
            "WHERE mc.deleted = false AND mc.expiryDate IS NOT NULL " +
            "AND mc.expiryDate > :today AND mc.expiryDate <= :warningDate")
    List<MaterialCertificate> findExpiringCertificates(@Param("today") LocalDate today,
                                                        @Param("warningDate") LocalDate warningDate);
}
