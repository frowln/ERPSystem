package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.apiManagement.domain.ConnectorCategory;
import com.privod.platform.modules.apiManagement.domain.ConnectorInstallation;
import com.privod.platform.modules.apiManagement.domain.ConnectorInstallationStatus;
import com.privod.platform.modules.apiManagement.domain.IntegrationConnector;
import com.privod.platform.modules.apiManagement.repository.ConnectorInstallationRepository;
import com.privod.platform.modules.apiManagement.repository.IntegrationConnectorRepository;
import com.privod.platform.modules.apiManagement.web.dto.ConnectorInstallationResponse;
import com.privod.platform.modules.apiManagement.web.dto.ConnectorResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationMarketplaceService {

    private final IntegrationConnectorRepository connectorRepository;
    private final ConnectorInstallationRepository installationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ConnectorResponse> listConnectors(ConnectorCategory category) {
        List<IntegrationConnector> connectors;
        if (category != null) {
            connectors = connectorRepository.findByCategoryAndIsActiveTrueAndDeletedFalse(category);
        } else {
            connectors = connectorRepository.findByIsActiveTrueAndDeletedFalse();
        }
        return connectors.stream()
                .map(ConnectorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConnectorResponse getConnector(String slug) {
        IntegrationConnector connector = connectorRepository.findBySlugAndDeletedFalse(slug)
                .orElseThrow(() -> new EntityNotFoundException("Коннектор не найден: " + slug));
        return ConnectorResponse.fromEntity(connector);
    }

    @Transactional
    public ConnectorInstallationResponse installConnector(UUID connectorId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        IntegrationConnector connector = connectorRepository.findById(connectorId)
                .filter(c -> !c.isDeleted() && c.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Коннектор не найден: " + connectorId));

        if (installationRepository.existsByOrganizationIdAndConnectorIdAndDeletedFalse(orgId, connectorId)) {
            throw new IllegalStateException("Коннектор уже установлен для вашей организации");
        }

        ConnectorInstallation installation = ConnectorInstallation.builder()
                .organizationId(orgId)
                .connectorId(connectorId)
                .status(ConnectorInstallationStatus.INSTALLED)
                .build();

        installation = installationRepository.save(installation);
        auditService.logCreate("ConnectorInstallation", installation.getId());

        log.info("Connector installed: {} for organization {} (installation: {})",
                connector.getSlug(), orgId, installation.getId());
        return ConnectorInstallationResponse.fromEntity(installation);
    }

    @Transactional
    public ConnectorInstallationResponse configureConnector(UUID installationId, String configJson) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ConnectorInstallation installation = getInstallationOrThrow(installationId, orgId);
        installation.setConfigJson(configJson);
        installation.setStatus(ConnectorInstallationStatus.CONFIGURED);
        installation.setErrorMessage(null);

        installation = installationRepository.save(installation);
        auditService.logUpdate("ConnectorInstallation", installation.getId(), "config", null, null);

        log.info("Connector configured: installation={}", installationId);
        return ConnectorInstallationResponse.fromEntity(installation);
    }

    @Transactional
    public void uninstallConnector(UUID installationId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ConnectorInstallation installation = getInstallationOrThrow(installationId, orgId);
        installation.softDelete();
        installationRepository.save(installation);
        auditService.logDelete("ConnectorInstallation", installationId);

        log.info("Connector uninstalled: installation={}", installationId);
    }

    @Transactional(readOnly = true)
    public List<ConnectorInstallationResponse> getInstalledConnectors() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        return installationRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .stream()
                .map(ConnectorInstallationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConnectorInstallationResponse getConnectorStatus(UUID installationId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ConnectorInstallation installation = getInstallationOrThrow(installationId, orgId);
        return ConnectorInstallationResponse.fromEntity(installation);
    }

    private ConnectorInstallation getInstallationOrThrow(UUID installationId, UUID orgId) {
        ConnectorInstallation installation = installationRepository.findById(installationId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Установка коннектора не найдена: " + installationId));

        if (!installation.getOrganizationId().equals(orgId)) {
            throw new EntityNotFoundException("Установка коннектора не найдена: " + installationId);
        }

        return installation;
    }
}
