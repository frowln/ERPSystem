package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiModelConfig;
import com.privod.platform.modules.ai.domain.AiProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiModelConfigRepository extends JpaRepository<AiModelConfig, UUID> {

    Page<AiModelConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<AiModelConfig> findByOrganizationIdAndIsActiveTrueAndDeletedFalse(UUID organizationId);

    Optional<AiModelConfig> findByOrganizationIdAndIsDefaultTrueAndDeletedFalse(UUID organizationId);

    Optional<AiModelConfig> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<AiModelConfig> findByOrganizationIdAndProviderAndDeletedFalse(UUID organizationId, AiProvider provider);
}
