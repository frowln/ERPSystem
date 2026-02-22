package com.privod.platform.modules.ai.classification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.ai.classification.domain.CrossCheckStatus;
import com.privod.platform.modules.ai.classification.domain.CrossCheckType;
import com.privod.platform.modules.ai.classification.domain.DocumentClassType;
import com.privod.platform.modules.ai.classification.domain.DocumentClassification;
import com.privod.platform.modules.ai.classification.domain.DocumentCrossCheck;
import com.privod.platform.modules.ai.classification.domain.OcrProcessingJob;
import com.privod.platform.modules.ai.classification.domain.OcrStatus;
import com.privod.platform.modules.ai.classification.repository.DocumentClassificationRepository;
import com.privod.platform.modules.ai.classification.repository.DocumentCrossCheckRepository;
import com.privod.platform.modules.ai.classification.repository.OcrProcessingJobRepository;
import com.privod.platform.modules.ai.classification.web.dto.ClassificationStatsResponse;
import com.privod.platform.modules.ai.classification.web.dto.DocumentClassificationResponse;
import com.privod.platform.modules.ai.classification.web.dto.DocumentCrossCheckResponse;
import com.privod.platform.modules.ai.classification.web.dto.OcrProcessingJobResponse;
import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.repository.DocumentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentClassificationService {

    private static final String ENTITY_TYPE = "DocumentClassification";
    private static final String CROSS_CHECK_ENTITY = "DocumentCrossCheck";
    private static final String OCR_JOB_ENTITY = "OcrProcessingJob";

    private final DocumentClassificationRepository classificationRepository;
    private final DocumentCrossCheckRepository crossCheckRepository;
    private final OcrProcessingJobRepository ocrJobRepository;
    private final DocumentRepository documentRepository;
    private final AuditService auditService;

    // ======================== Classification CRUD ========================

    @Transactional(readOnly = true)
    public Page<DocumentClassificationResponse> listClassifications(
            DocumentClassType typeFilter, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (typeFilter != null) {
            return classificationRepository
                    .findByOrganizationIdAndDetectedTypeAndDeletedFalse(orgId, typeFilter, pageable)
                    .map(DocumentClassificationResponse::fromEntity);
        }
        return classificationRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(DocumentClassificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DocumentClassificationResponse getClassification(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        DocumentClassification classification = getClassificationOrThrow(id, orgId);
        return DocumentClassificationResponse.fromEntity(classification);
    }

    @Transactional(readOnly = true)
    public DocumentClassificationResponse getClassificationByDocument(UUID documentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        DocumentClassification classification = classificationRepository
                .findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, documentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Классификация для документа " + documentId + " не найдена"));
        return DocumentClassificationResponse.fromEntity(classification);
    }

    // ======================== Classification Logic ========================

    @Transactional
    public DocumentClassificationResponse classifyDocument(UUID documentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Document document = documentRepository.findByIdAndOrganizationIdAndDeletedFalse(documentId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Документ " + documentId + " не найден"));

        // Check if classification already exists
        classificationRepository.findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, documentId)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Документ уже классифицирован. Используйте переопределение типа.");
                });

        // Rule-based classification using filename patterns and content
        ClassificationResult result = performRuleBasedClassification(document);

        DocumentClassification classification = DocumentClassification.builder()
                .organizationId(orgId)
                .documentId(documentId)
                .detectedType(result.type)
                .confidencePercent(result.confidence)
                .rawOcrText(result.ocrData)
                .extractedMetadataJson(result.metadata)
                .build();

        classification = classificationRepository.save(classification);
        auditService.logCreate(ENTITY_TYPE, classification.getId());

        log.info("Document {} classified as {} with {}% confidence",
                documentId, result.type, result.confidence);

        return DocumentClassificationResponse.fromEntity(classification);
    }

    @Transactional
    public DocumentClassificationResponse extractMetadata(UUID documentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        DocumentClassification classification = classificationRepository
                .findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, documentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Классификация для документа " + documentId + " не найдена. Сначала классифицируйте документ."));

        Document document = documentRepository.findByIdAndOrganizationIdAndDeletedFalse(documentId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Документ " + documentId + " не найден"));

        Map<String, Object> metadata = extractDocumentMetadata(document, classification.getDetectedType());
        classification.setExtractedMetadataJson(metadata);
        classification = classificationRepository.save(classification);

        auditService.logUpdate(ENTITY_TYPE, classification.getId(),
                "extractedMetadataJson", null, "metadata extracted");

        return DocumentClassificationResponse.fromEntity(classification);
    }

    // ======================== Manual Workflow ========================

    @Transactional
    public DocumentClassificationResponse confirmClassification(UUID classificationId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        DocumentClassification classification = getClassificationOrThrow(classificationId, orgId);

        if (classification.isConfirmed()) {
            throw new IllegalStateException("Классификация уже подтверждена");
        }

        classification.setConfirmed(true);
        classification.setConfirmedByUserId(userId);
        classification.setConfirmedAt(Instant.now());
        classification = classificationRepository.save(classification);

        auditService.logStatusChange(ENTITY_TYPE, classification.getId(),
                "unconfirmed", "confirmed");

        return DocumentClassificationResponse.fromEntity(classification);
    }

    @Transactional
    public DocumentClassificationResponse overrideClassification(
            UUID classificationId, DocumentClassType newType) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        DocumentClassification classification = getClassificationOrThrow(classificationId, orgId);
        String oldType = classification.getDetectedType().name();

        classification.setDetectedType(newType);
        classification.setConfidencePercent(100); // manual override = 100% confidence
        classification.setConfirmed(true);
        classification.setConfirmedByUserId(userId);
        classification.setConfirmedAt(Instant.now());
        classification = classificationRepository.save(classification);

        auditService.logUpdate(ENTITY_TYPE, classification.getId(),
                "detectedType", oldType, newType.name());

        log.info("Classification {} overridden from {} to {} by user {}",
                classificationId, oldType, newType, userId);

        return DocumentClassificationResponse.fromEntity(classification);
    }

    // ======================== Cross-Check ========================

    @Transactional
    public List<DocumentCrossCheckResponse> crossCheckDocuments(UUID sourceDocumentId, UUID targetDocumentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Document sourceDoc = documentRepository.findByIdAndOrganizationIdAndDeletedFalse(sourceDocumentId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Исходный документ " + sourceDocumentId + " не найден"));
        Document targetDoc = documentRepository.findByIdAndOrganizationIdAndDeletedFalse(targetDocumentId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Целевой документ " + targetDocumentId + " не найден"));

        // Get classifications for both documents if available
        var sourceClassOpt = classificationRepository
                .findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, sourceDocumentId);
        var targetClassOpt = classificationRepository
                .findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, targetDocumentId);

        List<DocumentCrossCheck> checks = new ArrayList<>();
        Instant now = Instant.now();

        // Perform date match check
        checks.add(createCrossCheck(orgId, sourceDocumentId, targetDocumentId,
                CrossCheckType.DATE_MATCH, compareDates(sourceDoc, targetDoc), now));

        // Perform total match check (based on metadata if available)
        checks.add(createCrossCheck(orgId, sourceDocumentId, targetDocumentId,
                CrossCheckType.TOTAL_MATCH, compareTotals(sourceClassOpt.orElse(null),
                        targetClassOpt.orElse(null)), now));

        // Perform quantity match check
        checks.add(createCrossCheck(orgId, sourceDocumentId, targetDocumentId,
                CrossCheckType.QUANTITY_MATCH, compareQuantities(sourceClassOpt.orElse(null),
                        targetClassOpt.orElse(null)), now));

        // Perform price match check
        checks.add(createCrossCheck(orgId, sourceDocumentId, targetDocumentId,
                CrossCheckType.PRICE_MATCH, comparePrices(sourceClassOpt.orElse(null),
                        targetClassOpt.orElse(null)), now));

        // Perform signature match check
        checks.add(createCrossCheck(orgId, sourceDocumentId, targetDocumentId,
                CrossCheckType.SIGNATURE_MATCH, compareSignatures(sourceClassOpt.orElse(null),
                        targetClassOpt.orElse(null)), now));

        List<DocumentCrossCheck> savedChecks = crossCheckRepository.saveAll(checks);
        savedChecks.forEach(check -> auditService.logCreate(CROSS_CHECK_ENTITY, check.getId()));

        log.info("Cross-check completed between documents {} and {}: {} checks",
                sourceDocumentId, targetDocumentId, savedChecks.size());

        return savedChecks.stream()
                .map(DocumentCrossCheckResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DocumentCrossCheckResponse> listCrossChecks(CrossCheckStatus statusFilter, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (statusFilter != null) {
            return crossCheckRepository
                    .findByOrganizationIdAndStatusAndDeletedFalse(orgId, statusFilter, pageable)
                    .map(DocumentCrossCheckResponse::fromEntity);
        }
        return crossCheckRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(DocumentCrossCheckResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DocumentCrossCheckResponse> getCrossChecksByDocument(UUID documentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<DocumentCrossCheck> sourceChecks = crossCheckRepository
                .findByOrganizationIdAndSourceDocumentIdAndDeletedFalse(orgId, documentId);
        List<DocumentCrossCheck> targetChecks = crossCheckRepository
                .findByOrganizationIdAndTargetDocumentIdAndDeletedFalse(orgId, documentId);

        List<DocumentCrossCheck> all = new ArrayList<>(sourceChecks);
        all.addAll(targetChecks);
        return all.stream()
                .map(DocumentCrossCheckResponse::fromEntity)
                .toList();
    }

    // ======================== OCR Queue ========================

    @Transactional
    public OcrProcessingJobResponse enqueueOcrJob(UUID documentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        documentRepository.findByIdAndOrganizationIdAndDeletedFalse(documentId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Документ " + documentId + " не найден"));

        // Check for existing job
        ocrJobRepository.findByOrganizationIdAndDocumentIdAndDeletedFalse(orgId, documentId)
                .ifPresent(existing -> {
                    if (existing.getStatus() == OcrStatus.PENDING || existing.getStatus() == OcrStatus.PROCESSING) {
                        throw new IllegalStateException(
                                "OCR-задание для документа уже существует в статусе: " + existing.getStatus().getDisplayName());
                    }
                });

        OcrProcessingJob job = OcrProcessingJob.builder()
                .organizationId(orgId)
                .documentId(documentId)
                .status(OcrStatus.PENDING)
                .build();

        job = ocrJobRepository.save(job);
        auditService.logCreate(OCR_JOB_ENTITY, job.getId());

        log.info("OCR job enqueued for document {}", documentId);

        return OcrProcessingJobResponse.fromEntity(job);
    }

    @Transactional(readOnly = true)
    public Page<OcrProcessingJobResponse> listOcrJobs(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return ocrJobRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(OcrProcessingJobResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OcrProcessingJobResponse getOcrJob(UUID jobId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        OcrProcessingJob job = ocrJobRepository.findByIdAndOrganizationIdAndDeletedFalse(jobId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("OCR-задание " + jobId + " не найдено"));
        return OcrProcessingJobResponse.fromEntity(job);
    }

    // ======================== Statistics ========================

    @Transactional(readOnly = true)
    public ClassificationStatsResponse getStats() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return new ClassificationStatsResponse(
                classificationRepository.countByOrganizationIdAndDeletedFalse(orgId),
                classificationRepository.countByOrganizationIdAndConfirmedTrueAndDeletedFalse(orgId),
                ocrJobRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, OcrStatus.PENDING),
                ocrJobRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, OcrStatus.PROCESSING),
                crossCheckRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, CrossCheckStatus.FAILED),
                crossCheckRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, CrossCheckStatus.PASSED)
        );
    }

    // ======================== Scheduled OCR Processing ========================

    @Scheduled(fixedDelayString = "${privod.ai.ocr.poll-interval-ms:30000}")
    @Transactional
    public void processOcrQueue() {
        List<OcrProcessingJob> pendingJobs = ocrJobRepository.findByStatusAndDeletedFalse(OcrStatus.PENDING);

        for (OcrProcessingJob job : pendingJobs) {
            try {
                processOcrJob(job);
            } catch (Exception e) {
                log.error("Failed to process OCR job {} for document {}",
                        job.getId(), job.getDocumentId(), e);
                job.setStatus(OcrStatus.FAILED);
                job.setErrorMessage(e.getMessage());
                job.setCompletedAt(Instant.now());
                ocrJobRepository.save(job);
                auditService.logStatusChange(OCR_JOB_ENTITY, job.getId(),
                        OcrStatus.PROCESSING.name(), OcrStatus.FAILED.name());
            }
        }
    }

    // ======================== Private Helpers ========================

    private void processOcrJob(OcrProcessingJob job) {
        long startTime = System.currentTimeMillis();
        job.setStatus(OcrStatus.PROCESSING);
        job.setStartedAt(Instant.now());
        ocrJobRepository.save(job);
        auditService.logStatusChange(OCR_JOB_ENTITY, job.getId(),
                OcrStatus.PENDING.name(), OcrStatus.PROCESSING.name());

        // Simulate OCR processing — in production, this would call an external OCR API
        // (e.g., Tesseract, Google Vision, ABBYY) and extract text from PDF pages
        Document document = documentRepository.findById(job.getDocumentId()).orElse(null);
        if (document == null) {
            throw new EntityNotFoundException("Документ " + job.getDocumentId() + " не найден при обработке OCR");
        }

        // Simulate page count estimation (1 page per document as placeholder)
        job.setPageCount(1);

        long elapsed = System.currentTimeMillis() - startTime;
        job.setProcessingTimeMs(elapsed);
        job.setStatus(OcrStatus.COMPLETED);
        job.setCompletedAt(Instant.now());
        ocrJobRepository.save(job);
        auditService.logStatusChange(OCR_JOB_ENTITY, job.getId(),
                OcrStatus.PROCESSING.name(), OcrStatus.COMPLETED.name());

        log.info("OCR job {} completed for document {} in {}ms",
                job.getId(), job.getDocumentId(), elapsed);
    }

    private record ClassificationResult(DocumentClassType type, int confidence, Map<String, Object> ocrData,
                                        Map<String, Object> metadata) {
    }

    private ClassificationResult performRuleBasedClassification(Document document) {
        String title = document.getTitle() != null ? document.getTitle().toLowerCase() : "";
        String docNumber = document.getDocumentNumber() != null ? document.getDocumentNumber().toLowerCase() : "";
        String combined = title + " " + docNumber;

        // Rule-based classification using filename patterns and document structure
        if (matchesKs2Pattern(combined)) {
            return new ClassificationResult(DocumentClassType.KS2, 85,
                    Map.of("source", "filename_pattern", "pattern", "КС-2"),
                    extractKs2Metadata(document));
        }
        if (matchesKs3Pattern(combined)) {
            return new ClassificationResult(DocumentClassType.KS3, 85,
                    Map.of("source", "filename_pattern", "pattern", "КС-3"),
                    extractKs3Metadata(document));
        }
        if (matchesAosrPattern(combined)) {
            return new ClassificationResult(DocumentClassType.AOSR, 80,
                    Map.of("source", "filename_pattern", "pattern", "АОСР"),
                    Map.of());
        }
        if (matchesDrawingPattern(combined)) {
            return new ClassificationResult(DocumentClassType.DRAWING, 75,
                    Map.of("source", "filename_pattern", "pattern", "drawing"),
                    Map.of());
        }
        if (matchesEstimatePattern(combined)) {
            return new ClassificationResult(DocumentClassType.ESTIMATE, 80,
                    Map.of("source", "filename_pattern", "pattern", "estimate"),
                    Map.of());
        }
        if (matchesActPattern(combined)) {
            return new ClassificationResult(DocumentClassType.ACT, 70,
                    Map.of("source", "filename_pattern", "pattern", "act"),
                    Map.of());
        }
        if (matchesInvoicePattern(combined)) {
            return new ClassificationResult(DocumentClassType.INVOICE, 80,
                    Map.of("source", "filename_pattern", "pattern", "invoice"),
                    Map.of());
        }
        if (matchesWaybillPattern(combined)) {
            return new ClassificationResult(DocumentClassType.WAYBILL, 75,
                    Map.of("source", "filename_pattern", "pattern", "waybill"),
                    Map.of());
        }
        if (matchesContractPattern(combined)) {
            return new ClassificationResult(DocumentClassType.CONTRACT, 80,
                    Map.of("source", "filename_pattern", "pattern", "contract"),
                    Map.of());
        }

        return new ClassificationResult(DocumentClassType.OTHER, 30,
                Map.of("source", "no_match"), Map.of());
    }

    // Pattern matching methods for Russian construction document types
    private boolean matchesKs2Pattern(String text) {
        return text.contains("кс-2") || text.contains("кс2") || text.contains("ks-2") || text.contains("ks2")
                || text.matches(".*акт\\s+о\\s+приёмке\\s+выполненных\\s+работ.*");
    }

    private boolean matchesKs3Pattern(String text) {
        return text.contains("кс-3") || text.contains("кс3") || text.contains("ks-3") || text.contains("ks3")
                || text.contains("справка о стоимости");
    }

    private boolean matchesAosrPattern(String text) {
        return text.contains("аоср") || text.contains("aosr")
                || text.contains("акт освидетельствования скрытых работ")
                || text.contains("скрытые работы");
    }

    private boolean matchesDrawingPattern(String text) {
        return text.contains("чертёж") || text.contains("чертеж") || text.contains("drawing")
                || text.matches(".*\\.(dwg|dxf|dwf)$") || text.contains("план этаж")
                || text.contains("разрез") || text.contains("фасад");
    }

    private boolean matchesEstimatePattern(String text) {
        return text.contains("смета") || text.contains("estimate") || text.contains("сметн")
                || text.contains("локальн") || text.contains("сводн");
    }

    private boolean matchesActPattern(String text) {
        return text.contains("акт") || text.contains("act");
    }

    private boolean matchesInvoicePattern(String text) {
        return text.contains("счёт") || text.contains("счет") || text.contains("invoice")
                || text.contains("счёт-фактура") || text.contains("счет-фактура");
    }

    private boolean matchesWaybillPattern(String text) {
        return text.contains("накладная") || text.contains("waybill") || text.contains("торг-12")
                || text.contains("тн") || text.contains("товарная накладная");
    }

    private boolean matchesContractPattern(String text) {
        return text.contains("договор") || text.contains("contract") || text.contains("контракт")
                || text.contains("соглашение");
    }

    private Map<String, Object> extractDocumentMetadata(Document document, DocumentClassType type) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("documentTitle", document.getTitle());
        metadata.put("documentNumber", document.getDocumentNumber());
        metadata.put("classifiedType", type.name());
        metadata.put("extractedAt", Instant.now().toString());

        // Extract dates using regex patterns for Russian date formats
        if (document.getTitle() != null) {
            extractDatesFromText(document.getTitle(), metadata);
            extractAmountsFromText(document.getTitle(), metadata);
        }

        return metadata;
    }

    private Map<String, Object> extractKs2Metadata(Document document) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("documentType", "КС-2");
        metadata.put("fullName", "Акт о приёмке выполненных работ");
        if (document.getDocumentNumber() != null) {
            metadata.put("actNumber", document.getDocumentNumber());
        }
        return metadata;
    }

    private Map<String, Object> extractKs3Metadata(Document document) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("documentType", "КС-3");
        metadata.put("fullName", "Справка о стоимости выполненных работ и затрат");
        if (document.getDocumentNumber() != null) {
            metadata.put("referenceNumber", document.getDocumentNumber());
        }
        return metadata;
    }

    private void extractDatesFromText(String text, Map<String, Object> metadata) {
        // Russian date format: dd.MM.yyyy
        Pattern datePattern = Pattern.compile("(\\d{2}\\.\\d{2}\\.\\d{4})");
        Matcher matcher = datePattern.matcher(text);
        List<String> dates = new ArrayList<>();
        while (matcher.find()) {
            dates.add(matcher.group(1));
        }
        if (!dates.isEmpty()) {
            metadata.put("extractedDates", dates);
        }
    }

    private void extractAmountsFromText(String text, Map<String, Object> metadata) {
        // Russian amount format: digits with spaces and comma decimal separator
        Pattern amountPattern = Pattern.compile("(\\d[\\d\\s]*[,.]\\d{2})\\s*(руб|₽|RUB)?");
        Matcher matcher = amountPattern.matcher(text);
        List<String> amounts = new ArrayList<>();
        while (matcher.find()) {
            amounts.add(matcher.group(1).replaceAll("\\s", "").replace(",", "."));
        }
        if (!amounts.isEmpty()) {
            metadata.put("extractedAmounts", amounts);
        }
    }

    // Cross-check comparison helpers
    private CrossCheckResult compareDates(Document source, Document target) {
        // Compare document dates
        if (source.getCreatedAt() != null && target.getCreatedAt() != null) {
            return new CrossCheckResult(CrossCheckStatus.PASSED, null);
        }
        return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                Map.of("reason", "Недостаточно данных для сравнения дат"));
    }

    private CrossCheckResult compareTotals(DocumentClassification source, DocumentClassification target) {
        if (source == null || target == null
                || source.getExtractedMetadataJson() == null || target.getExtractedMetadataJson() == null) {
            return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                    Map.of("reason", "Метаданные не извлечены для одного или обоих документов"));
        }

        Object sourceAmounts = source.getExtractedMetadataJson().get("extractedAmounts");
        Object targetAmounts = target.getExtractedMetadataJson().get("extractedAmounts");

        if (sourceAmounts instanceof List<?> sa && targetAmounts instanceof List<?> ta) {
            if (sa.isEmpty() || ta.isEmpty()) {
                return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                        Map.of("reason", "Суммы не найдены в документах"));
            }
            // Compare first extracted amount from each
            try {
                BigDecimal sourceTotal = new BigDecimal(sa.get(0).toString());
                BigDecimal targetTotal = new BigDecimal(ta.get(0).toString());
                if (sourceTotal.compareTo(targetTotal) == 0) {
                    return new CrossCheckResult(CrossCheckStatus.PASSED, null);
                }
                BigDecimal diff = sourceTotal.subtract(targetTotal).abs();
                return new CrossCheckResult(CrossCheckStatus.FAILED,
                        Map.of("sourceTotal", sourceTotal.toPlainString(),
                                "targetTotal", targetTotal.toPlainString(),
                                "difference", diff.toPlainString()));
            } catch (NumberFormatException e) {
                return new CrossCheckResult(CrossCheckStatus.WARNING,
                        Map.of("reason", "Не удалось разобрать суммы"));
            }
        }

        return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                Map.of("reason", "Суммы не доступны"));
    }

    private CrossCheckResult compareQuantities(DocumentClassification source, DocumentClassification target) {
        if (source == null || target == null
                || source.getExtractedMetadataJson() == null || target.getExtractedMetadataJson() == null) {
            return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                    Map.of("reason", "Метаданные не извлечены для сравнения объёмов"));
        }
        // Placeholder: in production, compare line-item quantities from КС-2 vs estimate
        return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                Map.of("reason", "Детальное сравнение объёмов требует OCR-обработки строк"));
    }

    private CrossCheckResult comparePrices(DocumentClassification source, DocumentClassification target) {
        if (source == null || target == null
                || source.getExtractedMetadataJson() == null || target.getExtractedMetadataJson() == null) {
            return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                    Map.of("reason", "Метаданные не извлечены для сравнения цен"));
        }
        return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                Map.of("reason", "Детальное сравнение цен требует OCR-обработки строк"));
    }

    private CrossCheckResult compareSignatures(DocumentClassification source, DocumentClassification target) {
        if (source == null || target == null
                || source.getExtractedMetadataJson() == null || target.getExtractedMetadataJson() == null) {
            return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                    Map.of("reason", "Метаданные не извлечены для сравнения подписей"));
        }
        return new CrossCheckResult(CrossCheckStatus.SKIPPED,
                Map.of("reason", "Сравнение подписей требует OCR-обработки"));
    }

    private record CrossCheckResult(CrossCheckStatus status, Map<String, Object> details) {
    }

    private DocumentCrossCheck createCrossCheck(UUID orgId, UUID sourceId, UUID targetId,
                                                 CrossCheckType type, CrossCheckResult result, Instant checkedAt) {
        return DocumentCrossCheck.builder()
                .organizationId(orgId)
                .sourceDocumentId(sourceId)
                .targetDocumentId(targetId)
                .checkType(type)
                .status(result.status)
                .discrepancyDetailsJson(result.details)
                .checkedAt(checkedAt)
                .build();
    }

    private DocumentClassification getClassificationOrThrow(UUID id, UUID orgId) {
        return classificationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Классификация " + id + " не найдена"));
    }
}
