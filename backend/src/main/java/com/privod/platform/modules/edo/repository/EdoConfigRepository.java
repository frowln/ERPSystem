package com.privod.platform.modules.edo.repository;

import com.privod.platform.modules.edo.domain.EdoConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EdoConfigRepository extends JpaRepository<EdoConfig, UUID> {

    Optional<EdoConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<EdoConfig> findByIdAndDeletedFalse(UUID id);
}
