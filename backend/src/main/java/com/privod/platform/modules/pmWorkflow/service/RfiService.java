package com.privod.platform.modules.pmWorkflow.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.pmWorkflow.domain.Rfi;
import com.privod.platform.modules.pmWorkflow.domain.RfiResponse;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import com.privod.platform.modules.pmWorkflow.repository.RfiRepository;
import com.privod.platform.modules.pmWorkflow.repository.RfiResponseRepository;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeRfiStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiResponseRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseEntryDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateRfiRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RfiService {

    private final RfiRepository rfiRepository;
    private final RfiResponseRepository rfiResponseRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RfiResponseDto> listRfis(UUID projectId, RfiStatus status, Pageable pageable) {
        Specification<Rfi> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return rfiRepository.findAll(spec, pageable).map(RfiResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public RfiResponseDto getRfi(UUID id) {
        Rfi rfi = getRfiOrThrow(id);
        return RfiResponseDto.fromEntity(rfi);
    }

    @Transactional
    public RfiResponseDto createRfi(CreateRfiRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateRfiNumber(request.projectId());

        Rfi rfi = Rfi.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .number(number)
                .subject(request.subject())
                .question(request.question())
                .status(RfiStatus.DRAFT)
                .priority(request.priority() != null ? request.priority() : com.privod.platform.modules.pmWorkflow.domain.RfiPriority.NORMAL)
                .assignedToId(request.assignedToId())
                .responsibleId(request.responsibleId())
                .dueDate(request.dueDate())
                .costImpact(request.costImpact() != null ? request.costImpact() : false)
                .scheduleImpact(request.scheduleImpact() != null ? request.scheduleImpact() : false)
                .relatedDrawingId(request.relatedDrawingId())
                .relatedSpecSection(request.relatedSpecSection())
                .distributionList(request.distributionList())
                .linkedDocumentIds(request.linkedDocumentIds())
                .tags(request.tags())
                .build();

        rfi = rfiRepository.save(rfi);
        auditService.logCreate("Rfi", rfi.getId());

        log.info("RFI создан: {} ({}) для проекта {}", rfi.getSubject(), rfi.getNumber(), request.projectId());
        return RfiResponseDto.fromEntity(rfi);
    }

    @Transactional
    public RfiResponseDto updateRfi(UUID id, UpdateRfiRequest request) {
        Rfi rfi = getRfiOrThrow(id);

        if (request.subject() != null) {
            rfi.setSubject(request.subject());
        }
        if (request.question() != null) {
            rfi.setQuestion(request.question());
        }
        if (request.answer() != null) {
            rfi.setAnswer(request.answer());
        }
        if (request.priority() != null) {
            rfi.setPriority(request.priority());
        }
        if (request.assignedToId() != null) {
            rfi.setAssignedToId(request.assignedToId());
        }
        if (request.responsibleId() != null) {
            rfi.setResponsibleId(request.responsibleId());
        }
        if (request.dueDate() != null) {
            rfi.setDueDate(request.dueDate());
        }
        if (request.costImpact() != null) {
            rfi.setCostImpact(request.costImpact());
        }
        if (request.scheduleImpact() != null) {
            rfi.setScheduleImpact(request.scheduleImpact());
        }
        if (request.relatedDrawingId() != null) {
            rfi.setRelatedDrawingId(request.relatedDrawingId());
        }
        if (request.relatedSpecSection() != null) {
            rfi.setRelatedSpecSection(request.relatedSpecSection());
        }
        if (request.distributionList() != null) {
            rfi.setDistributionList(request.distributionList());
        }
        if (request.linkedDocumentIds() != null) {
            rfi.setLinkedDocumentIds(request.linkedDocumentIds());
        }
        if (request.tags() != null) {
            rfi.setTags(request.tags());
        }

        rfi = rfiRepository.save(rfi);
        auditService.logUpdate("Rfi", rfi.getId(), "multiple", null, null);

        log.info("RFI обновлён: {} ({})", rfi.getSubject(), rfi.getId());
        return RfiResponseDto.fromEntity(rfi);
    }

    @Transactional
    public RfiResponseDto changeStatus(UUID id, ChangeRfiStatusRequest request) {
        Rfi rfi = getRfiOrThrow(id);
        RfiStatus oldStatus = rfi.getStatus();
        RfiStatus newStatus = request.status();

        if (!rfi.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести RFI из статуса '%s' в '%s'",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        rfi.setStatus(newStatus);

        if (newStatus == RfiStatus.ANSWERED) {
            rfi.setAnsweredDate(LocalDate.now());
        }

        rfi = rfiRepository.save(rfi);
        auditService.logStatusChange("Rfi", rfi.getId(), oldStatus.name(), newStatus.name());

        log.info("RFI статус изменён: {} с {} на {} ({})",
                rfi.getSubject(), oldStatus, newStatus, rfi.getId());
        return RfiResponseDto.fromEntity(rfi);
    }

    @Transactional
    public void deleteRfi(UUID id) {
        Rfi rfi = getRfiOrThrow(id);
        rfi.softDelete();
        rfiRepository.save(rfi);
        auditService.logDelete("Rfi", id);
        log.info("RFI удалён: {} ({})", rfi.getSubject(), id);
    }

    @Transactional
    public RfiResponseEntryDto addResponse(CreateRfiResponseRequest request) {
        getRfiOrThrow(request.rfiId());

        RfiResponse response = RfiResponse.builder()
                .rfiId(request.rfiId())
                .responderId(request.responderId())
                .responseText(request.responseText())
                .attachmentIds(request.attachmentIds())
                .isOfficial(request.isOfficial() != null ? request.isOfficial() : false)
                .respondedAt(Instant.now())
                .build();

        response = rfiResponseRepository.save(response);
        auditService.logCreate("RfiResponse", response.getId());

        log.info("Ответ на RFI добавлен: RFI={}, responder={}", request.rfiId(), request.responderId());
        return RfiResponseEntryDto.fromEntity(response);
    }

    @Transactional(readOnly = true)
    public Page<RfiResponseEntryDto> listResponses(UUID rfiId, Pageable pageable) {
        return rfiResponseRepository.findByRfiIdAndDeletedFalse(rfiId, pageable)
                .map(RfiResponseEntryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<RfiResponseDto> findOverdueRfis(UUID projectId) {
        List<Rfi> overdue;
        if (projectId != null) {
            overdue = rfiRepository.findOverdueRfisByProject(projectId, LocalDate.now());
        } else {
            overdue = rfiRepository.findOverdueRfis(LocalDate.now());
        }
        return overdue.stream().map(RfiResponseDto::fromEntity).toList();
    }

    private Rfi getRfiOrThrow(UUID id) {
        return rfiRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("RFI не найден: " + id));
    }

    private String generateRfiNumber(UUID projectId) {
        String prefix = "RFI-";
        Integer maxNum = rfiRepository.findMaxNumberByProject(projectId, prefix);
        int next = (maxNum != null ? maxNum : 0) + 1;
        return prefix + String.format("%05d", next);
    }
}
