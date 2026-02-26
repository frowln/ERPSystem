package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.repository.ChangeEventRepository;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventFromRfiRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeEventRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChangeEventService {

    private final ChangeEventRepository changeEventRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ChangeEventResponse> listChangeEvents(String search, ChangeEventStatus status,
                                                       ChangeEventSource source, UUID projectId,
                                                       Pageable pageable) {
        Specification<ChangeEvent> spec = Specification.where(ChangeEventSpecification.notDeleted())
                .and(ChangeEventSpecification.hasStatus(status))
                .and(ChangeEventSpecification.hasSource(source))
                .and(ChangeEventSpecification.belongsToProject(projectId))
                .and(ChangeEventSpecification.searchByTitleOrNumber(search));

        return changeEventRepository.findAll(spec, pageable).map(ChangeEventResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ChangeEventResponse getChangeEvent(UUID id) {
        ChangeEvent event = getChangeEventOrThrow(id);
        return ChangeEventResponse.fromEntity(event);
    }

    @Transactional
    public ChangeEventResponse createChangeEvent(CreateChangeEventRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateEventNumber();

        ChangeEvent event = ChangeEvent.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .number(number)
                .title(request.title())
                .description(request.description())
                .source(request.source())
                .status(ChangeEventStatus.IDENTIFIED)
                .identifiedById(request.identifiedById())
                .identifiedDate(request.identifiedDate())
                .estimatedCostImpact(request.estimatedCostImpact())
                .estimatedScheduleImpact(request.estimatedScheduleImpact())
                .linkedRfiId(request.linkedRfiId())
                .linkedIssueId(request.linkedIssueId())
                .contractId(request.contractId())
                .tags(request.tags())
                .build();

        event = changeEventRepository.save(event);
        auditService.logCreate("ChangeEvent", event.getId());

        log.info("Событие изменения создано: {} - {} ({})", event.getNumber(), event.getTitle(), event.getId());
        return ChangeEventResponse.fromEntity(event);
    }

    @Transactional
    public ChangeEventResponse createFromRfi(CreateChangeEventFromRfiRequest request) {
        String number = generateEventNumber();

        String title = request.title() != null ? request.title()
                : "Событие изменения по RFI";

        ChangeEvent event = ChangeEvent.builder()
                .projectId(request.projectId())
                .number(number)
                .title(title)
                .description(request.description())
                .source(ChangeEventSource.RFI)
                .status(ChangeEventStatus.IDENTIFIED)
                .identifiedById(request.identifiedById())
                .identifiedDate(request.identifiedDate())
                .estimatedCostImpact(request.estimatedCostImpact())
                .estimatedScheduleImpact(request.estimatedScheduleImpact())
                .linkedRfiId(request.rfiId())
                .contractId(request.contractId())
                .build();

        event = changeEventRepository.save(event);
        auditService.logCreate("ChangeEvent", event.getId());

        log.info("Событие изменения создано из RFI {}: {} ({})", request.rfiId(), event.getNumber(), event.getId());
        return ChangeEventResponse.fromEntity(event);
    }

    @Transactional
    public ChangeEventResponse updateChangeEvent(UUID id, UpdateChangeEventRequest request) {
        ChangeEvent event = getChangeEventOrThrow(id);

        if (event.getStatus() == ChangeEventStatus.APPROVED
                || event.getStatus() == ChangeEventStatus.REJECTED
                || event.getStatus() == ChangeEventStatus.VOID) {
            throw new IllegalStateException(
                    "Редактирование события изменения невозможно в статусе " + event.getStatus().getDisplayName());
        }

        if (request.title() != null) {
            event.setTitle(request.title());
        }
        if (request.description() != null) {
            event.setDescription(request.description());
        }
        if (request.source() != null) {
            event.setSource(request.source());
        }
        if (request.estimatedCostImpact() != null) {
            event.setEstimatedCostImpact(request.estimatedCostImpact());
        }
        if (request.estimatedScheduleImpact() != null) {
            event.setEstimatedScheduleImpact(request.estimatedScheduleImpact());
        }
        if (request.actualCostImpact() != null) {
            event.setActualCostImpact(request.actualCostImpact());
        }
        if (request.actualScheduleImpact() != null) {
            event.setActualScheduleImpact(request.actualScheduleImpact());
        }
        if (request.linkedRfiId() != null) {
            event.setLinkedRfiId(request.linkedRfiId());
        }
        if (request.linkedIssueId() != null) {
            event.setLinkedIssueId(request.linkedIssueId());
        }
        if (request.contractId() != null) {
            event.setContractId(request.contractId());
        }
        if (request.tags() != null) {
            event.setTags(request.tags());
        }

        event = changeEventRepository.save(event);
        auditService.logUpdate("ChangeEvent", event.getId(), "multiple", null, null);

        log.info("Событие изменения обновлено: {} ({})", event.getNumber(), event.getId());
        return ChangeEventResponse.fromEntity(event);
    }

    @Transactional
    public ChangeEventResponse changeStatus(UUID id, ChangeEventStatusRequest request) {
        ChangeEvent event = getChangeEventOrThrow(id);
        ChangeEventStatus oldStatus = event.getStatus();
        ChangeEventStatus newStatus = request.status();

        if (!event.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести событие изменения из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        event.setStatus(newStatus);
        event = changeEventRepository.save(event);
        auditService.logStatusChange("ChangeEvent", event.getId(), oldStatus.name(), newStatus.name());

        log.info("Статус события изменения изменён: {} с {} на {} ({})",
                event.getNumber(), oldStatus, newStatus, event.getId());
        return ChangeEventResponse.fromEntity(event);
    }

    @Transactional
    public void deleteChangeEvent(UUID id) {
        ChangeEvent event = getChangeEventOrThrow(id);
        event.softDelete();
        changeEventRepository.save(event);
        auditService.logDelete("ChangeEvent", event.getId());

        log.info("Событие изменения удалено: {} ({})", event.getNumber(), event.getId());
    }

    ChangeEvent getChangeEventOrThrow(UUID id) {
        return changeEventRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Событие изменения не найдено: " + id));
    }

    private String generateEventNumber() {
        long seq = changeEventRepository.getNextNumberSequence();
        return String.format("CE-%05d", seq);
    }
}
