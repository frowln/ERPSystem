package com.privod.platform.modules.closing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.finance.VatCalculator;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.closing.web.dto.Ks2LineResponse;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.PipelinePreviewResponse;
import com.privod.platform.modules.closing.web.dto.VolumeEntry;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogEntry;
import com.privod.platform.modules.dailylog.domain.EntryType;
import com.privod.platform.modules.dailylog.repository.DailyLogEntryRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class Ks2PipelineService {

    private final DailyLogRepository dailyLogRepository;
    private final DailyLogEntryRepository dailyLogEntryRepository;
    private final Ks2DocumentRepository ks2DocumentRepository;
    private final Ks2LineRepository ks2LineRepository;
    private final ContractRepository contractRepository;
    private final SpecItemRepository specItemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final ClosingDocumentService closingDocumentService;
    private final ObjectMapper objectMapper;

    // ========================================================================
    // Public API
    // ========================================================================

    /**
     * Collect work volumes from daily logs for a given project and month.
     * Groups WORK_PERFORMED entries by description+unit and aggregates quantities.
     * Where a matching SpecItem (WORK type) exists, pricing is included.
     */
    @Transactional(readOnly = true)
    public List<VolumeEntry> collectVolumes(UUID projectId, YearMonth yearMonth) {
        List<DailyLog> dailyLogs = findDailyLogs(projectId, yearMonth);
        if (dailyLogs.isEmpty()) {
            return List.of();
        }

        List<DailyLogEntry> workEntries = findWorkEntries(dailyLogs);
        if (workEntries.isEmpty()) {
            return List.of();
        }

        // Load spec items for pricing lookup
        List<SpecItem> specItems = specItemRepository.findCurrentWorkItemsByProjectId(projectId);
        Map<String, SpecItem> specItemIndex = buildSpecItemIndex(specItems);

        return aggregateVolumes(workEntries, specItemIndex);
    }

    /**
     * Generate a single KS-2 document for a specific contract from daily log field data.
     * Pipeline: DailyLog -> Volumes -> Pricing -> KS-2 with lines.
     */
    @Transactional
    public Ks2Response generateKs2(UUID projectId, UUID contractId, YearMonth yearMonth) {
        Project project = getProjectOrThrow(projectId);
        Contract contract = getContractOrThrow(contractId);

        if (contract.getProjectId() == null || !contract.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException(
                    "Контракт " + contractId + " не привязан к проекту " + projectId);
        }

        List<VolumeEntry> volumes = collectVolumes(projectId, yearMonth);
        if (volumes.isEmpty()) {
            throw new IllegalStateException(
                    "Нет данных о выполненных работах за период " + yearMonth + " для проекта " + project.getName());
        }

        List<DailyLog> dailyLogs = findDailyLogs(projectId, yearMonth);
        List<UUID> dailyLogIds = dailyLogs.stream().map(DailyLog::getId).toList();

        // Create KS-2 document
        String docNumber = generateDocumentNumber(yearMonth);
        LocalDate documentDate = yearMonth.atEndOfMonth();

        Ks2Document doc = Ks2Document.builder()
                .number(docNumber)
                .documentDate(documentDate)
                .projectId(projectId)
                .contractId(contractId)
                .status(ClosingDocumentStatus.DRAFT)
                .notes("Автоматически сформирован из журнала работ за " + formatYearMonth(yearMonth))
                .pipelineGenerated(true)
                .pipelineGeneratedAt(Instant.now())
                .sourceDailyLogIds(serializeDailyLogIds(dailyLogIds))
                .build();

        doc.computeName();
        doc = ks2DocumentRepository.save(doc);
        auditService.logCreate("Ks2Document", doc.getId());

        // Create KS-2 lines from volumes
        BigDecimal vatRate = VatCalculator.resolveRate(contract.getVatRate());
        List<Ks2Line> lines = createKs2Lines(doc.getId(), volumes, vatRate);

        // Recalculate totals
        UUID ks2Id = doc.getId();
        closingDocumentService.recalculateKs2Totals(ks2Id);

        // Reload document to get calculated totals
        doc = ks2DocumentRepository.findById(ks2Id)
                .orElseThrow(() -> new EntityNotFoundException("Документ КС-2 не найден: " + ks2Id));

        log.info("Pipeline: КС-2 {} сформирован для проекта {} / контракта {} за {}. Строк: {}, Сумма: {}",
                doc.getNumber(), project.getCode(), contract.getNumber(),
                yearMonth, lines.size(), doc.getTotalWithVat());

        List<Ks2LineResponse> lineResponses = lines.stream().map(Ks2LineResponse::fromEntity).toList();
        return Ks2Response.fromEntity(doc, lineResponses);
    }

    /**
     * Batch-generate KS-2 for ALL contracts linked to a project for a given month.
     */
    @Transactional
    public List<Ks2Response> batchGenerateKs2(UUID projectId, YearMonth yearMonth) {
        getProjectOrThrow(projectId);

        List<Contract> contracts = contractRepository.findByProjectIdAndDeletedFalse(projectId);
        if (contracts.isEmpty()) {
            throw new IllegalStateException(
                    "Нет контрактов для проекта " + projectId);
        }

        List<VolumeEntry> volumes = collectVolumes(projectId, yearMonth);
        if (volumes.isEmpty()) {
            throw new IllegalStateException(
                    "Нет данных о выполненных работах за период " + yearMonth + " для проекта " + projectId);
        }

        List<Ks2Response> results = new ArrayList<>();
        for (Contract contract : contracts) {
            try {
                Ks2Response response = generateKs2(projectId, contract.getId(), yearMonth);
                results.add(response);
            } catch (Exception e) {
                log.warn("Pipeline: Не удалось сгенерировать КС-2 для контракта {} ({}): {}",
                        contract.getNumber(), contract.getId(), e.getMessage());
            }
        }

        log.info("Pipeline: Пакетная генерация КС-2 для проекта {} за {}. Сгенерировано: {} из {}",
                projectId, yearMonth, results.size(), contracts.size());

        return results;
    }

    /**
     * Preview what the pipeline would generate without creating any documents.
     * Returns volumes, pricing, estimated totals.
     */
    @Transactional(readOnly = true)
    public PipelinePreviewResponse getPipelinePreview(UUID projectId, UUID contractId, YearMonth yearMonth) {
        Project project = getProjectOrThrow(projectId);
        Contract contract = getContractOrThrow(contractId);

        List<VolumeEntry> volumes = collectVolumes(projectId, yearMonth);

        BigDecimal estimatedTotal = volumes.stream()
                .map(VolumeEntry::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PipelinePreviewResponse(
                volumes,
                estimatedTotal,
                volumes.size(),
                contract.getNumber(),
                project.getName()
        );
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private List<DailyLog> findDailyLogs(UUID projectId, YearMonth yearMonth) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        return dailyLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
    }

    private List<DailyLogEntry> findWorkEntries(List<DailyLog> dailyLogs) {
        List<UUID> dailyLogIds = dailyLogs.stream().map(DailyLog::getId).toList();
        return dailyLogEntryRepository.findByDailyLogIdInAndEntryTypeAndDeletedFalse(
                dailyLogIds, EntryType.WORK_PERFORMED);
    }

    /**
     * Build an index of SpecItem by lowercase name for fuzzy matching.
     */
    private Map<String, SpecItem> buildSpecItemIndex(List<SpecItem> specItems) {
        Map<String, SpecItem> index = new HashMap<>();
        for (SpecItem si : specItems) {
            index.put(si.getName().toLowerCase().trim(), si);
        }
        return index;
    }

    /**
     * Aggregate daily log work entries into volume entries grouped by description + unit.
     * Attempts to match each entry description to a SpecItem for pricing.
     */
    private List<VolumeEntry> aggregateVolumes(List<DailyLogEntry> workEntries, Map<String, SpecItem> specItemIndex) {
        // Group by description + unit
        Map<String, AggregatedWork> aggregation = new HashMap<>();

        for (DailyLogEntry entry : workEntries) {
            String key = (entry.getDescription().trim() + "|" + (entry.getUnit() != null ? entry.getUnit().trim() : "")).toLowerCase();

            aggregation.computeIfAbsent(key, k -> {
                AggregatedWork aw = new AggregatedWork();
                aw.description = entry.getDescription().trim();
                aw.unit = entry.getUnit() != null ? entry.getUnit().trim() : "";
                aw.quantity = BigDecimal.ZERO;

                // Try to match to a SpecItem
                SpecItem matched = specItemIndex.get(entry.getDescription().toLowerCase().trim());
                if (matched != null) {
                    aw.specItemId = matched.getId();
                    aw.unitPrice = calculateUnitPrice(matched);
                    if (aw.unit.isEmpty()) {
                        aw.unit = matched.getUnitOfMeasure();
                    }
                }
                return aw;
            });

            BigDecimal qty = entry.getQuantity() != null ? entry.getQuantity() : BigDecimal.ZERO;
            aggregation.get(key).quantity = aggregation.get(key).quantity.add(qty);
        }

        return aggregation.values().stream()
                .filter(aw -> aw.quantity.compareTo(BigDecimal.ZERO) > 0)
                .map(aw -> {
                    BigDecimal total = aw.unitPrice != null
                            ? aw.quantity.multiply(aw.unitPrice).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return new VolumeEntry(
                            aw.specItemId,
                            aw.description,
                            aw.unit,
                            aw.quantity.setScale(3, RoundingMode.HALF_UP),
                            aw.unitPrice != null ? aw.unitPrice : BigDecimal.ZERO,
                            total
                    );
                })
                .toList();
    }

    /**
     * Calculate unit price from a SpecItem.
     * unitPrice = plannedAmount / quantity (if both are set and quantity > 0).
     */
    private BigDecimal calculateUnitPrice(SpecItem specItem) {
        if (specItem.getPlannedAmount() != null
                && specItem.getQuantity() != null
                && specItem.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            return specItem.getPlannedAmount()
                    .divide(specItem.getQuantity(), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private List<Ks2Line> createKs2Lines(UUID ks2Id, List<VolumeEntry> volumes, BigDecimal vatRate) {
        AtomicInteger sequence = new AtomicInteger(1);
        List<Ks2Line> lines = new ArrayList<>();

        for (VolumeEntry vol : volumes) {
            Ks2Line line = Ks2Line.builder()
                    .ks2Id(ks2Id)
                    .sequence(sequence.getAndIncrement())
                    .specItemId(vol.specItemId())
                    .name(vol.workDescription())
                    .quantity(vol.quantity())
                    .unitPrice(vol.unitPrice())
                    .unitOfMeasure(vol.unit())
                    .vatRate(vatRate)
                    .build();

            line.computeAmount();
            line = ks2LineRepository.save(line);
            auditService.logCreate("Ks2Line", line.getId());
            lines.add(line);
        }

        return lines;
    }

    private String generateDocumentNumber(YearMonth yearMonth) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMM");
        String prefix = "P-" + yearMonth.format(fmt) + "-";
        // Use timestamp suffix for uniqueness
        long suffix = System.currentTimeMillis() % 10000;
        return prefix + String.format("%04d", suffix);
    }

    private String formatYearMonth(YearMonth yearMonth) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM.yyyy");
        return yearMonth.format(fmt);
    }

    private String serializeDailyLogIds(List<UUID> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException e) {
            log.warn("Не удалось сериализовать список ID журналов: {}", e.getMessage());
            return "[]";
        }
    }

    private Project getProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private Contract getContractOrThrow(UUID contractId) {
        return contractRepository.findByIdAndDeletedFalse(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Контракт не найден: " + contractId));
    }

    // Internal aggregation helper
    private static class AggregatedWork {
        String description;
        String unit;
        BigDecimal quantity;
        UUID specItemId;
        BigDecimal unitPrice;
    }
}
