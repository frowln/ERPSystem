package com.privod.platform.modules.integration.webdav.repository;

import com.privod.platform.modules.integration.webdav.domain.WebDavConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebDavConfigRepository extends JpaRepository<WebDavConfig, UUID> {

    Optional<WebDavConfig> findByEnabledTrueAndDeletedFalse();

    List<WebDavConfig> findByDeletedFalse();

    Optional<WebDavConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<WebDavConfig> findByOrganizationIdAndEnabledTrueAndDeletedFalse(UUID organizationId);

    boolean existsByServerUrlAndDeletedFalse(String serverUrl);
}
