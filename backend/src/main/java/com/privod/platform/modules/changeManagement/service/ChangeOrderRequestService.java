package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRequestRepository;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequestRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequestRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChangeOrderRequestService {

    private final ChangeOrderRequestRepository changeOrderRequestRepository;
    private final ChangeEventService changeEventService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ChangeOrderRequestResponse> listByProject(UUID projectId, Pageable pageable) {
        return changeOrderRequestRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ChangeOrderRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ChangeOrderRequestResponse> listByChangeEvent(UUID changeEventId, Pageable pageable) {
        return changeOrderRequestRepository.findByChangeEventIdAndDeletedFalse(changeEventId, pageable)
                .map(ChangeOrderRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ChangeOrderRequestResponse getChangeOrderRequest(UUID id) {
        ChangeOrderRequest cor = getChangeOrderRequestOrThrow(id);
        return ChangeOrderRequestResponse.fromEntity(cor);
    }

    @Transactional
    public ChangeOrderRequestResponse createChangeOrderRequest(CreateChangeOrderRequestRequest request) {
        // Validate change event exists and is in correct status for pricing
        ChangeEvent event = changeEventService.getChangeEventOrThrow(request.changeEventId());

        if (event.getStatus() != ChangeEventStatus.APPROVED_FOR_PRICING
                && event.getStatus() != ChangeEventStatus.UNDER_REVIEW) {
            throw new IllegalStateException(
                    "Создать запрос на изменение можно только для события в статусе 'На рассмотрении' или 'Утверждён для расценки'");
        }

        String number = generateRequestNumber();

        ChangeOrderRequest cor = ChangeOrderRequest.builder()
                .changeEventId(request.changeEventId())
                .projectId(request.projectId())
                .number(number)
                .title(request.title())
                .description(request.description())
                .status(ChangeOrderRequestStatus.DRAFT)
                .requestedById(request.requestedById())
                .requestedDate(request.requestedDate() != null ? request.requestedDate() : LocalDate.now())
                .proposedCost(request.proposedCost())
                .proposedScheduleChange(request.proposedScheduleChange())
                .justification(request.justification())
                .attachmentIds(request.attachmentIds())
                .build();

        cor = changeOrderRequestRepository.save(cor);
        auditService.logCreate("ChangeOrderRequest", cor.getId());

        log.info("Запрос на изменение создан: {} - {} ({})", cor.getNumber(), cor.getTitle(), cor.getId());
        return ChangeOrderRequestResponse.fromEntity(cor);
    }

    @Transactional
    public ChangeOrderRequestResponse updateChangeOrderRequest(UUID id, UpdateChangeOrderRequestRequest request) {
        ChangeOrderRequest cor = getChangeOrderRequestOrThrow(id);

        if (cor.getStatus() != ChangeOrderRequestStatus.DRAFT
                && cor.getStatus() != ChangeOrderRequestStatus.REVISED) {
            throw new IllegalStateException(
                    "Редактирование запроса возможно только в статусе Черновик или Пересмотрен");
        }

        if (request.title() != null) {
            cor.setTitle(request.title());
        }
        if (request.description() != null) {
            cor.setDescription(request.description());
        }
        if (request.proposedCost() != null) {
            cor.setProposedCost(request.proposedCost());
        }
        if (request.proposedScheduleChange() != null) {
            cor.setProposedScheduleChange(request.proposedScheduleChange());
        }
        if (request.justification() != null) {
            cor.setJustification(request.justification());
        }
        if (request.attachmentIds() != null) {
            cor.setAttachmentIds(request.attachmentIds());
        }

        cor = changeOrderRequestRepository.save(cor);
        auditService.logUpdate("ChangeOrderRequest", cor.getId(), "multiple", null, null);

        log.info("Запрос на изменение обновлён: {} ({})", cor.getNumber(), cor.getId());
        return ChangeOrderRequestResponse.fromEntity(cor);
    }

    @Transactional
    public ChangeOrderRequestResponse changeStatus(UUID id, ChangeOrderRequestStatusRequest request) {
        ChangeOrderRequest cor = getChangeOrderRequestOrThrow(id);
        ChangeOrderRequestStatus oldStatus = cor.getStatus();
        ChangeOrderRequestStatus newStatus = request.status();

        if (!cor.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести запрос на изменение из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        cor.setStatus(newStatus);

        if (newStatus == ChangeOrderRequestStatus.APPROVED || newStatus == ChangeOrderRequestStatus.REJECTED) {
            cor.setReviewedById(request.reviewedById());
            cor.setReviewedDate(LocalDate.now());
            cor.setReviewComments(request.reviewComments());
        }

        cor = changeOrderRequestRepository.save(cor);
        auditService.logStatusChange("ChangeOrderRequest", cor.getId(), oldStatus.name(), newStatus.name());

        log.info("Статус запроса на изменение изменён: {} с {} на {} ({})",
                cor.getNumber(), oldStatus, newStatus, cor.getId());
        return ChangeOrderRequestResponse.fromEntity(cor);
    }

    @Transactional
    public void deleteChangeOrderRequest(UUID id) {
        ChangeOrderRequest cor = getChangeOrderRequestOrThrow(id);
        cor.softDelete();
        changeOrderRequestRepository.save(cor);
        auditService.logDelete("ChangeOrderRequest", cor.getId());

        log.info("Запрос на изменение удалён: {} ({})", cor.getNumber(), cor.getId());
    }

    ChangeOrderRequest getChangeOrderRequestOrThrow(UUID id) {
        return changeOrderRequestRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запрос на изменение не найден: " + id));
    }

    private String generateRequestNumber() {
        long seq = changeOrderRequestRepository.getNextNumberSequence();
        return String.format("COR-%05d", seq);
    }
}
