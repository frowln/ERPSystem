package com.privod.platform.modules.m29.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Line;
import com.privod.platform.modules.m29.domain.M29Status;
import com.privod.platform.modules.m29.repository.M29DocumentRepository;
import com.privod.platform.modules.m29.repository.M29LineRepository;
import com.privod.platform.modules.m29.web.dto.CreateM29LineRequest;
import com.privod.platform.modules.m29.web.dto.CreateM29Request;
import com.privod.platform.modules.m29.web.dto.M29LineResponse;
import com.privod.platform.modules.m29.web.dto.M29ListResponse;
import com.privod.platform.modules.m29.web.dto.M29Response;
import com.privod.platform.modules.m29.web.dto.UpdateM29LineRequest;
import com.privod.platform.modules.m29.web.dto.UpdateM29Request;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class M29Service {

    private final M29DocumentRepository m29DocumentRepository;
    private final M29LineRepository m29LineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<M29ListResponse> listM29(UUID projectId, M29Status status, Pageable pageable) {
        Specification<M29Document> spec = Specification
                .where(M29Specification.notDeleted())
                .and(M29Specification.hasProject(projectId))
                .and(M29Specification.hasStatus(status));

        return m29DocumentRepository.findAll(spec, pageable).map(M29ListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public M29Response getM29(UUID id) {
        M29Document doc = getM29OrThrow(id);
        List<M29LineResponse> lines = m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(M29LineResponse::fromEntity)
                .toList();
        return M29Response.fromEntity(doc, lines);
    }

    @Transactional
    public M29Response createM29(CreateM29Request request) {
        String name = generateM29Name();

        M29Document doc = M29Document.builder()
                .name(name)
                .documentDate(request.documentDate())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .warehouseLocationId(request.warehouseLocationId())
                .ks2Id(request.ks2Id())
                .status(M29Status.DRAFT)
                .notes(request.notes())
                .build();

        doc = m29DocumentRepository.save(doc);
        auditService.logCreate("M29Document", doc.getId());

        log.info("М-29 создан: {} ({})", doc.getName(), doc.getId());
        return M29Response.fromEntity(doc, List.of());
    }

    @Transactional
    public M29Response updateM29(UUID id, UpdateM29Request request) {
        M29Document doc = getM29OrThrow(id);
        validateDraftStatus(doc.getStatus());

        if (request.documentDate() != null) {
            doc.setDocumentDate(request.documentDate());
        }
        if (request.projectId() != null) {
            doc.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            doc.setContractId(request.contractId());
        }
        if (request.warehouseLocationId() != null) {
            doc.setWarehouseLocationId(request.warehouseLocationId());
        }
        if (request.ks2Id() != null) {
            doc.setKs2Id(request.ks2Id());
        }
        if (request.notes() != null) {
            doc.setNotes(request.notes());
        }

        doc = m29DocumentRepository.save(doc);
        auditService.logUpdate("M29Document", doc.getId(), "multiple", null, null);

        log.info("М-29 обновлён: {} ({})", doc.getName(), doc.getId());
        List<M29LineResponse> lines = m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(M29LineResponse::fromEntity)
                .toList();
        return M29Response.fromEntity(doc, lines);
    }

    @Transactional
    public M29LineResponse addLine(UUID m29Id, CreateM29LineRequest request) {
        M29Document doc = getM29OrThrow(m29Id);
        validateDraftStatus(doc.getStatus());

        M29Line line = M29Line.builder()
                .m29Id(m29Id)
                .specItemId(request.specItemId())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .name(request.name())
                .plannedQuantity(request.plannedQuantity())
                .actualQuantity(request.actualQuantity())
                .unitOfMeasure(request.unitOfMeasure())
                .notes(request.notes())
                .build();

        line.computeVariance();
        line = m29LineRepository.save(line);
        auditService.logCreate("M29Line", line.getId());

        log.info("Строка М-29 добавлена: {} в документ {}", line.getName(), m29Id);
        return M29LineResponse.fromEntity(line);
    }

    @Transactional
    public M29LineResponse updateLine(UUID lineId, UpdateM29LineRequest request) {
        M29Line line = getM29LineOrThrow(lineId);
        M29Document doc = getM29OrThrow(line.getM29Id());
        validateDraftStatus(doc.getStatus());

        if (request.specItemId() != null) {
            line.setSpecItemId(request.specItemId());
        }
        if (request.sequence() != null) {
            line.setSequence(request.sequence());
        }
        if (request.name() != null) {
            line.setName(request.name());
        }
        if (request.plannedQuantity() != null) {
            line.setPlannedQuantity(request.plannedQuantity());
        }
        if (request.actualQuantity() != null) {
            line.setActualQuantity(request.actualQuantity());
        }
        if (request.unitOfMeasure() != null) {
            line.setUnitOfMeasure(request.unitOfMeasure());
        }
        if (request.notes() != null) {
            line.setNotes(request.notes());
        }

        line.computeVariance();
        line = m29LineRepository.save(line);
        auditService.logUpdate("M29Line", line.getId(), "multiple", null, null);

        log.info("Строка М-29 обновлена: {} ({})", line.getName(), line.getId());
        return M29LineResponse.fromEntity(line);
    }

    @Transactional
    public void removeLine(UUID lineId) {
        M29Line line = getM29LineOrThrow(lineId);
        M29Document doc = getM29OrThrow(line.getM29Id());
        validateDraftStatus(doc.getStatus());

        line.softDelete();
        m29LineRepository.save(line);
        auditService.logDelete("M29Line", lineId);

        log.info("Строка М-29 удалена: {}", lineId);
    }

    @Transactional
    public M29Response confirmM29(UUID id) {
        return transitionM29Status(id, M29Status.CONFIRMED, "подтверждён");
    }

    @Transactional
    public M29Response verifyM29(UUID id) {
        return transitionM29Status(id, M29Status.VERIFIED, "проверен");
    }

    @Transactional
    public M29Response approveM29(UUID id) {
        return transitionM29Status(id, M29Status.APPROVED, "утверждён");
    }

    @Transactional
    public M29Response postM29(UUID id) {
        return transitionM29Status(id, M29Status.POSTED, "проведён");
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private M29Response transitionM29Status(UUID id, M29Status targetStatus, String actionLabel) {
        M29Document doc = getM29OrThrow(id);
        M29Status oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести М-29 из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        doc.setStatus(targetStatus);
        doc = m29DocumentRepository.save(doc);
        auditService.logStatusChange("M29Document", doc.getId(), oldStatus.name(), targetStatus.name());

        log.info("М-29 {}: {} ({})", actionLabel, doc.getName(), doc.getId());
        List<M29LineResponse> lines = m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(M29LineResponse::fromEntity)
                .toList();
        return M29Response.fromEntity(doc, lines);
    }

    private M29Document getM29OrThrow(UUID id) {
        return m29DocumentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ М-29 не найден: " + id));
    }

    private M29Line getM29LineOrThrow(UUID lineId) {
        return m29LineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка М-29 не найдена: " + lineId));
    }

    private void validateDraftStatus(M29Status status) {
        if (status != M29Status.DRAFT) {
            throw new IllegalStateException(
                    String.format("Редактирование М-29 возможно только в статусе Черновик. Текущий статус: %s",
                            status.getDisplayName()));
        }
    }

    private String generateM29Name() {
        long seq = m29DocumentRepository.getNextNameSequence();
        return String.format("М-29-%05d", seq);
    }
}
