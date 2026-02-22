package com.privod.platform.modules.compliance.repository;

import com.privod.platform.modules.compliance.domain.PrivacyPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrivacyPolicyRepository extends JpaRepository<PrivacyPolicy, UUID> {

    Optional<PrivacyPolicy> findByOrganizationIdAndIsCurrentTrueAndDeletedFalse(UUID organizationId);

    Page<PrivacyPolicy> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Modifying
    @Query("UPDATE PrivacyPolicy pp SET pp.isCurrent = false WHERE pp.organizationId = :orgId " +
            "AND pp.isCurrent = true AND pp.deleted = false")
    void deactivateCurrentPolicies(@Param("orgId") UUID organizationId);
}
