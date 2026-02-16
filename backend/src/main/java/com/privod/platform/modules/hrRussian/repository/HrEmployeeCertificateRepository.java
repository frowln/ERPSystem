package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.CertificateStatus;
import com.privod.platform.modules.hrRussian.domain.HrEmployeeCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface HrEmployeeCertificateRepository extends JpaRepository<HrEmployeeCertificate, UUID> {

    List<HrEmployeeCertificate> findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(UUID employeeId);

    List<HrEmployeeCertificate> findByStatusAndDeletedFalse(CertificateStatus status);

    @Query("SELECT ec FROM HrEmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate < CURRENT_DATE")
    List<HrEmployeeCertificate> findExpiredCertificates();

    @Query("SELECT ec FROM HrEmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate BETWEEN CURRENT_DATE AND :deadline")
    List<HrEmployeeCertificate> findExpiringCertificates(@Param("deadline") LocalDate deadline);
}
