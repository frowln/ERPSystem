package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeCertificateRepository extends JpaRepository<EmployeeCertificate, UUID> {

    List<EmployeeCertificate> findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(UUID employeeId);

    @Query("SELECT ec FROM EmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate < CURRENT_DATE")
    List<EmployeeCertificate> findExpiredCertificates();

    @Query("SELECT ec FROM EmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate BETWEEN CURRENT_DATE AND :deadline")
    List<EmployeeCertificate> findExpiringCertificates(@Param("deadline") LocalDate deadline);
}
