package com.privod.platform.modules.compliance.repository;

import com.privod.platform.modules.compliance.domain.ConsentType;
import com.privod.platform.modules.compliance.domain.DataConsent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DataConsentRepository extends JpaRepository<DataConsent, UUID> {

    Page<DataConsent> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<DataConsent> findByOrganizationIdAndUserIdAndDeletedFalse(UUID organizationId, UUID userId);

    Optional<DataConsent> findByOrganizationIdAndUserIdAndConsentTypeAndIsActiveTrueAndDeletedFalse(
            UUID organizationId, UUID userId, ConsentType consentType);

    @Query("SELECT dc FROM DataConsent dc WHERE dc.organizationId = :orgId " +
            "AND dc.isActive = true AND dc.deleted = false")
    List<DataConsent> findActiveConsents(@Param("orgId") UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndIsActiveTrueAndDeletedFalse(UUID organizationId);

    @Query("SELECT dc FROM DataConsent dc WHERE dc.organizationId = :orgId " +
            "AND dc.userId = :userId AND dc.deleted = false")
    List<DataConsent> findByOrgAndUser(@Param("orgId") UUID organizationId, @Param("userId") UUID userId);
}
