package com.privod.platform.modules.closing.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.domain.Ks3Ks2Link;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.closing.repository.Ks3DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks3Ks2LinkRepository;
import com.privod.platform.modules.closing.web.dto.CreateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.CreateKs2Request;
import com.privod.platform.modules.closing.web.dto.CreateKs3Request;
import com.privod.platform.modules.closing.web.dto.Ks2LineResponse;
import com.privod.platform.modules.closing.web.dto.Ks2ListResponse;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.Ks3ListResponse;
import com.privod.platform.modules.closing.web.dto.Ks3Response;
import com.privod.platform.modules.closing.web.dto.UpdateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.UpdateKs2Request;
import com.privod.platform.modules.closing.web.dto.UpdateKs3Request;
import com.privod.platform.modules.finance.service.BudgetItemSyncService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClosingDocumentService {

    private final Ks2DocumentRepository ks2DocumentRepository;
    private final Ks2LineRepository ks2LineRepository;
    private final Ks3DocumentRepository ks3DocumentRepository;
    private final Ks3Ks2LinkRepository ks3Ks2LinkRepository;
    private final AuditService auditService;
    private final BudgetItemSyncService budgetItemSyncService;

    // ========================================================================
    // KS-2 Methods
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<Ks2ListResponse> listKs2(UUID projectId, UUID contractId,
                                          ClosingDocumentStatus status, Pageable pageable) {
        Specification<Ks2Document> spec = Specification
                .where(ClosingDocumentSpecification.ks2NotDeleted())
                .and(ClosingDocumentSpecification.ks2HasProject(projectId))
                .and(ClosingDocumentSpecification.ks2HasContract(contractId))
                .and(ClosingDocumentSpecification.ks2HasStatus(status));

        return ks2DocumentRepository.findAll(spec, pageable).map(Ks2ListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Ks2Response getKs2(UUID id) {
        Ks2Document doc = getKs2OrThrow(id);
        List<Ks2LineResponse> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(Ks2LineResponse::fromEntity)
                .toList();
        return Ks2Response.fromEntity(doc, lines);
    }

    @Transactional
    public Ks2Response createKs2(CreateKs2Request request) {
        Ks2Document doc = Ks2Document.builder()
                .number(request.number())
                .documentDate(request.documentDate())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .status(ClosingDocumentStatus.DRAFT)
                .notes(request.notes())
                .build();

        doc.computeName();
        doc = ks2DocumentRepository.save(doc);
        auditService.logCreate("Ks2Document", doc.getId());

        log.info("КС-2 создан: {} ({})", doc.getName(), doc.getId());
        return Ks2Response.fromEntity(doc, List.of());
    }

    @Transactional
    public Ks2Response updateKs2(UUID id, UpdateKs2Request request) {
        Ks2Document doc = getKs2OrThrow(id);
        validateDraftStatus(doc.getStatus(), "КС-2");

        if (request.number() != null) {
            doc.setNumber(request.number());
        }
        if (request.documentDate() != null) {
            doc.setDocumentDate(request.documentDate());
        }
        if (request.projectId() != null) {
            doc.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            doc.setContractId(request.contractId());
        }
        if (request.notes() != null) {
            doc.setNotes(request.notes());
        }

        doc.computeName();
        doc = ks2DocumentRepository.save(doc);
        auditService.logUpdate("Ks2Document", doc.getId(), "multiple", null, null);

        log.info("КС-2 обновлён: {} ({})", doc.getName(), doc.getId());
        List<Ks2LineResponse> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(Ks2LineResponse::fromEntity)
                .toList();
        return Ks2Response.fromEntity(doc, lines);
    }

    @Transactional(readOnly = true)
    public List<Ks2LineResponse> getKs2Lines(UUID ks2Id) {
        getKs2OrThrow(ks2Id);
        return ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id)
                .stream()
                .map(Ks2LineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public Ks2LineResponse addKs2Line(UUID ks2Id, CreateKs2LineRequest request) {
        Ks2Document doc = getKs2OrThrow(ks2Id);
        validateDraftStatus(doc.getStatus(), "КС-2");

        Ks2Line line = Ks2Line.builder()
                .ks2Id(ks2Id)
                .specItemId(request.specItemId())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .name(request.name())
                .quantity(request.quantity())
                .unitPrice(request.unitPrice())
                .unitOfMeasure(request.unitOfMeasure())
                .notes(request.notes())
                .build();

        line.computeAmount();
        line = ks2LineRepository.save(line);
        auditService.logCreate("Ks2Line", line.getId());

        recalculateKs2Totals(ks2Id);

        log.info("Строка КС-2 добавлена: {} в документ {}", line.getName(), ks2Id);
        return Ks2LineResponse.fromEntity(line);
    }

    @Transactional
    public Ks2LineResponse updateKs2Line(UUID lineId, UpdateKs2LineRequest request) {
        Ks2Line line = getKs2LineOrThrow(lineId);
        Ks2Document doc = getKs2OrThrow(line.getKs2Id());
        validateDraftStatus(doc.getStatus(), "КС-2");

        if (request.specItemId() != null) {
            line.setSpecItemId(request.specItemId());
        }
        if (request.sequence() != null) {
            line.setSequence(request.sequence());
        }
        if (request.name() != null) {
            line.setName(request.name());
        }
        if (request.quantity() != null) {
            line.setQuantity(request.quantity());
        }
        if (request.unitPrice() != null) {
            line.setUnitPrice(request.unitPrice());
        }
        if (request.unitOfMeasure() != null) {
            line.setUnitOfMeasure(request.unitOfMeasure());
        }
        if (request.notes() != null) {
            line.setNotes(request.notes());
        }

        line.computeAmount();
        line = ks2LineRepository.save(line);
        auditService.logUpdate("Ks2Line", line.getId(), "multiple", null, null);

        recalculateKs2Totals(line.getKs2Id());

        log.info("Строка КС-2 обновлена: {} ({})", line.getName(), line.getId());
        return Ks2LineResponse.fromEntity(line);
    }

    @Transactional
    public void removeKs2Line(UUID lineId) {
        Ks2Line line = getKs2LineOrThrow(lineId);
        Ks2Document doc = getKs2OrThrow(line.getKs2Id());
        validateDraftStatus(doc.getStatus(), "КС-2");

        line.softDelete();
        ks2LineRepository.save(line);
        auditService.logDelete("Ks2Line", lineId);

        recalculateKs2Totals(line.getKs2Id());

        log.info("Строка КС-2 удалена: {}", lineId);
    }

    @Transactional
    public Ks2Response submitKs2(UUID id) {
        Ks2Document doc = getKs2OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.SUBMITTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести КС-2 из статуса %s в %s",
                            oldStatus.getDisplayName(), ClosingDocumentStatus.SUBMITTED.getDisplayName()));
        }

        List<Ks2Line> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(id);
        if (lines.isEmpty()) {
            throw new IllegalStateException("Невозможно отправить КС-2 без строк работ");
        }

        doc.setStatus(ClosingDocumentStatus.SUBMITTED);
        doc = ks2DocumentRepository.save(doc);
        auditService.logStatusChange("Ks2Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.SUBMITTED.name());

        log.info("КС-2 отправлен на рассмотрение: {} ({})", doc.getName(), doc.getId());
        List<Ks2LineResponse> lineResponses = lines.stream().map(Ks2LineResponse::fromEntity).toList();
        return Ks2Response.fromEntity(doc, lineResponses);
    }

    @Transactional
    public Ks2Response signKs2(UUID id) {
        Ks2Document doc = getKs2OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.SIGNED)) {
            throw new IllegalStateException(
                    String.format("Невозможно подписать КС-2 из статуса %s",
                            oldStatus.getDisplayName()));
        }

        doc.setStatus(ClosingDocumentStatus.SIGNED);
        doc.setSignedAt(Instant.now());
        doc = ks2DocumentRepository.save(doc);
        budgetItemSyncService.onKs2Signed(doc.getContractId());
        auditService.logStatusChange("Ks2Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.SIGNED.name());

        log.info("КС-2 подписан: {} ({})", doc.getName(), doc.getId());
        List<Ks2LineResponse> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream().map(Ks2LineResponse::fromEntity).toList();
        return Ks2Response.fromEntity(doc, lines);
    }

    @Transactional
    public Ks2Response closeKs2(UUID id) {
        Ks2Document doc = getKs2OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.CLOSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно закрыть КС-2 из статуса %s",
                            oldStatus.getDisplayName()));
        }

        doc.setStatus(ClosingDocumentStatus.CLOSED);
        doc = ks2DocumentRepository.save(doc);
        auditService.logStatusChange("Ks2Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.CLOSED.name());

        log.info("КС-2 закрыт: {} ({})", doc.getName(), doc.getId());
        List<Ks2LineResponse> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(id)
                .stream().map(Ks2LineResponse::fromEntity).toList();
        return Ks2Response.fromEntity(doc, lines);
    }

    @Transactional
    public void recalculateKs2Totals(UUID ks2Id) {
        Ks2Document doc = getKs2OrThrow(ks2Id);
        BigDecimal totalAmount = ks2LineRepository.sumAmountByKs2Id(ks2Id);
        BigDecimal totalQuantity = ks2LineRepository.sumQuantityByKs2Id(ks2Id);

        doc.setTotalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO);
        doc.setTotalQuantity(totalQuantity != null ? totalQuantity : BigDecimal.ZERO);
        ks2DocumentRepository.save(doc);

        log.debug("КС-2 итоги пересчитаны: {} - сумма={}, количество={}", ks2Id, totalAmount, totalQuantity);
    }

    // ========================================================================
    // KS-3 Methods
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<Ks3ListResponse> listKs3(UUID projectId, UUID contractId,
                                          ClosingDocumentStatus status, Pageable pageable) {
        Specification<Ks3Document> spec = Specification
                .where(ClosingDocumentSpecification.ks3NotDeleted())
                .and(ClosingDocumentSpecification.ks3HasProject(projectId))
                .and(ClosingDocumentSpecification.ks3HasContract(contractId))
                .and(ClosingDocumentSpecification.ks3HasStatus(status));

        return ks3DocumentRepository.findAll(spec, pageable).map(Ks3ListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Ks3Response getKs3(UUID id) {
        Ks3Document doc = getKs3OrThrow(id);
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(id);
        return Ks3Response.fromEntity(doc, linkedKs2);
    }

    @Transactional
    public Ks3Response createKs3(CreateKs3Request request) {
        Ks3Document doc = Ks3Document.builder()
                .number(request.number())
                .documentDate(request.documentDate())
                .periodFrom(request.periodFrom())
                .periodTo(request.periodTo())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .retentionPercent(request.retentionPercent() != null ? request.retentionPercent() : new BigDecimal("5.00"))
                .status(ClosingDocumentStatus.DRAFT)
                .notes(request.notes())
                .build();

        doc.computeName();
        doc = ks3DocumentRepository.save(doc);
        auditService.logCreate("Ks3Document", doc.getId());

        log.info("КС-3 создан: {} ({})", doc.getName(), doc.getId());
        return Ks3Response.fromEntity(doc, List.of());
    }

    @Transactional
    public Ks3Response updateKs3(UUID id, UpdateKs3Request request) {
        Ks3Document doc = getKs3OrThrow(id);
        validateDraftStatus(doc.getStatus(), "КС-3");

        if (request.number() != null) {
            doc.setNumber(request.number());
        }
        if (request.documentDate() != null) {
            doc.setDocumentDate(request.documentDate());
        }
        if (request.periodFrom() != null) {
            doc.setPeriodFrom(request.periodFrom());
        }
        if (request.periodTo() != null) {
            doc.setPeriodTo(request.periodTo());
        }
        if (request.projectId() != null) {
            doc.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            doc.setContractId(request.contractId());
        }
        if (request.retentionPercent() != null) {
            doc.setRetentionPercent(request.retentionPercent());
        }
        if (request.notes() != null) {
            doc.setNotes(request.notes());
        }

        doc.computeName();
        doc = ks3DocumentRepository.save(doc);
        auditService.logUpdate("Ks3Document", doc.getId(), "multiple", null, null);

        log.info("КС-3 обновлён: {} ({})", doc.getName(), doc.getId());
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(id);
        return Ks3Response.fromEntity(doc, linkedKs2);
    }

    @Transactional
    public Ks3Response linkKs2ToKs3(UUID ks3Id, UUID ks2Id) {
        Ks3Document ks3 = getKs3OrThrow(ks3Id);
        validateDraftStatus(ks3.getStatus(), "КС-3");
        getKs2OrThrow(ks2Id);

        if (ks3Ks2LinkRepository.existsByKs3IdAndKs2IdAndDeletedFalse(ks3Id, ks2Id)) {
            throw new IllegalArgumentException("КС-2 уже привязан к данному КС-3");
        }

        Ks3Ks2Link link = Ks3Ks2Link.builder()
                .ks3Id(ks3Id)
                .ks2Id(ks2Id)
                .build();
        ks3Ks2LinkRepository.save(link);

        recalculateKs3Totals(ks3Id);

        log.info("КС-2 {} привязан к КС-3 {}", ks2Id, ks3Id);
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(ks3Id);
        return Ks3Response.fromEntity(ks3, linkedKs2);
    }

    @Transactional
    public Ks3Response unlinkKs2FromKs3(UUID ks3Id, UUID ks2Id) {
        Ks3Document ks3 = getKs3OrThrow(ks3Id);
        validateDraftStatus(ks3.getStatus(), "КС-3");

        Ks3Ks2Link link = ks3Ks2LinkRepository.findByKs3IdAndKs2IdAndDeletedFalse(ks3Id, ks2Id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Связь КС-2 " + ks2Id + " с КС-3 " + ks3Id + " не найдена"));

        link.softDelete();
        ks3Ks2LinkRepository.save(link);

        recalculateKs3Totals(ks3Id);

        log.info("КС-2 {} отвязан от КС-3 {}", ks2Id, ks3Id);
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(ks3Id);
        return Ks3Response.fromEntity(ks3, linkedKs2);
    }

    @Transactional
    public Ks3Response autoFillKs2(UUID ks3Id) {
        Ks3Document ks3 = getKs3OrThrow(ks3Id);
        validateDraftStatus(ks3.getStatus(), "КС-3");

        Specification<Ks2Document> spec = Specification
                .where(ClosingDocumentSpecification.ks2NotDeleted())
                .and(ClosingDocumentSpecification.ks2HasProject(ks3.getProjectId()))
                .and(ClosingDocumentSpecification.ks2HasContract(ks3.getContractId()))
                .and(ClosingDocumentSpecification.ks2HasStatus(ClosingDocumentStatus.SIGNED));

        List<Ks2Document> signedKs2 = ks2DocumentRepository.findAll(spec);

        int linked = 0;
        for (Ks2Document ks2 : signedKs2) {
            if (!ks3Ks2LinkRepository.existsByKs3IdAndKs2IdAndDeletedFalse(ks3Id, ks2.getId())) {
                Ks3Ks2Link link = Ks3Ks2Link.builder()
                        .ks3Id(ks3Id)
                        .ks2Id(ks2.getId())
                        .build();
                ks3Ks2LinkRepository.save(link);
                linked++;
            }
        }

        recalculateKs3Totals(ks3Id);

        log.info("Авто-заполнение КС-3 {}: привязано {} документов КС-2", ks3Id, linked);
        ks3 = getKs3OrThrow(ks3Id);
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(ks3Id);
        return Ks3Response.fromEntity(ks3, linkedKs2);
    }

    @Transactional
    public Ks3Response submitKs3(UUID id) {
        Ks3Document doc = getKs3OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.SUBMITTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести КС-3 из статуса %s в %s",
                            oldStatus.getDisplayName(), ClosingDocumentStatus.SUBMITTED.getDisplayName()));
        }

        List<Ks3Ks2Link> links = ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(id);
        if (links.isEmpty()) {
            throw new IllegalStateException("Невозможно отправить КС-3 без привязанных документов КС-2");
        }

        doc.setStatus(ClosingDocumentStatus.SUBMITTED);
        doc = ks3DocumentRepository.save(doc);
        auditService.logStatusChange("Ks3Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.SUBMITTED.name());

        log.info("КС-3 отправлен на рассмотрение: {} ({})", doc.getName(), doc.getId());
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(id);
        return Ks3Response.fromEntity(doc, linkedKs2);
    }

    @Transactional
    public Ks3Response signKs3(UUID id) {
        Ks3Document doc = getKs3OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.SIGNED)) {
            throw new IllegalStateException(
                    String.format("Невозможно подписать КС-3 из статуса %s",
                            oldStatus.getDisplayName()));
        }

        doc.setStatus(ClosingDocumentStatus.SIGNED);
        doc.setSignedAt(Instant.now());
        doc.calculateRetention();
        doc = ks3DocumentRepository.save(doc);
        auditService.logStatusChange("Ks3Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.SIGNED.name());

        log.info("КС-3 подписан: {} ({}) - удержание: {}", doc.getName(), doc.getId(), doc.getRetentionAmount());
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(id);
        return Ks3Response.fromEntity(doc, linkedKs2);
    }

    @Transactional
    public Ks3Response closeKs3(UUID id) {
        Ks3Document doc = getKs3OrThrow(id);
        ClosingDocumentStatus oldStatus = doc.getStatus();

        if (!doc.canTransitionTo(ClosingDocumentStatus.CLOSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно закрыть КС-3 из статуса %s",
                            oldStatus.getDisplayName()));
        }

        doc.setStatus(ClosingDocumentStatus.CLOSED);
        doc = ks3DocumentRepository.save(doc);
        auditService.logStatusChange("Ks3Document", doc.getId(), oldStatus.name(), ClosingDocumentStatus.CLOSED.name());

        log.info("КС-3 закрыт: {} ({})", doc.getName(), doc.getId());
        List<Ks2ListResponse> linkedKs2 = getLinkedKs2ForKs3(id);
        return Ks3Response.fromEntity(doc, linkedKs2);
    }

    @Transactional
    public void recalculateKs3Totals(UUID ks3Id) {
        Ks3Document doc = getKs3OrThrow(ks3Id);

        List<Ks3Ks2Link> links = ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id);
        BigDecimal total = BigDecimal.ZERO;

        for (Ks3Ks2Link link : links) {
            Ks2Document ks2 = ks2DocumentRepository.findById(link.getKs2Id())
                    .filter(k -> !k.isDeleted())
                    .orElse(null);
            if (ks2 != null && ks2.getTotalAmount() != null) {
                total = total.add(ks2.getTotalAmount());
            }
        }

        doc.setTotalAmount(total);
        doc.calculateRetention();
        ks3DocumentRepository.save(doc);

        log.debug("КС-3 итоги пересчитаны: {} - сумма={}, удержание={}, нетто={}",
                ks3Id, doc.getTotalAmount(), doc.getRetentionAmount(), doc.getNetAmount());
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private Ks2Document getKs2OrThrow(UUID id) {
        return ks2DocumentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ КС-2 не найден: " + id));
    }

    private Ks2Line getKs2LineOrThrow(UUID lineId) {
        return ks2LineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка КС-2 не найдена: " + lineId));
    }

    private Ks3Document getKs3OrThrow(UUID id) {
        return ks3DocumentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ КС-3 не найден: " + id));
    }

    private void validateDraftStatus(ClosingDocumentStatus status, String docType) {
        if (status != ClosingDocumentStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Редактирование %s возможно только в статусе Черновик. Текущий статус: %s",
                            docType, status.getDisplayName()));
        }
    }

    private List<Ks2ListResponse> getLinkedKs2ForKs3(UUID ks3Id) {
        List<Ks3Ks2Link> links = ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id);
        return links.stream()
                .map(link -> ks2DocumentRepository.findById(link.getKs2Id())
                        .filter(d -> !d.isDeleted())
                        .map(Ks2ListResponse::fromEntity)
                        .orElse(null))
                .filter(r -> r != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.privod.platform.modules.closing.web.dto.Ks6aEntryResponse> getKs6aEntries(java.util.UUID projectId, Integer year) {
        return java.util.Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public List<com.privod.platform.modules.closing.web.dto.CorrectionActResponse> getCorrectionActs() {
        return java.util.Collections.emptyList();
    }

    @Transactional
    public com.privod.platform.modules.closing.web.dto.CorrectionActResponse createCorrectionAct(
            com.privod.platform.modules.closing.web.dto.CreateCorrectionActRequest request) {
        throw new UnsupportedOperationException("Корректировочные акты: функционал в разработке");
    }
}
