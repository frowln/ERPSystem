package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyCertificate;
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
public interface SafetyCertificateRepository extends JpaRepository<SafetyCertificate, UUID>,
        JpaSpecificationExecutor<SafetyCertificate> {

    Page<SafetyCertificate> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    List<SafetyCertificate> findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(UUID employeeId);

    Page<SafetyCertificate> findByDeletedFalse(Pageable pageable);

    @Query("SELECT sc FROM SafetyCertificate sc WHERE sc.deleted = false " +
            "AND sc.expiryDate IS NOT NULL AND sc.expiryDate <= :date")
    List<SafetyCertificate> findExpiredBefore(@Param("date") LocalDate date);

    @Query("SELECT sc FROM SafetyCertificate sc WHERE sc.deleted = false " +
            "AND sc.expiryDate IS NOT NULL AND sc.expiryDate BETWEEN :from AND :to")
    List<SafetyCertificate> findExpiringSoon(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
