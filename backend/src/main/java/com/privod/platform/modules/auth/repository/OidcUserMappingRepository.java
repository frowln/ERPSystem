package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.OidcUserMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OidcUserMappingRepository extends JpaRepository<OidcUserMapping, UUID> {

    Optional<OidcUserMapping> findByOidcProviderIdAndExternalUserIdAndDeletedFalse(
            UUID oidcProviderId, String externalUserId);

    List<OidcUserMapping> findByInternalUserIdAndDeletedFalse(UUID internalUserId);

    Optional<OidcUserMapping> findByOidcProviderIdAndInternalUserIdAndDeletedFalse(
            UUID oidcProviderId, UUID internalUserId);
}
