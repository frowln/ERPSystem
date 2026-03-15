package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.SamlProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SamlProviderRepository extends JpaRepository<SamlProvider, UUID> {

    List<SamlProvider> findByOrganizationIdAndDeletedFalseOrderByNameAsc(UUID organizationId);

    Optional<SamlProvider> findByOrganizationIdAndCodeAndDeletedFalse(UUID organizationId, String code);

    Optional<SamlProvider> findByIdAndDeletedFalse(UUID id);

    List<SamlProvider> findByIsActiveAndDeletedFalse(boolean isActive);
}
