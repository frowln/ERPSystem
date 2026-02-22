package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeCertificateRepository extends JpaRepository<EmployeeCertificate, UUID> {

    List<EmployeeCertificate> findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(UUID employeeId);

    Optional<EmployeeCertificate> findByIdAndDeletedFalse(UUID id);

    @Query("SELECT ec FROM EmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate < CURRENT_DATE")
    List<EmployeeCertificate> findExpiredCertificates();

    @Query("SELECT ec FROM EmployeeCertificate ec WHERE ec.deleted = false " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate BETWEEN CURRENT_DATE AND :deadline")
    List<EmployeeCertificate> findExpiringCertificates(@Param("deadline") LocalDate deadline);

    @Query("SELECT ec.status, COUNT(ec) FROM EmployeeCertificate ec " +
            "JOIN Employee e ON ec.employeeId = e.id " +
            "WHERE ec.deleted = false AND e.deleted = false AND e.organizationId = :orgId " +
            "GROUP BY ec.status")
    List<Object[]> countByStatusForOrg(@Param("orgId") UUID orgId);

    @Query("SELECT ec.certificateType, ec.status, COUNT(ec) FROM EmployeeCertificate ec " +
            "JOIN Employee e ON ec.employeeId = e.id " +
            "WHERE ec.deleted = false AND e.deleted = false AND e.organizationId = :orgId " +
            "GROUP BY ec.certificateType, ec.status")
    List<Object[]> countByTypeAndStatusForOrg(@Param("orgId") UUID orgId);

    @Query("SELECT ec FROM EmployeeCertificate ec " +
            "JOIN Employee e ON ec.employeeId = e.id " +
            "WHERE ec.deleted = false AND e.deleted = false AND e.organizationId = :orgId " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate BETWEEN CURRENT_DATE AND :deadline " +
            "ORDER BY ec.expiryDate ASC")
    List<EmployeeCertificate> findExpiringByOrg(@Param("orgId") UUID orgId, @Param("deadline") LocalDate deadline);

    @Query("SELECT ec FROM EmployeeCertificate ec " +
            "JOIN Employee e ON ec.employeeId = e.id " +
            "WHERE ec.deleted = false AND e.deleted = false AND e.organizationId = :orgId " +
            "AND ec.expiryDate IS NOT NULL AND ec.expiryDate < CURRENT_DATE " +
            "ORDER BY ec.expiryDate ASC")
    List<EmployeeCertificate> findExpiredByOrg(@Param("orgId") UUID orgId);

    @Query("SELECT ec FROM EmployeeCertificate ec " +
            "JOIN Employee e ON ec.employeeId = e.id " +
            "WHERE ec.deleted = false AND e.deleted = false AND e.organizationId = :orgId " +
            "ORDER BY ec.expiryDate ASC NULLS LAST")
    List<EmployeeCertificate> findAllByOrgOrderByExpiry(@Param("orgId") UUID orgId);
}
