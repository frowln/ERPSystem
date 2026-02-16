package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.IntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, UUID> {

    Optional<IntegrationConfig> findByCodeAndDeletedFalse(String code);

    List<IntegrationConfig> findByDeletedFalseOrderByNameAsc();

    List<IntegrationConfig> findByIsActiveTrueAndDeletedFalse();

    boolean existsByCodeAndDeletedFalse(String code);
}
