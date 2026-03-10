package com.privod.platform.modules.insurance.repository;

import com.privod.platform.modules.insurance.domain.InsuranceCertificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InsuranceCertificateRepository extends JpaRepository<InsuranceCertificate, UUID> {

    Page<InsuranceCertificate> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    Optional<InsuranceCertificate> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID orgId);

    List<InsuranceCertificate> findByOrganizationIdAndVendorIdAndDeletedFalse(UUID orgId, UUID vendorId);

    @Query("SELECT c FROM InsuranceCertificate c WHERE c.organizationId = :orgId " +
           "AND c.deleted = false AND c.expiryDate IS NOT NULL " +
           "AND c.expiryDate BETWEEN :now AND :cutoff ORDER BY c.expiryDate ASC")
    List<InsuranceCertificate> findExpiring(
            @Param("orgId") UUID orgId,
            @Param("now") LocalDate now,
            @Param("cutoff") LocalDate cutoff);
}
