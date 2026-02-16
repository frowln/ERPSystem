package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.DesignPackage;
import com.privod.platform.modules.bim.domain.DesignPackageStatus;
import com.privod.platform.modules.bim.repository.DesignPackageRepository;
import com.privod.platform.modules.bim.web.dto.CreateDesignPackageRequest;
import com.privod.platform.modules.bim.web.dto.DesignPackageResponse;
import com.privod.platform.modules.bim.web.dto.UpdateDesignPackageRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DesignPackageService {

    private final DesignPackageRepository designPackageRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DesignPackageResponse> listPackages(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return designPackageRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(DesignPackageResponse::fromEntity);
        }
        return designPackageRepository.findByDeletedFalse(pageable)
                .map(DesignPackageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DesignPackageResponse getPackage(UUID id) {
        DesignPackage pkg = getPackageOrThrow(id);
        return DesignPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public DesignPackageResponse createPackage(CreateDesignPackageRequest request) {
        long seq = designPackageRepository.getNextNumberSequence();
        String code = String.format("DP-%05d", seq);

        DesignPackage pkg = DesignPackage.builder()
                .projectId(request.projectId())
                .code(code)
                .name(request.name())
                .discipline(request.discipline())
                .status(DesignPackageStatus.DRAFT)
                .packageVersion(1)
                .build();

        pkg = designPackageRepository.save(pkg);
        auditService.logCreate("DesignPackage", pkg.getId());

        log.info("Design package created: {} - {} ({})", pkg.getCode(), pkg.getName(), pkg.getId());
        return DesignPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public DesignPackageResponse updatePackage(UUID id, UpdateDesignPackageRequest request) {
        DesignPackage pkg = getPackageOrThrow(id);

        if (request.name() != null) {
            pkg.setName(request.name());
        }
        if (request.discipline() != null) {
            pkg.setDiscipline(request.discipline());
        }
        if (request.status() != null) {
            pkg.setStatus(request.status());
        }
        if (request.approvedById() != null) {
            pkg.setApprovedById(request.approvedById());
        }

        pkg = designPackageRepository.save(pkg);
        auditService.logUpdate("DesignPackage", pkg.getId(), "multiple", null, null);

        log.info("Design package updated: {} ({})", pkg.getCode(), pkg.getId());
        return DesignPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public DesignPackageResponse submitForReview(UUID id) {
        DesignPackage pkg = getPackageOrThrow(id);

        if (pkg.getStatus() != DesignPackageStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Невозможно отправить на проверку из статуса '%s'",
                            pkg.getStatus().getDisplayName()));
        }

        DesignPackageStatus oldStatus = pkg.getStatus();
        pkg.setStatus(DesignPackageStatus.IN_REVIEW);

        pkg = designPackageRepository.save(pkg);
        auditService.logStatusChange("DesignPackage", pkg.getId(),
                oldStatus.name(), DesignPackageStatus.IN_REVIEW.name());

        log.info("Design package submitted for review: {} ({})", pkg.getCode(), pkg.getId());
        return DesignPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public DesignPackageResponse approvePackage(UUID id, UUID approvedById) {
        DesignPackage pkg = getPackageOrThrow(id);

        if (pkg.getStatus() != DesignPackageStatus.IN_REVIEW) {
            throw new IllegalStateException(
                    String.format("Утвердить можно только пакет на проверке, текущий статус: '%s'",
                            pkg.getStatus().getDisplayName()));
        }

        DesignPackageStatus oldStatus = pkg.getStatus();
        pkg.setStatus(DesignPackageStatus.APPROVED);
        pkg.setApprovedById(approvedById);
        pkg.setApprovedAt(Instant.now());

        pkg = designPackageRepository.save(pkg);
        auditService.logStatusChange("DesignPackage", pkg.getId(),
                oldStatus.name(), DesignPackageStatus.APPROVED.name());

        log.info("Design package approved: {} ({})", pkg.getCode(), pkg.getId());
        return DesignPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public void deletePackage(UUID id) {
        DesignPackage pkg = getPackageOrThrow(id);
        pkg.softDelete();
        designPackageRepository.save(pkg);
        auditService.logDelete("DesignPackage", pkg.getId());

        log.info("Design package deleted: {} ({})", pkg.getCode(), pkg.getId());
    }

    private DesignPackage getPackageOrThrow(UUID id) {
        return designPackageRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проектный пакет не найден: " + id));
    }
}
