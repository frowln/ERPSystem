package com.privod.platform.modules.russianDoc.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.russianDoc.domain.OcrEstimateResult;
import com.privod.platform.modules.russianDoc.domain.OcrTask;
import com.privod.platform.modules.russianDoc.domain.OcrTaskStatus;
import com.privod.platform.modules.russianDoc.repository.OcrEstimateResultRepository;
import com.privod.platform.modules.russianDoc.repository.OcrTaskRepository;
import com.privod.platform.modules.russianDoc.web.dto.AcceptOcrResultRequest;
import com.privod.platform.modules.russianDoc.web.dto.OcrEstimateResultResponse;
import com.privod.platform.modules.russianDoc.web.dto.OcrTaskResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Сервис обработки OCR-распознавания смет.
 * Выполняет разбор загруженного документа на строки сметы,
 * сопоставляет расценки и управляет процессом принятия результатов.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OcrEstimateService {

    private final OcrTaskRepository taskRepository;
    private final OcrEstimateResultRepository resultRepository;
    private final AuditService auditService;

    /**
     * Запускает распознавание сметы для указанной задачи OCR.
     * Симулирует извлечение табличных данных из документа.
     */
    @Transactional
    public List<OcrEstimateResultResponse> processEstimate(UUID taskId) {
        OcrTask task = getTaskOrThrow(taskId);

        if (task.getStatus() != OcrTaskStatus.PENDING && task.getStatus() != OcrTaskStatus.PROCESSING) {
            throw new IllegalStateException(
                    "Обработка сметы возможна только для задач в статусе PENDING или PROCESSING");
        }

        long startTime = System.currentTimeMillis();

        task.setStatus(OcrTaskStatus.PROCESSING);
        task.setDocumentType("ESTIMATE");
        task = taskRepository.save(task);
        auditService.logStatusChange("OcrTask", task.getId(), "PENDING", "PROCESSING");

        // Generate realistic mock estimate lines
        List<OcrEstimateResult> results = generateMockEstimateResults(task.getId());
        results = resultRepository.saveAll(results);

        long processingTime = System.currentTimeMillis() - startTime;

        // Calculate average confidence
        BigDecimal avgConfidence = results.stream()
                .map(OcrEstimateResult::getConfidence)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(results.size()), 2, RoundingMode.HALF_UP);

        // Update task metadata
        task.setStatus(OcrTaskStatus.COMPLETED);
        task.setTotalLinesDetected(results.size());
        task.setAverageConfidence(avgConfidence);
        task.setProcessingTimeMs(processingTime);
        task.setProcessedAt(Instant.now());
        task.setConfidence(avgConfidence.doubleValue());
        taskRepository.save(task);
        auditService.logStatusChange("OcrTask", task.getId(), "PROCESSING", "COMPLETED");

        log.info("OCR смета обработана: {} строк, средняя уверенность: {}%, время: {}мс ({})",
                results.size(), avgConfidence, processingTime, task.getId());

        return results.stream()
                .map(OcrEstimateResultResponse::fromEntity)
                .toList();
    }

    /**
     * Возвращает результаты распознавания для задачи.
     */
    @Transactional(readOnly = true)
    public List<OcrEstimateResultResponse> getEstimateResults(UUID taskId) {
        getTaskOrThrow(taskId); // verify access
        return resultRepository.findByOcrTaskIdAndDeletedFalseOrderByLineNumberAsc(taskId)
                .stream()
                .map(OcrEstimateResultResponse::fromEntity)
                .toList();
    }

    /**
     * Принимает выбранные результаты распознавания.
     */
    @Transactional
    public List<OcrEstimateResultResponse> acceptResults(AcceptOcrResultRequest request) {
        List<OcrEstimateResult> accepted = new ArrayList<>();

        for (UUID resultId : request.resultIds()) {
            OcrEstimateResult result = resultRepository.findByIdAndDeletedFalse(resultId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Результат OCR не найден: " + resultId));

            // Verify org access via the parent task
            getTaskOrThrow(result.getOcrTaskId());

            result.setAccepted(true);
            accepted.add(resultRepository.save(result));
            auditService.logUpdate("OcrEstimateResult", result.getId(), "accepted", "false", "true");
        }

        log.info("Принято {} результатов OCR-распознавания", accepted.size());

        return accepted.stream()
                .map(OcrEstimateResultResponse::fromEntity)
                .toList();
    }

    /**
     * Отклоняет (мягко удаляет) результат распознавания.
     */
    @Transactional
    public void rejectResult(UUID resultId) {
        OcrEstimateResult result = resultRepository.findByIdAndDeletedFalse(resultId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Результат OCR не найден: " + resultId));

        // Verify org access via the parent task
        getTaskOrThrow(result.getOcrTaskId());

        result.softDelete();
        resultRepository.save(result);
        auditService.logDelete("OcrEstimateResult", result.getId());

        log.info("Результат OCR отклонён: {} ({})", result.getName(), result.getId());
    }

    /**
     * Возвращает задачу OCR с проверкой принадлежности к текущей организации.
     */
    OcrTask getTaskOrThrow(UUID taskId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return taskRepository.findByIdAndOrganizationIdAndDeletedFalse(taskId, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("OCR задача не найдена: " + taskId));
    }

    // =========================================================================
    // Mock data generation
    // =========================================================================

    private List<OcrEstimateResult> generateMockEstimateResults(UUID taskId) {
        Random rng = new Random();
        int lineCount = 8 + rng.nextInt(8); // 8-15 lines

        String[][] estimateItems = {
                {"ТЕР01-001-002", "Разработка грунта экскаватором", "м3"},
                {"ТЕР05-001-003", "Монолитные ж/б фундаменты", "м3"},
                {"ТЕР06-001-001", "Кладка стен из кирпича", "м3"},
                {"ТЕР07-001-015", "Устройство перекрытий из сборных ж/б плит", "шт"},
                {"ТЕР08-002-001", "Монтаж металлоконструкций", "т"},
                {"ТЕР10-001-008", "Устройство кровли из профлиста", "м2"},
                {"ТЕР11-001-001", "Штукатурка стен", "м2"},
                {"ТЕР11-002-003", "Окраска стен водоэмульсионная", "м2"},
                {"ТЕР12-001-002", "Устройство полов из керамической плитки", "м2"},
                {"ТЕР15-001-006", "Прокладка труб отопления", "м"},
                {"ТЕР16-002-001", "Монтаж электрооборудования", "шт"},
                {"ТЕР09-001-003", "Устройство гидроизоляции", "м2"},
                {"ТЕР13-001-001", "Установка оконных блоков", "м2"},
                {"ТЕР14-001-002", "Устройство вентиляции", "м"},
                {"ТЕР17-001-004", "Благоустройство территории", "м2"},
        };

        List<OcrEstimateResult> results = new ArrayList<>();

        for (int i = 0; i < lineCount && i < estimateItems.length; i++) {
            String[] item = estimateItems[i];
            BigDecimal qty = BigDecimal.valueOf(10 + rng.nextInt(490))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal price = BigDecimal.valueOf(500 + rng.nextInt(49500))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            BigDecimal conf = BigDecimal.valueOf(55 + rng.nextInt(46))
                    .setScale(2, RoundingMode.HALF_UP);

            int page = 1 + i / 5;
            String bbox = String.format(
                    "{\"x\":%d,\"y\":%d,\"width\":800,\"height\":20,\"page\":%d}",
                    50, 100 + (i % 5) * 25, page);

            OcrEstimateResult result = OcrEstimateResult.builder()
                    .ocrTaskId(taskId)
                    .lineNumber(i + 1)
                    .rateCode(item[0])
                    .name(item[1])
                    .unit(item[2])
                    .quantity(qty)
                    .unitPrice(price)
                    .totalPrice(total)
                    .confidence(conf)
                    .boundingBoxJson(bbox)
                    .accepted(false)
                    .matchedRateId(conf.compareTo(BigDecimal.valueOf(80)) >= 0 ? UUID.randomUUID() : null)
                    .build();

            results.add(result);
        }

        return results;
    }
}
