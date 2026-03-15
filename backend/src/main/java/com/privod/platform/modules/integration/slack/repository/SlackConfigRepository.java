package com.privod.platform.modules.integration.slack.repository;

import com.privod.platform.modules.integration.slack.domain.SlackConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SlackConfigRepository extends JpaRepository<SlackConfig, UUID> {

    Optional<SlackConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    boolean existsByOrganizationIdAndDeletedFalse(UUID organizationId);
}
