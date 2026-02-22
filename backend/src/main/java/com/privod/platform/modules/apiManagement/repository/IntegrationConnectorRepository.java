package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.ConnectorCategory;
import com.privod.platform.modules.apiManagement.domain.IntegrationConnector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationConnectorRepository extends JpaRepository<IntegrationConnector, UUID> {

    List<IntegrationConnector> findByCategoryAndIsActiveTrueAndDeletedFalse(ConnectorCategory category);

    List<IntegrationConnector> findByIsActiveTrueAndDeletedFalse();

    Optional<IntegrationConnector> findBySlugAndDeletedFalse(String slug);

    boolean existsBySlugAndDeletedFalse(String slug);
}
