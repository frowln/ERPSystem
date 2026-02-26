package com.privod.platform.modules.integration.pricing.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.pricing.domain.PriceIndex;
import com.privod.platform.modules.integration.pricing.domain.PriceRate;
import com.privod.platform.modules.integration.pricing.domain.PricingDatabase;
import com.privod.platform.modules.integration.pricing.repository.PriceIndexRepository;
import com.privod.platform.modules.integration.pricing.repository.PriceRateRepository;
import com.privod.platform.modules.integration.pricing.repository.PricingDatabaseRepository;
import com.privod.platform.modules.integration.pricing.web.dto.CreatePriceIndexRequest;
import com.privod.platform.modules.integration.pricing.web.dto.CreatePricingDatabaseRequest;
import com.privod.platform.modules.integration.pricing.web.dto.ImportQuarterlyPriceIndicesRequest;
import com.privod.platform.modules.integration.pricing.web.dto.PriceCalculationResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PriceIndexResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PricingImportReportResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PriceRateResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PricingDatabaseResponse;
import com.privod.platform.modules.integration.pricing.web.dto.QuarterlyIndexImportResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {

    private final PricingDatabaseRepository databaseRepository;
    private final PriceRateRepository rateRepository;
    private final PriceIndexRepository indexRepository;
    private final AuditService auditService;

    // === Pricing Database CRUD ===

    @Transactional(readOnly = true)
    public Page<PricingDatabaseResponse> listDatabases(Pageable pageable) {
        return databaseRepository.findByDeletedFalse(pageable)
                .map(PricingDatabaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PricingDatabaseResponse getDatabase(UUID id) {
        PricingDatabase db = getDatabaseOrThrow(id);
        return PricingDatabaseResponse.fromEntity(db);
    }

    @Transactional
    public PricingDatabaseResponse createDatabase(CreatePricingDatabaseRequest request) {
        if (databaseRepository.existsByNameAndDeletedFalse(request.name())) {
            throw new IllegalArgumentException("База расценок с названием '" + request.name() + "' уже существует");
        }

        PricingDatabase db = PricingDatabase.builder()
                .name(request.name())
                .type(request.type())
                .region(request.region())
                .baseYear(request.baseYear())
                .coefficientToCurrentPrices(request.coefficientToCurrentPrices())
                .effectiveFrom(request.effectiveFrom())
                .effectiveTo(request.effectiveTo())
                .sourceUrl(request.sourceUrl())
                .active(request.active() != null ? request.active() : true)
                .build();

        db = databaseRepository.save(db);
        auditService.logCreate("PricingDatabase", db.getId());

        log.info("База расценок создана: {} ({}) - {} {}",
                db.getName(), db.getId(), db.getType(), db.getRegion());
        return PricingDatabaseResponse.fromEntity(db);
    }

    @Transactional
    public void deleteDatabase(UUID id) {
        PricingDatabase db = getDatabaseOrThrow(id);
        db.softDelete();
        databaseRepository.save(db);
        auditService.logDelete("PricingDatabase", id);
        log.info("База расценок удалена: {} ({})", db.getName(), id);
    }

    // === Rate Search ===

    @Transactional(readOnly = true)
    public Page<PriceRateResponse> searchRates(String query, UUID databaseId, Pageable pageable) {
        if (databaseId != null && query != null && !query.isBlank()) {
            return rateRepository.searchByDatabaseAndQuery(databaseId, query.trim(), pageable)
                    .map(PriceRateResponse::fromEntity);
        }
        if (databaseId != null) {
            return rateRepository.findByDatabaseIdAndDeletedFalse(databaseId, pageable)
                    .map(PriceRateResponse::fromEntity);
        }
        if (query != null && !query.isBlank()) {
            return rateRepository.searchByQuery(query.trim(), pageable)
                    .map(PriceRateResponse::fromEntity);
        }
        return Page.empty(pageable);
    }

    @Transactional(readOnly = true)
    public PriceRateResponse getRateById(UUID id) {
        PriceRate rate = getRateOrThrow(id);
        return PriceRateResponse.fromEntity(rate);
    }

    @Transactional(readOnly = true)
    public PriceRateResponse getRateByCode(String code) {
        PriceRate rate = rateRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Расценка с кодом '" + code + "' не найдена"));
        return PriceRateResponse.fromEntity(rate);
    }

    // === Price Calculation ===

    @Transactional(readOnly = true)
    public PriceCalculationResponse calculateCurrentPrice(UUID rateId, BigDecimal quantity, String region) {
        PriceRate rate = getRateOrThrow(rateId);
        PricingDatabase db = getDatabaseOrThrow(rate.getDatabaseId());

        BigDecimal baseTotal = rate.getTotalCost() != null
                ? rate.getTotalCost().multiply(quantity)
                : BigDecimal.ZERO;

        // Try to find the latest price index for this region
        String targetRegion = region != null ? region : db.getRegion();
        String currentQuarter = getCurrentQuarter();

        BigDecimal indexValue = BigDecimal.ONE;
        String indexQuarter = null;

        if (targetRegion != null) {
            var indexOpt = indexRepository.findByRegionAndWorkTypeAndTargetQuarter(
                    targetRegion, "СМР", currentQuarter);
            if (indexOpt.isPresent()) {
                indexValue = indexOpt.get().getIndexValue();
                indexQuarter = indexOpt.get().getTargetQuarter();
            }
        }

        // Also apply database coefficient if available
        if (db.getCoefficientToCurrentPrices() != null) {
            indexValue = indexValue.multiply(db.getCoefficientToCurrentPrices());
        }

        BigDecimal currentPricePerUnit = rate.getTotalCost() != null
                ? rate.getTotalCost().multiply(indexValue).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal currentTotal = currentPricePerUnit.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

        return new PriceCalculationResponse(
                rate.getId(),
                rate.getCode(),
                rate.getName(),
                rate.getUnit(),
                quantity,
                rate.getTotalCost(),
                baseTotal.setScale(2, RoundingMode.HALF_UP),
                targetRegion,
                indexValue.setScale(4, RoundingMode.HALF_UP),
                indexQuarter,
                currentPricePerUnit,
                currentTotal,
                scaleAndMultiply(rate.getLaborCost(), quantity, indexValue),
                scaleAndMultiply(rate.getMaterialCost(), quantity, indexValue),
                scaleAndMultiply(rate.getEquipmentCost(), quantity, indexValue),
                scaleAndMultiply(rate.getOverheadCost(), quantity, indexValue)
        );
    }

    // === Price Indices ===

    @Transactional(readOnly = true)
    public Page<PriceIndexResponse> getIndices(String region, String workType, Pageable pageable) {
        return indexRepository.findByFilters(region, workType, pageable)
                .map(PriceIndexResponse::fromEntity);
    }

    @Transactional
    public PriceIndexResponse createIndex(CreatePriceIndexRequest request) {
        if (indexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                request.region(),
                request.workType(),
                request.baseQuarter(),
                request.targetQuarter())) {
            throw new IllegalArgumentException("Индекс с такой комбинацией region/workType/baseQuarter/targetQuarter уже существует");
        }

        PriceIndex index = PriceIndex.builder()
                .region(request.region())
                .workType(request.workType())
                .baseQuarter(request.baseQuarter())
                .targetQuarter(request.targetQuarter())
                .indexValue(request.indexValue())
                .source(request.source())
                .build();

        index = indexRepository.save(index);
        auditService.logCreate("PriceIndex", index.getId());

        log.info("Индекс пересчёта создан: {} {} {} -> {} = {}",
                index.getRegion(), index.getWorkType(),
                index.getBaseQuarter(), index.getTargetQuarter(), index.getIndexValue());
        return PriceIndexResponse.fromEntity(index);
    }

    @Transactional
    public QuarterlyIndexImportResponse importQuarterlyIndices(ImportQuarterlyPriceIndicesRequest request) {
        int imported = 0;
        int duplicates = 0;
        int skipped = 0;

        for (ImportQuarterlyPriceIndicesRequest.IndexEntry entry : request.entries()) {
            String workType = normalizeWorkType(entry.workType());
            String baseQuarter = normalizeQuarter(entry.baseQuarter(), request.quarter());
            String targetQuarter = normalizeQuarter(request.quarter(), request.quarter());

            if (entry.region() == null || entry.region().isBlank() || entry.indexValue() == null) {
                skipped++;
                continue;
            }

            boolean duplicate = indexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    entry.region().trim(),
                    workType,
                    baseQuarter,
                    targetQuarter
            );

            if (duplicate) {
                duplicates++;
                continue;
            }

            PriceIndex index = PriceIndex.builder()
                    .region(entry.region().trim())
                    .workType(workType)
                    .baseQuarter(baseQuarter)
                    .targetQuarter(targetQuarter)
                    .indexValue(entry.indexValue())
                    .source(request.source())
                    .build();
            indexRepository.save(index);
            imported++;
        }

        log.info("Квартальный импорт индексов: quarter={}, imported={}, duplicates={}, skipped={}",
                request.quarter(), imported, duplicates, skipped);

        return new QuarterlyIndexImportResponse(
                normalizeQuarter(request.quarter(), request.quarter()),
                request.entries().size(),
                imported,
                duplicates,
                skipped
        );
    }

    // === CSV Import ===

    @Transactional
    public int importRatesFromCsv(UUID databaseId, InputStream inputStream) {
        return importRatesWithReport(databaseId, inputStream).importedRows();
    }

    @Transactional
    public PricingImportReportResponse importRatesWithReport(UUID databaseId, InputStream inputStream) {
        getDatabaseOrThrow(databaseId);

        List<PriceRate> ratesToPersist = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int lineNumber = 0;
        int totalRows = 0;
        int duplicateRows = 0;
        int skippedRows = 0;
        int errorRows = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine(); // skip header
            if (headerLine == null) {
                throw new IllegalArgumentException("CSV-файл пуст");
            }
            lineNumber++;

            String line;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                totalRows++;
                if (line.isBlank()) {
                    skippedRows++;
                    continue;
                }

                try {
                    String[] fields = line.split(";", -1);
                    if (fields.length < 6) {
                        log.warn("Пропуск строки {} в CSV: недостаточно полей ({})", lineNumber, fields.length);
                        skippedRows++;
                        continue;
                    }

                    String code = fields[0].trim();
                    if (code.isBlank()) {
                        skippedRows++;
                        continue;
                    }

                    if (rateRepository.existsByDatabaseIdAndCodeAndDeletedFalse(databaseId, code)) {
                        duplicateRows++;
                        continue;
                    }

                    PriceRate rate = PriceRate.builder()
                            .databaseId(databaseId)
                            .code(code)
                            .name(fields[1].trim())
                            .unit(fields[2].trim())
                            .laborCost(parseBigDecimal(fields[3]))
                            .materialCost(parseBigDecimal(fields[4]))
                            .equipmentCost(parseBigDecimal(fields[5]))
                            .overheadCost(fields.length > 6 ? parseBigDecimal(fields[6]) : BigDecimal.ZERO)
                            .totalCost(fields.length > 7 ? parseBigDecimal(fields[7]) : calculateTotal(fields))
                            .category(fields.length > 8 ? fields[8].trim() : null)
                            .subcategory(fields.length > 9 ? fields[9].trim() : null)
                            .build();

                    ratesToPersist.add(rate);
                } catch (Exception e) {
                    log.warn("Ошибка парсинга строки {} в CSV: {}", lineNumber, e.getMessage());
                    errorRows++;
                    errors.add("Строка " + lineNumber + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Ошибка чтения CSV-файла: " + e.getMessage(), e);
        }

        if (!ratesToPersist.isEmpty()) {
            rateRepository.saveAll(ratesToPersist);
            log.info("Импортировано {} расценок в базу {}", ratesToPersist.size(), databaseId);
        }

        return new PricingImportReportResponse(
                databaseId,
                "CSV",
                totalRows,
                ratesToPersist.size(),
                duplicateRows,
                skippedRows,
                errorRows,
                errors
        );
    }

    // === Export ===

    @Transactional(readOnly = true)
    public byte[] exportRatesToExcel(UUID databaseId) {
        getDatabaseOrThrow(databaseId);

        // Build CSV content as a simple export format
        StringBuilder sb = new StringBuilder();
        sb.append("Код;Название;Единица;Затраты труда;Материалы;Оборудование;Накладные;Итого;Категория;Подкатегория\n");

        int page = 0;
        int pageSize = 500;
        Page<PriceRate> ratePage;
        do {
            ratePage = rateRepository.findByDatabaseIdAndDeletedFalse(
                    databaseId, Pageable.ofSize(pageSize).withPage(page));
            for (PriceRate rate : ratePage.getContent()) {
                sb.append(csvValue(rate.getCode())).append(";");
                sb.append(csvValue(rate.getName())).append(";");
                sb.append(csvValue(rate.getUnit())).append(";");
                sb.append(bdToString(rate.getLaborCost())).append(";");
                sb.append(bdToString(rate.getMaterialCost())).append(";");
                sb.append(bdToString(rate.getEquipmentCost())).append(";");
                sb.append(bdToString(rate.getOverheadCost())).append(";");
                sb.append(bdToString(rate.getTotalCost())).append(";");
                sb.append(csvValue(rate.getCategory())).append(";");
                sb.append(csvValue(rate.getSubcategory())).append("\n");
            }
            page++;
        } while (ratePage.hasNext());

        log.info("Экспортировано расценок из базы {}: {} записей", databaseId, ratePage.getTotalElements());
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // === Private helpers ===

    private PricingDatabase getDatabaseOrThrow(UUID id) {
        return databaseRepository.findById(id)
                .filter(db -> !db.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("База расценок не найдена: " + id));
    }

    private PriceRate getRateOrThrow(UUID id) {
        return rateRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Расценка не найдена: " + id));
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        String cleaned = value.trim().replace(",", ".").replace(" ", "");
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal calculateTotal(String[] fields) {
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 3; i <= Math.min(6, fields.length - 1); i++) {
            total = total.add(parseBigDecimal(fields[i]));
        }
        return total;
    }

    private BigDecimal scaleAndMultiply(BigDecimal value, BigDecimal quantity, BigDecimal index) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.multiply(quantity).multiply(index).setScale(2, RoundingMode.HALF_UP);
    }

    private String getCurrentQuarter() {
        int year = Year.now().getValue();
        int month = LocalDate.now().getMonthValue();
        int quarter = (month - 1) / 3 + 1;
        return year + "-Q" + quarter;
    }

    private String csvValue(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String bdToString(BigDecimal value) {
        return value != null ? value.toPlainString() : "0";
    }

    private String normalizeWorkType(String rawWorkType) {
        if (rawWorkType == null || rawWorkType.isBlank()) {
            return "СМР";
        }
        String normalized = rawWorkType.trim();
        return switch (normalized.toLowerCase()) {
            case "construction", "смр" -> "СМР";
            case "materials", "материалы" -> "Материалы";
            case "equipment", "машины", "механизмы" -> "Машины";
            default -> normalized;
        };
    }

    private String normalizeQuarter(String rawQuarter, String fallbackQuarter) {
        String value = (rawQuarter == null || rawQuarter.isBlank())
                ? fallbackQuarter
                : rawQuarter;
        if (value == null || value.isBlank()) {
            return getCurrentQuarter();
        }

        String normalized = value.trim().toUpperCase();
        if (normalized.matches("\\d{4}-Q[1-4]")) {
            return normalized;
        }
        if (normalized.matches("\\d{4}/Q[1-4]")) {
            return normalized.replace('/', '-');
        }
        if (normalized.matches("[1-4]Q\\d{4}")) {
            return normalized.substring(2) + "-Q" + normalized.charAt(0);
        }
        if (normalized.matches("\\d{4}[- ]?[1-4]")) {
            String year = normalized.substring(0, 4);
            char q = normalized.charAt(normalized.length() - 1);
            return year + "-Q" + q;
        }
        return normalized;
    }
}
