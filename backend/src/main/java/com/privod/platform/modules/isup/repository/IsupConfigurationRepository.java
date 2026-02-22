package com.privod.platform.modules.isup.repository;

import com.privod.platform.modules.isup.domain.IsupConfiguration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IsupConfigurationRepository extends JpaRepository<IsupConfiguration, UUID> {

    Page<IsupConfiguration> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Optional<IsupConfiguration> findByOrganizationIdAndIsActiveAndDeletedFalse(UUID organizationId, boolean isActive);

    List<IsupConfiguration> findByIsActiveAndDeletedFalse(boolean isActive);

    boolean existsByOrganizationIdAndDeletedFalse(UUID organizationId);
}
