package com.privod.platform.modules.integration.govregistries.repository;

import com.privod.platform.modules.integration.govregistries.domain.RegistryConfig;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegistryConfigRepository extends JpaRepository<RegistryConfig, UUID> {

    List<RegistryConfig> findByDeletedFalse();

    Optional<RegistryConfig> findByRegistryTypeAndDeletedFalse(RegistryType registryType);

    List<RegistryConfig> findByEnabledAndDeletedFalse(boolean enabled);

    boolean existsByRegistryTypeAndDeletedFalse(RegistryType registryType);
}
