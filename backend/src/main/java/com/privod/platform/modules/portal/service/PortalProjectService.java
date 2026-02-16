package com.privod.platform.modules.portal.service;

import com.privod.platform.modules.portal.domain.PortalProject;
import com.privod.platform.modules.portal.repository.PortalDocumentRepository;
import com.privod.platform.modules.portal.repository.PortalProjectRepository;
import com.privod.platform.modules.portal.web.dto.GrantPortalProjectAccessRequest;
import com.privod.platform.modules.portal.web.dto.PortalDocumentResponse;
import com.privod.platform.modules.portal.web.dto.PortalProjectResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalProjectService {

    private final PortalProjectRepository portalProjectRepository;
    private final PortalDocumentRepository portalDocumentRepository;

    @Transactional(readOnly = true)
    public Page<PortalProjectResponse> getMyProjects(UUID portalUserId, Pageable pageable) {
        return portalProjectRepository.findByPortalUserIdAndDeletedFalse(portalUserId, pageable)
                .map(PortalProjectResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PortalProjectResponse getProjectDetails(UUID portalUserId, UUID projectId) {
        PortalProject pp = portalProjectRepository
                .findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Проект не найден или доступ не предоставлен: " + projectId));
        return PortalProjectResponse.fromEntity(pp);
    }

    @Transactional(readOnly = true)
    public List<PortalDocumentResponse> getProjectDocuments(UUID portalUserId, UUID projectId) {
        // Verify access
        portalProjectRepository
                .findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Проект не найден или доступ не предоставлен: " + projectId));

        return portalDocumentRepository.findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId)
                .stream()
                .map(PortalDocumentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PortalProjectResponse grantAccess(GrantPortalProjectAccessRequest request) {
        if (portalProjectRepository.existsByPortalUserIdAndProjectIdAndDeletedFalse(
                request.portalUserId(), request.projectId())) {
            // Update existing access
            PortalProject existing = portalProjectRepository
                    .findByPortalUserIdAndProjectIdAndDeletedFalse(request.portalUserId(), request.projectId())
                    .orElseThrow();

            existing.setAccessLevel(request.accessLevel());
            existing.setCanViewFinance(request.canViewFinance());
            existing.setCanViewDocuments(request.canViewDocuments());
            existing.setCanViewSchedule(request.canViewSchedule());
            existing.setCanViewPhotos(request.canViewPhotos());
            existing.setGrantedById(request.grantedById());
            existing.setGrantedAt(Instant.now());

            existing = portalProjectRepository.save(existing);
            log.info("Portal project access updated: user={}, project={}", request.portalUserId(), request.projectId());
            return PortalProjectResponse.fromEntity(existing);
        }

        PortalProject pp = PortalProject.builder()
                .portalUserId(request.portalUserId())
                .projectId(request.projectId())
                .accessLevel(request.accessLevel())
                .canViewFinance(request.canViewFinance())
                .canViewDocuments(request.canViewDocuments())
                .canViewSchedule(request.canViewSchedule())
                .canViewPhotos(request.canViewPhotos())
                .grantedById(request.grantedById())
                .grantedAt(Instant.now())
                .build();

        pp = portalProjectRepository.save(pp);
        log.info("Portal project access granted: user={}, project={}", request.portalUserId(), request.projectId());
        return PortalProjectResponse.fromEntity(pp);
    }

    @Transactional
    public void revokeAccess(UUID portalUserId, UUID projectId) {
        PortalProject pp = portalProjectRepository
                .findByPortalUserIdAndProjectIdAndDeletedFalse(portalUserId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Доступ к проекту не найден для пользователя: " + portalUserId));

        pp.softDelete();
        portalProjectRepository.save(pp);
        log.info("Portal project access revoked: user={}, project={}", portalUserId, projectId);
    }
}
