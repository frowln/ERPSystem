package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.quality.repository.QualityCheckRepository;
import com.privod.platform.modules.quality.web.dto.CreateQualityCheckRequest;
import com.privod.platform.modules.quality.web.dto.QualityCheckResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityCheckRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QualityCheckService {

    private final QualityCheckRepository qualityCheckRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<QualityCheckResponse> listChecks(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return qualityCheckRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(QualityCheckResponse::fromEntity);
        }
        return qualityCheckRepository.findByDeletedFalse(pageable)
                .map(QualityCheckResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public QualityCheckResponse getCheck(UUID id) {
        QualityCheck check = getCheckOrThrow(id);
        return QualityCheckResponse.fromEntity(check);
    }

    @Transactional
    public QualityCheckResponse createCheck(CreateQualityCheckRequest request) {
        String code = generateCode();

        QualityCheck check = QualityCheck.builder()
                .code(code)
                .projectId(request.projectId())
                .taskId(request.taskId())
                .specItemId(request.specItemId())
                .checkType(request.checkType())
                .name(request.name())
                .description(request.description())
                .plannedDate(request.plannedDate())
                .inspectorId(request.inspectorId())
                .inspectorName(request.inspectorName())
                .result(CheckResult.PENDING)
                .status(CheckStatus.PLANNED)
                .attachmentUrls(request.attachmentUrls() != null ? request.attachmentUrls() : new ArrayList<>())
                .build();

        check = qualityCheckRepository.save(check);
        auditService.logCreate("QualityCheck", check.getId());

        log.info("Quality check created: {} - {} ({})", check.getCode(), check.getName(), check.getId());
        return QualityCheckResponse.fromEntity(check);
    }

    @Transactional
    public QualityCheckResponse updateCheck(UUID id, UpdateQualityCheckRequest request) {
        QualityCheck check = getCheckOrThrow(id);

        if (request.taskId() != null) {
            check.setTaskId(request.taskId());
        }
        if (request.specItemId() != null) {
            check.setSpecItemId(request.specItemId());
        }
        if (request.checkType() != null) {
            check.setCheckType(request.checkType());
        }
        if (request.name() != null) {
            check.setName(request.name());
        }
        if (request.description() != null) {
            check.setDescription(request.description());
        }
        if (request.plannedDate() != null) {
            check.setPlannedDate(request.plannedDate());
        }
        if (request.actualDate() != null) {
            check.setActualDate(request.actualDate());
        }
        if (request.inspectorId() != null) {
            check.setInspectorId(request.inspectorId());
        }
        if (request.inspectorName() != null) {
            check.setInspectorName(request.inspectorName());
        }
        if (request.result() != null) {
            check.setResult(request.result());
        }
        if (request.status() != null) {
            check.setStatus(request.status());
        }
        if (request.findings() != null) {
            check.setFindings(request.findings());
        }
        if (request.recommendations() != null) {
            check.setRecommendations(request.recommendations());
        }
        if (request.attachmentUrls() != null) {
            check.setAttachmentUrls(request.attachmentUrls());
        }

        check = qualityCheckRepository.save(check);
        auditService.logUpdate("QualityCheck", check.getId(), "multiple", null, null);

        log.info("Quality check updated: {} ({})", check.getCode(), check.getId());
        return QualityCheckResponse.fromEntity(check);
    }

    @Transactional
    public QualityCheckResponse startCheck(UUID id) {
        QualityCheck check = getCheckOrThrow(id);

        if (check.getStatus() != CheckStatus.PLANNED) {
            throw new IllegalStateException(
                    String.format("Невозможно начать проверку из статуса '%s'",
                            check.getStatus().getDisplayName()));
        }

        CheckStatus oldStatus = check.getStatus();
        check.setStatus(CheckStatus.IN_PROGRESS);
        check.setActualDate(LocalDate.now());

        check = qualityCheckRepository.save(check);
        auditService.logStatusChange("QualityCheck", check.getId(),
                oldStatus.name(), CheckStatus.IN_PROGRESS.name());

        log.info("Quality check started: {} ({})", check.getCode(), check.getId());
        return QualityCheckResponse.fromEntity(check);
    }

    @Transactional
    public QualityCheckResponse completeCheck(UUID id, CheckResult result, String findings, String recommendations) {
        QualityCheck check = getCheckOrThrow(id);

        if (check.getStatus() != CheckStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    String.format("Невозможно завершить проверку из статуса '%s'",
                            check.getStatus().getDisplayName()));
        }

        CheckStatus oldStatus = check.getStatus();
        check.setStatus(CheckStatus.COMPLETED);
        check.setResult(result);
        if (findings != null) {
            check.setFindings(findings);
        }
        if (recommendations != null) {
            check.setRecommendations(recommendations);
        }

        check = qualityCheckRepository.save(check);
        auditService.logStatusChange("QualityCheck", check.getId(),
                oldStatus.name(), CheckStatus.COMPLETED.name());

        log.info("Quality check completed: {} with result {} ({})",
                check.getCode(), result, check.getId());
        return QualityCheckResponse.fromEntity(check);
    }

    @Transactional
    public void deleteCheck(UUID id) {
        QualityCheck check = getCheckOrThrow(id);
        check.softDelete();
        qualityCheckRepository.save(check);
        auditService.logDelete("QualityCheck", check.getId());

        log.info("Quality check deleted: {} ({})", check.getCode(), check.getId());
    }

    private QualityCheck getCheckOrThrow(UUID id) {
        return qualityCheckRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проверка качества не найдена: " + id));
    }

    private String generateCode() {
        long seq = qualityCheckRepository.getNextNumberSequence();
        return String.format("QC-%05d", seq);
    }
}
