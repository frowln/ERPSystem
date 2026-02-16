package com.privod.platform.modules.cde.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.DocumentAuditEntry;
import com.privod.platform.modules.cde.domain.Transmittal;
import com.privod.platform.modules.cde.domain.TransmittalItem;
import com.privod.platform.modules.cde.domain.TransmittalStatus;
import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.repository.DocumentContainerRepository;
import com.privod.platform.modules.cde.repository.DocumentRevisionRepository;
import com.privod.platform.modules.cde.repository.TransmittalItemRepository;
import com.privod.platform.modules.cde.repository.TransmittalRepository;
import com.privod.platform.modules.cde.web.dto.AddTransmittalItemRequest;
import com.privod.platform.modules.cde.web.dto.CreateTransmittalRequest;
import com.privod.platform.modules.cde.web.dto.TransmittalItemResponse;
import com.privod.platform.modules.cde.web.dto.TransmittalResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransmittalService {

    private final TransmittalRepository transmittalRepository;
    private final TransmittalItemRepository transmittalItemRepository;
    private final DocumentContainerRepository documentContainerRepository;
    private final DocumentRevisionRepository documentRevisionRepository;
    private final DocumentAuditEntryRepository documentAuditEntryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TransmittalResponse> findByProject(UUID projectId, TransmittalStatus status, Pageable pageable) {
        if (projectId != null && status != null) {
            return transmittalRepository.findByProjectIdAndStatusAndDeletedFalse(projectId, status, pageable)
                    .map(TransmittalResponse::fromEntity);
        }
        if (projectId != null) {
            return transmittalRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(TransmittalResponse::fromEntity);
        }
        if (status != null) {
            return transmittalRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(TransmittalResponse::fromEntity);
        }
        return transmittalRepository.findByDeletedFalse(pageable)
                .map(TransmittalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TransmittalResponse findById(UUID id) {
        Transmittal transmittal = getTransmittalOrThrow(id);
        return TransmittalResponse.fromEntity(transmittal);
    }

    @Transactional
    public TransmittalResponse create(CreateTransmittalRequest request) {
        transmittalRepository.findByProjectIdAndTransmittalNumberAndDeletedFalse(
                request.projectId(), request.transmittalNumber()
        ).ifPresent(existing -> {
            throw new IllegalArgumentException(
                    "Трансмиттал с номером '" + request.transmittalNumber() + "' уже существует в проекте");
        });

        Transmittal transmittal = Transmittal.builder()
                .projectId(request.projectId())
                .transmittalNumber(request.transmittalNumber())
                .subject(request.subject())
                .purpose(request.purpose())
                .status(TransmittalStatus.DRAFT)
                .fromOrganizationId(request.fromOrganizationId())
                .toOrganizationId(request.toOrganizationId())
                .dueDate(request.dueDate())
                .coverNote(request.coverNote())
                .build();

        transmittal = transmittalRepository.save(transmittal);
        auditService.logCreate("Transmittal", transmittal.getId());

        log.info("Transmittal created: {} - {} ({})", transmittal.getTransmittalNumber(),
                transmittal.getSubject(), transmittal.getId());
        return TransmittalResponse.fromEntity(transmittal);
    }

    @Transactional
    public TransmittalItemResponse addItem(UUID transmittalId, AddTransmittalItemRequest request) {
        Transmittal transmittal = getTransmittalOrThrow(transmittalId);

        if (transmittal.getStatus() != TransmittalStatus.DRAFT) {
            throw new IllegalStateException(
                    "Добавление позиций возможно только для трансмиттала в статусе 'Черновик'");
        }

        // Validate document container exists
        documentContainerRepository.findById(request.documentContainerId())
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Контейнер документа не найден с id: " + request.documentContainerId()));

        // Validate revision exists
        documentRevisionRepository.findById(request.revisionId())
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Ревизия документа не найдена с id: " + request.revisionId()));

        TransmittalItem item = TransmittalItem.builder()
                .transmittalId(transmittalId)
                .documentContainerId(request.documentContainerId())
                .revisionId(request.revisionId())
                .notes(request.notes())
                .responseRequired(request.responseRequired() != null ? request.responseRequired() : false)
                .sortOrder(request.sortOrder())
                .build();

        item = transmittalItemRepository.save(item);
        auditService.logCreate("TransmittalItem", item.getId());

        log.info("TransmittalItem added to transmittal {}: doc={}, rev={}", transmittalId,
                request.documentContainerId(), request.revisionId());
        return TransmittalItemResponse.fromEntity(item);
    }

    @Transactional(readOnly = true)
    public List<TransmittalItemResponse> getItems(UUID transmittalId) {
        getTransmittalOrThrow(transmittalId);
        return transmittalItemRepository.findByTransmittalIdAndDeletedFalseOrderBySortOrderAsc(transmittalId)
                .stream()
                .map(TransmittalItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TransmittalResponse issue(UUID transmittalId, UUID sentById) {
        Transmittal transmittal = getTransmittalOrThrow(transmittalId);

        if (transmittal.getStatus() != TransmittalStatus.DRAFT) {
            throw new IllegalStateException(
                    "Выпуск возможен только для трансмиттала в статусе 'Черновик'");
        }

        List<TransmittalItem> items = transmittalItemRepository
                .findByTransmittalIdAndDeletedFalseOrderBySortOrderAsc(transmittalId);

        if (items.isEmpty()) {
            throw new IllegalStateException("Невозможно выпустить трансмиттал без позиций");
        }

        transmittal.setStatus(TransmittalStatus.ISSUED);
        transmittal.setIssuedDate(LocalDate.now());
        transmittal.setSentById(sentById);
        transmittal = transmittalRepository.save(transmittal);

        auditService.logStatusChange("Transmittal", transmittal.getId(), "DRAFT", "ISSUED");

        // Create audit entry for each item's document container
        for (TransmittalItem item : items) {
            DocumentAuditEntry auditEntry = DocumentAuditEntry.builder()
                    .documentContainerId(item.getDocumentContainerId())
                    .action("TRANSMITTED")
                    .performedAt(Instant.now())
                    .performedById(sentById)
                    .details("{\"transmittalId\":\"" + transmittalId + "\",\"transmittalNumber\":\""
                            + transmittal.getTransmittalNumber() + "\"}")
                    .build();
            documentAuditEntryRepository.save(auditEntry);
        }

        log.info("Transmittal issued: {} ({}) with {} items", transmittal.getTransmittalNumber(),
                transmittal.getId(), items.size());
        return TransmittalResponse.fromEntity(transmittal);
    }

    @Transactional
    public TransmittalResponse acknowledge(UUID transmittalId) {
        Transmittal transmittal = getTransmittalOrThrow(transmittalId);

        if (transmittal.getStatus() != TransmittalStatus.ISSUED) {
            throw new IllegalStateException(
                    "Подтверждение возможно только для трансмиттала в статусе 'Выпущен'");
        }

        transmittal.setStatus(TransmittalStatus.ACKNOWLEDGED);
        transmittal.setAcknowledgedDate(LocalDate.now());
        transmittal = transmittalRepository.save(transmittal);

        auditService.logStatusChange("Transmittal", transmittal.getId(), "ISSUED", "ACKNOWLEDGED");

        log.info("Transmittal acknowledged: {} ({})", transmittal.getTransmittalNumber(), transmittal.getId());
        return TransmittalResponse.fromEntity(transmittal);
    }

    @Transactional
    public TransmittalResponse close(UUID transmittalId) {
        Transmittal transmittal = getTransmittalOrThrow(transmittalId);

        if (transmittal.getStatus() != TransmittalStatus.ACKNOWLEDGED &&
                transmittal.getStatus() != TransmittalStatus.RESPONDED) {
            throw new IllegalStateException(
                    "Закрытие возможно только для трансмиттала в статусе 'Подтверждён' или 'С ответом'");
        }

        transmittal.setStatus(TransmittalStatus.CLOSED);
        transmittal = transmittalRepository.save(transmittal);

        auditService.logStatusChange("Transmittal", transmittal.getId(),
                transmittal.getStatus().name(), "CLOSED");

        log.info("Transmittal closed: {} ({})", transmittal.getTransmittalNumber(), transmittal.getId());
        return TransmittalResponse.fromEntity(transmittal);
    }

    @Transactional
    public void delete(UUID id) {
        Transmittal transmittal = getTransmittalOrThrow(id);
        transmittal.softDelete();
        transmittalRepository.save(transmittal);
        auditService.logDelete("Transmittal", id);
        log.info("Transmittal soft-deleted: {} ({})", transmittal.getTransmittalNumber(), id);
    }

    private Transmittal getTransmittalOrThrow(UUID id) {
        return transmittalRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Трансмиттал не найден с id: " + id));
    }
}
