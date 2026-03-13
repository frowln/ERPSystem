package com.privod.platform.modules.integration1c.repository;

import com.privod.platform.modules.integration1c.domain.Integration1cConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface Integration1cConfigRepository extends JpaRepository<Integration1cConfig, UUID> {

    Optional<Integration1cConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<Integration1cConfig> findByIdAndDeletedFalse(UUID id);
}
