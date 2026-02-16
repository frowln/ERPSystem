package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.SbisConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SbisConfigRepository extends JpaRepository<SbisConfig, UUID> {

    Page<SbisConfig> findByDeletedFalse(Pageable pageable);

    List<SbisConfig> findByIsActiveAndDeletedFalse(boolean isActive);

    Optional<SbisConfig> findByOrganizationInnAndDeletedFalse(String organizationInn);

    boolean existsByNameAndDeletedFalse(String name);
}
