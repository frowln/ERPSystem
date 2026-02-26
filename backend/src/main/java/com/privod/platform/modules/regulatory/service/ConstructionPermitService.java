package com.privod.platform.modules.regulatory.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.regulatory.domain.ConstructionPermit;
import com.privod.platform.modules.regulatory.domain.PermitStatus;
import com.privod.platform.modules.regulatory.repository.ConstructionPermitRepository;
import com.privod.platform.modules.regulatory.web.dto.ConstructionPermitResponse;
import com.privod.platform.modules.regulatory.web.dto.CreateConstructionPermitRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConstructionPermitService {

    private final ConstructionPermitRepository permitRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ConstructionPermitResponse> listPermits(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return permitRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(ConstructionPermitResponse::fromEntity);
        }
        List<UUID> projectIds = getOrganizationProjectIds(organizationId);
        if (projectIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return permitRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable)
                .map(ConstructionPermitResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ConstructionPermitResponse getPermit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ConstructionPermit permit = getPermitOrThrow(id, organizationId);
        return ConstructionPermitResponse.fromEntity(permit);
    }

    @Transactional
    public ConstructionPermitResponse createPermit(CreateConstructionPermitRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (request.projectId() == null) {
            throw new IllegalArgumentException("Проект обязателен для разрешения");
        }
        validateProjectTenant(request.projectId(), organizationId);

        ConstructionPermit permit = ConstructionPermit.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .permitNumber(request.permitNumber())
                .issuedBy(request.issuedBy())
                .issuedDate(request.issuedDate())
                .expiresDate(request.expiresDate())
                .status(PermitStatus.ACTIVE)
                .permitType(request.permitType())
                .conditions(request.conditions())
                .fileUrl(request.fileUrl())
                .build();

        permit = permitRepository.save(permit);
        auditService.logCreate("ConstructionPermit", permit.getId());

        log.info("Construction permit created: {} ({})", permit.getPermitNumber(), permit.getId());
        return ConstructionPermitResponse.fromEntity(permit);
    }

    @Transactional
    public ConstructionPermitResponse updatePermit(UUID id, CreateConstructionPermitRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ConstructionPermit permit = getPermitOrThrow(id, organizationId);

        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            permit.setProjectId(request.projectId());
        }
        if (request.permitNumber() != null) permit.setPermitNumber(request.permitNumber());
        if (request.issuedBy() != null) permit.setIssuedBy(request.issuedBy());
        if (request.issuedDate() != null) permit.setIssuedDate(request.issuedDate());
        if (request.expiresDate() != null) permit.setExpiresDate(request.expiresDate());
        if (request.permitType() != null) permit.setPermitType(request.permitType());
        if (request.conditions() != null) permit.setConditions(request.conditions());
        if (request.fileUrl() != null) permit.setFileUrl(request.fileUrl());

        permit = permitRepository.save(permit);
        auditService.logUpdate("ConstructionPermit", permit.getId(), "multiple", null, null);

        log.info("Construction permit updated: {} ({})", permit.getPermitNumber(), permit.getId());
        return ConstructionPermitResponse.fromEntity(permit);
    }

    @Transactional
    public void deletePermit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ConstructionPermit permit = getPermitOrThrow(id, organizationId);
        permit.softDelete();
        permitRepository.save(permit);
        auditService.logDelete("ConstructionPermit", id);
        log.info("Construction permit deleted: {} ({})", permit.getPermitNumber(), id);
    }

    @Transactional
    public ConstructionPermitResponse suspendPermit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ConstructionPermit permit = getPermitOrThrow(id, organizationId);

        if (permit.getStatus() != PermitStatus.ACTIVE) {
            throw new IllegalStateException(
                    String.format("Приостановить можно только действующее разрешение, текущий статус: %s",
                            permit.getStatus().getDisplayName()));
        }

        PermitStatus oldStatus = permit.getStatus();
        permit.setStatus(PermitStatus.SUSPENDED);

        permit = permitRepository.save(permit);
        auditService.logStatusChange("ConstructionPermit", permit.getId(),
                oldStatus.name(), PermitStatus.SUSPENDED.name());

        log.info("Construction permit suspended: {} ({})", permit.getPermitNumber(), permit.getId());
        return ConstructionPermitResponse.fromEntity(permit);
    }

    @Transactional
    public ConstructionPermitResponse revokePermit(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ConstructionPermit permit = getPermitOrThrow(id, organizationId);

        if (permit.getStatus() == PermitStatus.REVOKED) {
            throw new IllegalStateException("Разрешение уже отозвано");
        }

        PermitStatus oldStatus = permit.getStatus();
        permit.setStatus(PermitStatus.REVOKED);

        permit = permitRepository.save(permit);
        auditService.logStatusChange("ConstructionPermit", permit.getId(),
                oldStatus.name(), PermitStatus.REVOKED.name());

        log.info("Construction permit revoked: {} ({})", permit.getPermitNumber(), permit.getId());
        return ConstructionPermitResponse.fromEntity(permit);
    }

    private ConstructionPermit getPermitOrThrow(UUID id, UUID organizationId) {
        ConstructionPermit permit = permitRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Разрешение на строительство не найдено: " + id));
        validateProjectTenant(permit.getProjectId(), organizationId);
        return permit;
    }

    private List<UUID> getOrganizationProjectIds(UUID organizationId) {
        return projectRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            throw new EntityNotFoundException("Проект не найден: null");
        }
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }
}
