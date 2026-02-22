package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.ConnectorInstallation;
import com.privod.platform.modules.apiManagement.domain.ConnectorInstallationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectorInstallationRepository extends JpaRepository<ConnectorInstallation, UUID> {

    List<ConnectorInstallation> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<ConnectorInstallation> findByOrganizationIdAndConnectorIdAndDeletedFalse(UUID organizationId, UUID connectorId);

    List<ConnectorInstallation> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ConnectorInstallationStatus status);

    boolean existsByOrganizationIdAndConnectorIdAndDeletedFalse(UUID organizationId, UUID connectorId);
}
