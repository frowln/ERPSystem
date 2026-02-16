package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.Commitment;
import com.privod.platform.modules.costManagement.domain.CommitmentItem;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.repository.CommitmentItemRepository;
import com.privod.platform.modules.costManagement.repository.CommitmentRepository;
import com.privod.platform.modules.costManagement.web.dto.ChangeCommitmentStatusRequest;
import com.privod.platform.modules.costManagement.web.dto.CommitmentItemResponse;
import com.privod.platform.modules.costManagement.web.dto.CommitmentResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentItemRequest;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCommitmentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommitmentService {

    private final CommitmentRepository commitmentRepository;
    private final CommitmentItemRepository commitmentItemRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CommitmentResponse> listByProject(UUID projectId, CommitmentStatus status, Pageable pageable) {
        if (projectId != null && status != null) {
            return commitmentRepository.findByProjectIdAndStatusAndDeletedFalse(projectId, status)
                    .stream()
                    .map(CommitmentResponse::fromEntity)
                    .collect(java.util.stream.Collectors.collectingAndThen(
                            java.util.stream.Collectors.toList(),
                            list -> new org.springframework.data.domain.PageImpl<>(list, pageable, list.size())));
        }
        if (projectId != null) {
            return commitmentRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(CommitmentResponse::fromEntity);
        }
        if (status != null) {
            return commitmentRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(CommitmentResponse::fromEntity);
        }
        return commitmentRepository.findByDeletedFalse(pageable)
                .map(CommitmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CommitmentResponse getById(UUID id) {
        Commitment commitment = getCommitmentOrThrow(id);
        return CommitmentResponse.fromEntity(commitment);
    }

    @Transactional
    public CommitmentResponse create(CreateCommitmentRequest request) {
        validateDates(request.startDate(), request.endDate());

        String number = generateCommitmentNumber();

        Commitment commitment = Commitment.builder()
                .projectId(request.projectId())
                .number(number)
                .title(request.title())
                .commitmentType(request.commitmentType())
                .status(CommitmentStatus.DRAFT)
                .vendorId(request.vendorId())
                .contractId(request.contractId())
                .originalAmount(request.originalAmount())
                .retentionPercent(request.retentionPercent() != null ? request.retentionPercent() : BigDecimal.ZERO)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .costCodeId(request.costCodeId())
                .build();

        commitment.recalculateRevisedAmount();
        commitment = commitmentRepository.save(commitment);
        auditService.logCreate("Commitment", commitment.getId());

        log.info("Commitment created: {} - {} ({})", commitment.getNumber(), commitment.getTitle(), commitment.getId());
        return CommitmentResponse.fromEntity(commitment);
    }

    @Transactional
    public CommitmentResponse update(UUID id, UpdateCommitmentRequest request) {
        Commitment commitment = getCommitmentOrThrow(id);

        if (commitment.getStatus() != CommitmentStatus.DRAFT) {
            throw new IllegalStateException(
                    "Редактирование обязательства возможно только в статусе Черновик");
        }

        if (request.title() != null) {
            commitment.setTitle(request.title());
        }
        if (request.commitmentType() != null) {
            commitment.setCommitmentType(request.commitmentType());
        }
        if (request.vendorId() != null) {
            commitment.setVendorId(request.vendorId());
        }
        if (request.contractId() != null) {
            commitment.setContractId(request.contractId());
        }
        if (request.originalAmount() != null) {
            commitment.setOriginalAmount(request.originalAmount());
        }
        if (request.approvedChangeOrders() != null) {
            commitment.setApprovedChangeOrders(request.approvedChangeOrders());
        }
        if (request.retentionPercent() != null) {
            commitment.setRetentionPercent(request.retentionPercent());
        }
        if (request.startDate() != null) {
            commitment.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            commitment.setEndDate(request.endDate());
        }
        if (request.costCodeId() != null) {
            commitment.setCostCodeId(request.costCodeId());
        }

        validateDates(commitment.getStartDate(), commitment.getEndDate());
        commitment.recalculateRevisedAmount();

        commitment = commitmentRepository.save(commitment);
        auditService.logUpdate("Commitment", commitment.getId(), "multiple", null, null);

        log.info("Commitment updated: {} ({})", commitment.getNumber(), commitment.getId());
        return CommitmentResponse.fromEntity(commitment);
    }

    @Transactional
    public CommitmentResponse changeStatus(UUID id, ChangeCommitmentStatusRequest request) {
        Commitment commitment = getCommitmentOrThrow(id);
        CommitmentStatus oldStatus = commitment.getStatus();
        CommitmentStatus newStatus = request.status();

        if (!commitment.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести обязательство из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        commitment.setStatus(newStatus);
        commitment = commitmentRepository.save(commitment);
        auditService.logStatusChange("Commitment", commitment.getId(), oldStatus.name(), newStatus.name());

        log.info("Commitment status changed: {} from {} to {} ({})",
                commitment.getNumber(), oldStatus, newStatus, commitment.getId());
        return CommitmentResponse.fromEntity(commitment);
    }

    @Transactional
    public CommitmentResponse addChangeOrder(UUID id, BigDecimal changeOrderAmount) {
        Commitment commitment = getCommitmentOrThrow(id);

        if (commitment.getStatus() == CommitmentStatus.VOID || commitment.getStatus() == CommitmentStatus.CLOSED) {
            throw new IllegalStateException(
                    "Невозможно добавить изменение к обязательству в статусе " + commitment.getStatus().getDisplayName());
        }

        BigDecimal currentChanges = commitment.getApprovedChangeOrders() != null
                ? commitment.getApprovedChangeOrders() : BigDecimal.ZERO;
        commitment.setApprovedChangeOrders(currentChanges.add(changeOrderAmount));
        commitment.recalculateRevisedAmount();

        commitment = commitmentRepository.save(commitment);
        auditService.logUpdate("Commitment", commitment.getId(), "approvedChangeOrders",
                currentChanges.toPlainString(), commitment.getApprovedChangeOrders().toPlainString());

        log.info("Change order added to commitment {}: {} ({})",
                commitment.getNumber(), changeOrderAmount, commitment.getId());
        return CommitmentResponse.fromEntity(commitment);
    }

    // --- Commitment Items ---

    @Transactional(readOnly = true)
    public List<CommitmentItemResponse> listItems(UUID commitmentId) {
        getCommitmentOrThrow(commitmentId);
        return commitmentItemRepository.findByCommitmentIdAndDeletedFalseOrderBySortOrderAsc(commitmentId)
                .stream()
                .map(CommitmentItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CommitmentItemResponse addItem(UUID commitmentId, CreateCommitmentItemRequest request) {
        getCommitmentOrThrow(commitmentId);

        CommitmentItem item = CommitmentItem.builder()
                .commitmentId(commitmentId)
                .description(request.description())
                .costCodeId(request.costCodeId())
                .quantity(request.quantity())
                .unit(request.unit())
                .unitPrice(request.unitPrice())
                .sortOrder(request.sortOrder())
                .build();

        item.recalculateTotalPrice();
        item = commitmentItemRepository.save(item);

        log.info("Commitment item added: {} to commitment {}", item.getDescription(), commitmentId);
        return CommitmentItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        CommitmentItem item = commitmentItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция обязательства не найдена: " + itemId));
        item.softDelete();
        commitmentItemRepository.save(item);

        log.info("Commitment item deleted: {}", itemId);
    }

    @Transactional
    public void delete(UUID id) {
        Commitment commitment = getCommitmentOrThrow(id);
        commitment.softDelete();
        commitmentRepository.save(commitment);
        auditService.logDelete("Commitment", id);

        log.info("Commitment deleted: {} ({})", commitment.getNumber(), id);
    }

    private Commitment getCommitmentOrThrow(UUID id) {
        return commitmentRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Обязательство не найдено: " + id));
    }

    private String generateCommitmentNumber() {
        long seq = commitmentRepository.getNextNumberSequence();
        return String.format("CMT-%05d", seq);
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }
}
