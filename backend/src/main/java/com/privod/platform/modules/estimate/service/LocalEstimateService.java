package com.privod.platform.modules.estimate.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.finance.VatCalculator;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.estimate.domain.CalculationMethod;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import com.privod.platform.modules.estimate.domain.MinstroyIndexImport;
import com.privod.platform.modules.estimate.domain.NormativeSection;
import com.privod.platform.modules.estimate.repository.LocalEstimateLineRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateRepository;
import com.privod.platform.modules.estimate.repository.MinstroyIndexImportRepository;
import com.privod.platform.modules.estimate.repository.NormativeSectionRepository;
import com.privod.platform.modules.estimate.repository.RateResourceItemRepository;
import com.privod.platform.modules.estimate.web.dto.AddEstimateLineRequest;
import com.privod.platform.modules.estimate.web.dto.ApplyMinstroyIndicesRequest;
import com.privod.platform.modules.estimate.web.dto.ApplyMinstroyIndicesResponse;
import com.privod.platform.modules.estimate.web.dto.CreateLocalEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.ImportMinstroyIndicesRequest;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateDetailResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateLineResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateResponse;
import com.privod.platform.modules.estimate.web.dto.MinstroyIndexResponse;
import com.privod.platform.modules.estimate.web.dto.NormativeSectionResponse;
import com.privod.platform.modules.estimate.web.dto.RateResourceItemResponse;
import com.privod.platform.modules.integration.pricing.domain.PriceIndex;
import com.privod.platform.modules.integration.pricing.domain.PriceRate;
import com.privod.platform.modules.integration.pricing.repository.PriceIndexRepository;
import com.privod.platform.modules.integration.pricing.repository.PriceRateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalEstimateService {

    /**
     * МДС 81-33: НР (накладные расходы) = 80% от ФОТ рабочих.
     * Default used when overheadRate is not explicitly set on the estimate.
     */
    private static final BigDecimal DEFAULT_OVERHEAD_RATE = new BigDecimal("0.80");

    /**
     * МДС 81-25: СП (сметная прибыль) = 50% от ОЗП рабочих.
     * Default used when profitRate is not explicitly set on the estimate.
     */
    private static final BigDecimal DEFAULT_PROFIT_RATE = new BigDecimal("0.50");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    /**
     * Maximum allowed price escalation index (500%).
     * Indices exceeding this cap are clamped and a warning is logged.
     */
    private static final BigDecimal MAX_ESCALATION_INDEX = new BigDecimal("5.0");

    /** Returns НР rate (МДС 81-33: 80% от ФОТ). */
    private BigDecimal overheadRate(LocalEstimate estimate) {
        return estimate.getOverheadRate() != null ? estimate.getOverheadRate() : DEFAULT_OVERHEAD_RATE;
    }

    /** Returns СП rate (МДС 81-25: 50% от ОЗП). */
    private BigDecimal profitRate(LocalEstimate estimate) {
        return estimate.getProfitRate() != null ? estimate.getProfitRate() : DEFAULT_PROFIT_RATE;
    }

    private final LocalEstimateRepository estimateRepository;
    private final LocalEstimateLineRepository lineRepository;
    private final NormativeSectionRepository sectionRepository;
    private final RateResourceItemRepository resourceItemRepository;
    private final MinstroyIndexImportRepository importRepository;
    private final PriceRateRepository priceRateRepository;
    private final PriceIndexRepository priceIndexRepository;
    private final AuditService auditService;

    // === Local Estimate CRUD ===

    @Transactional
    public LocalEstimateResponse createEstimate(CreateLocalEstimateRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        LocalEstimate estimate = LocalEstimate.builder()
                .organizationId(organizationId)
                .name(request.name())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .objectName(request.objectName())
                .calculationMethod(request.calculationMethod() != null
                        ? request.calculationMethod() : CalculationMethod.RIM)
                .region(request.region())
                .baseYear(request.baseYear())
                .priceLevelQuarter(request.priceLevelQuarter())
                .status(LocalEstimateStatus.DRAFT)
                .totalDirectCost(BigDecimal.ZERO)
                .totalOverhead(BigDecimal.ZERO)
                .totalEstimatedProfit(BigDecimal.ZERO)
                .totalWithVat(BigDecimal.ZERO)
                .vatRate(VatCalculator.DEFAULT_RATE)
                .build();

        estimate = estimateRepository.save(estimate);
        auditService.logCreate("LocalEstimate", estimate.getId());

        log.info("Локальная смета создана: {} ({})", estimate.getName(), estimate.getId());
        return LocalEstimateResponse.fromEntity(estimate, 0);
    }

    @Transactional(readOnly = true)
    public LocalEstimateDetailResponse getEstimate(UUID id) {
        LocalEstimate estimate = getEstimateOrThrow(id);
        List<LocalEstimateLineResponse> lines = lineRepository
                .findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(id)
                .stream()
                .map(LocalEstimateLineResponse::fromEntity)
                .toList();
        return LocalEstimateDetailResponse.fromEntity(estimate, lines);
    }

    @Transactional(readOnly = true)
    public Page<LocalEstimateResponse> listEstimates(UUID projectId, LocalEstimateStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Page<LocalEstimate> page;
        if (projectId != null) {
            page = estimateRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(
                    organizationId, projectId, pageable);
        } else if (status != null) {
            page = estimateRepository.findByOrganizationIdAndStatusAndDeletedFalse(
                    organizationId, status, pageable);
        } else {
            page = estimateRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);
        }

        return page.map(e -> {
            long lineCount = lineRepository.countByEstimateIdAndDeletedFalse(e.getId());
            return LocalEstimateResponse.fromEntity(e, lineCount);
        });
    }

    // === Estimate Lines ===

    @Transactional
    public LocalEstimateLineResponse addLine(UUID estimateId, AddEstimateLineRequest request) {
        LocalEstimate estimate = getEstimateOrThrow(estimateId);

        int lineNumber = (int) lineRepository.countByEstimateIdAndDeletedFalse(estimateId) + 1;

        LocalEstimateLine line = LocalEstimateLine.builder()
                .estimateId(estimateId)
                .lineNumber(lineNumber)
                .rateId(request.rateId())
                .justification(request.justification())
                .name(request.name())
                .unit(request.unit())
                .quantity(request.quantity())
                .notes(request.notes())
                .normativeCode(request.normativeCode())
                .normHours(request.normHours())
                .basePrice2001(request.basePrice2001())
                .priceIndex(request.priceIndex())
                .currentPrice(request.currentPrice())
                .directCosts(request.directCosts())
                .overheadCosts(request.overheadCosts())
                .estimatedProfit(request.estimatedProfit())
                .budgetItemId(request.budgetItemId())
                .build();

        // If rate is provided, populate base costs from PriceRate
        if (request.rateId() != null) {
            PriceRate rate = priceRateRepository.findById(request.rateId())
                    .filter(r -> !r.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Расценка не найдена: " + request.rateId()));

            BigDecimal qty = request.quantity();
            line.setBaseLaborCost(safeMultiply(rate.getLaborCost(), qty));
            line.setBaseMaterialCost(safeMultiply(rate.getMaterialCost(), qty));
            line.setBaseEquipmentCost(safeMultiply(rate.getEquipmentCost(), qty));
            line.setBaseOverheadCost(safeMultiply(rate.getOverheadCost(), qty));
            line.setBaseTotal(safeMultiply(rate.getTotalCost(), qty));

            // Initially current = base (no index applied)
            line.setCurrentLaborCost(line.getBaseLaborCost());
            line.setCurrentMaterialCost(line.getBaseMaterialCost());
            line.setCurrentEquipmentCost(line.getBaseEquipmentCost());
            line.setCurrentOverheadCost(line.getBaseOverheadCost());
            line.setCurrentTotal(line.getBaseTotal());
            line.setDirectCosts(line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())
                    .setScale(2, RoundingMode.HALF_UP));
            // НР = 80% от ФОТ (МДС 81-33); СП = 50% от ОЗП (МДС 81-25)
            BigDecimal laborCostForLine = line.getCurrentLaborCost();
            line.setOverheadCosts(scale2(laborCostForLine.multiply(overheadRate(estimate))));
            line.setEstimatedProfit(scale2(laborCostForLine.multiply(profitRate(estimate))));

            if (request.justification() == null || request.justification().isBlank()) {
                line.setJustification(rate.getCode());
            }
            if (request.unit() == null || request.unit().isBlank()) {
                line.setUnit(rate.getUnit());
            }
        }

        line = lineRepository.save(line);
        auditService.logCreate("LocalEstimateLine", line.getId());

        log.info("Строка добавлена в локальную смету {}: {} ({})", estimateId, line.getName(), line.getId());
        return LocalEstimateLineResponse.fromEntity(line);
    }

    @Transactional
    public void removeLine(UUID estimateId, UUID lineId) {
        getEstimateOrThrow(estimateId);
        LocalEstimateLine line = lineRepository.findById(lineId)
                .filter(l -> !l.isDeleted() && l.getEstimateId().equals(estimateId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Строка сметы не найдена: " + lineId));

        line.softDelete();
        lineRepository.save(line);
        auditService.logDelete("LocalEstimateLine", lineId);

        log.info("Строка удалена из локальной сметы {}: {}", estimateId, lineId);
    }

    // === Calculation ===

    @Transactional
    public LocalEstimateDetailResponse calculateEstimate(UUID estimateId) {
        LocalEstimate estimate = getEstimateOrThrow(estimateId);
        List<LocalEstimateLine> lines = lineRepository
                .findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(estimateId);
        LocalEstimateStatus oldStatus = estimate.getStatus();

        String region = estimate.getRegion();
        String targetQuarter = estimate.getPriceLevelQuarter();

        BigDecimal totalDirectCost = BigDecimal.ZERO;
        BigDecimal totalOverhead = BigDecimal.ZERO;
        BigDecimal totalEstimatedProfitAcc = BigDecimal.ZERO;

        // P1-EST-3: BASIS_INDEX method — single scalar factor applied uniformly to all cost components.
        // МДС 81-35.2004: текущая цена = базисная цена 2001 × индекс пересчёта.
        boolean isBasisIndex = estimate.getCalculationMethod() == CalculationMethod.BASIS_INDEX;
        BigDecimal basisIndexFactor = null;
        if (isBasisIndex) {
            basisIndexFactor = estimate.getIndexFactor() != null
                    ? estimate.getIndexFactor()
                    : new BigDecimal("8.0000");
            log.info("Локальная смета {}: метод BASIS_INDEX, коэффициент индексации = {}",
                    estimate.getId(), basisIndexFactor);
        }

        for (LocalEstimateLine line : lines) {
            BigDecimal laborIdx;
            BigDecimal materialIdx;
            BigDecimal equipmentIdx;

            if (isBasisIndex) {
                // BASIS_INDEX: single index factor applied uniformly to all base-2001 cost components
                laborIdx = basisIndexFactor;
                materialIdx = basisIndexFactor;
                equipmentIdx = basisIndexFactor;
            } else {
                // RIM method: separate indices per cost type from Minstroy PriceIndex registry
                laborIdx = resolveIndex(region, targetQuarter, "СМР", "construction");
                materialIdx = resolveIndex(region, targetQuarter, "Материалы", "materials");
                equipmentIdx = resolveIndex(region, targetQuarter, "Машины", "equipment");
            }

            line.setLaborIndex(laborIdx);
            line.setMaterialIndex(materialIdx);
            line.setEquipmentIndex(equipmentIdx);

            // current = base * index (same formula for both RIM and BASIS_INDEX)
            line.setCurrentLaborCost(scale2(line.getBaseLaborCost().multiply(laborIdx)));
            line.setCurrentMaterialCost(scale2(line.getBaseMaterialCost().multiply(materialIdx)));
            line.setCurrentEquipmentCost(scale2(line.getBaseEquipmentCost().multiply(equipmentIdx)));
            line.setCurrentOverheadCost(scale2(line.getBaseOverheadCost().multiply(laborIdx)));

            BigDecimal currentTotal = line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())
                    .add(line.getCurrentOverheadCost());
            line.setCurrentTotal(scale2(currentTotal));
            line.setDirectCosts(scale2(line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())));
            // НР = 80% от ФОТ (МДС 81-33); СП = 50% от ОЗП (МДС 81-25)
            BigDecimal laborCost = line.getCurrentLaborCost();
            line.setOverheadCosts(scale2(laborCost.multiply(overheadRate(estimate))));
            line.setEstimatedProfit(scale2(laborCost.multiply(profitRate(estimate))));
            line.setPriceIndex(laborIdx);
            if (line.getQuantity() != null && line.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                line.setCurrentPrice(scale2(line.getCurrentTotal()
                        .divide(line.getQuantity(), 2, RoundingMode.HALF_UP)));
            } else {
                line.setCurrentPrice(scale2(line.getCurrentTotal()));
            }

            lineRepository.save(line);

            totalDirectCost = totalDirectCost.add(line.getDirectCosts());
            totalOverhead = totalOverhead.add(line.getOverheadCosts());
            totalEstimatedProfitAcc = totalEstimatedProfitAcc.add(line.getEstimatedProfit());
        }

        // МДС 81-25: СП уже накоплена по строкам как 50% от ФОТ каждой строки
        BigDecimal totalEstimatedProfit = scale2(totalEstimatedProfitAcc);

        BigDecimal subtotal = totalDirectCost.add(totalOverhead).add(totalEstimatedProfit);
        BigDecimal vatAmount = scale2(subtotal.multiply(estimate.getVatRate())
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP));
        BigDecimal totalWithVat = scale2(subtotal.add(vatAmount));

        estimate.setTotalDirectCost(scale2(totalDirectCost));
        estimate.setTotalOverhead(scale2(totalOverhead));
        estimate.setTotalEstimatedProfit(totalEstimatedProfit);
        estimate.setTotalWithVat(totalWithVat);
        transitionEstimateStatus(estimate, LocalEstimateStatus.CALCULATED);
        estimate.setCalculatedAt(Instant.now());

        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("LocalEstimate", estimate.getId(),
                oldStatus.name(), LocalEstimateStatus.CALCULATED.name());

        log.info("Локальная смета рассчитана: {} ({}) — итого с НДС: {}",
                estimate.getName(), estimate.getId(), totalWithVat);

        List<LocalEstimateLineResponse> lineResponses = lines.stream()
                .map(LocalEstimateLineResponse::fromEntity)
                .toList();
        return LocalEstimateDetailResponse.fromEntity(estimate, lineResponses);
    }

    @Transactional
    public LocalEstimateResponse approveEstimate(UUID estimateId) {
        LocalEstimate estimate = getEstimateOrThrow(estimateId);

        if (estimate.getStatus() != LocalEstimateStatus.CALCULATED
                || !estimate.getStatus().canTransitionTo(LocalEstimateStatus.APPROVED)) {
            throw new IllegalStateException(
                    "Смета может быть утверждена только из статуса CALCULATED. Текущий статус: "
                            + estimate.getStatus());
        }

        LocalEstimateStatus oldStatus = estimate.getStatus();
        transitionEstimateStatus(estimate, LocalEstimateStatus.APPROVED);
        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("LocalEstimate", estimate.getId(),
                oldStatus.name(), LocalEstimateStatus.APPROVED.name());

        long lineCount = lineRepository.countByEstimateIdAndDeletedFalse(estimateId);
        log.info("Локальная смета утверждена: {} ({})", estimate.getName(), estimate.getId());
        return LocalEstimateResponse.fromEntity(estimate, lineCount);
    }

    @Transactional
    public void deleteEstimate(UUID id) {
        LocalEstimate estimate = getEstimateOrThrow(id);
        if (estimate.getStatus() != LocalEstimateStatus.ARCHIVED) {
            transitionEstimateStatus(estimate, LocalEstimateStatus.ARCHIVED);
        }
        estimate.softDelete();
        estimateRepository.save(estimate);
        auditService.logDelete("LocalEstimate", id);
        log.info("Локальная смета удалена: {} ({})", estimate.getName(), id);
    }

    // === Minstroy Index Import ===

    @Transactional
    public int importMinstroyIndices(ImportMinstroyIndicesRequest request) {
        int count = 0;
        int duplicates = 0;
        String normalizedQuarter = request.normalizedQuarter();

        for (ImportMinstroyIndicesRequest.IndexEntry entry : request.entries()) {
            String baseQuarter = normalizeQuarter(entry.baseQuarter(), normalizedQuarter);
            String targetQuarter = normalizeQuarter(normalizedQuarter, normalizedQuarter);
            String workType = normalizeWorkType(entry.workType());

            if (entry.region() == null || entry.region().isBlank() || entry.indexValue() == null) {
                continue;
            }

            boolean exists = priceIndexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    entry.region().trim(),
                    workType,
                    baseQuarter,
                    targetQuarter
            );
            if (exists) {
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

            priceIndexRepository.save(index);
            count++;
        }

        MinstroyIndexImport importRecord = MinstroyIndexImport.builder()
                .quarter(normalizedQuarter)
                .importSource(request.source())
                .importDate(Instant.now())
                .indicesCount(count)
                .status("COMPLETED")
                .build();

        importRepository.save(importRecord);
        auditService.logCreate("MinstroyIndexImport", importRecord.getId());

        log.info("Импортировано {} индексов Минстроя за квартал {} (duplicates={})",
                count, normalizedQuarter, duplicates);
        return count;
    }

    @Transactional(readOnly = true)
    public List<MinstroyIndexResponse> getMinstroyIndices(String region, int quarter, int year) {
        String targetQuarter = year + "-Q" + quarter;
        List<PriceIndex> indices;
        if (region != null && !region.isBlank()) {
            indices = priceIndexRepository.findByRegionAndDeletedFalse(region.trim())
                    .stream()
                    .filter(i -> targetQuarter.equalsIgnoreCase(i.getTargetQuarter()))
                    .toList();
        } else {
            indices = priceIndexRepository.findByTargetQuarter(targetQuarter)
                    .stream()
                    .filter(i -> !i.isDeleted())
                    .toList();
        }

        return indices.stream()
                .map(i -> new MinstroyIndexResponse(
                        i.getRegion(),
                        quarter,
                        year,
                        mapWorkTypeToIndexType(i.getWorkType()),
                        i.getIndexValue().doubleValue()
                ))
                .toList();
    }

    @Transactional
    public ApplyMinstroyIndicesResponse applyMinstroyIndices(UUID estimateId, ApplyMinstroyIndicesRequest request) {
        LocalEstimate estimate = getEstimateOrThrow(estimateId);
        List<LocalEstimateLine> lines = lineRepository.findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(estimateId);
        if (lines.isEmpty() || request.indices().isEmpty()) {
            return new ApplyMinstroyIndicesResponse(estimateId, 0, List.of());
        }

        String estimateRegion = estimate.getRegion();
        ApplyMinstroyIndicesRequest.IndexItem fallbackIndex = request.indices().get(0);
        ApplyMinstroyIndicesRequest.IndexItem preferredIndex = request.indices().stream()
                .filter(i -> estimateRegion != null && estimateRegion.equalsIgnoreCase(i.region()))
                .findFirst()
                .orElse(fallbackIndex);

        BigDecimal factor = BigDecimal.valueOf(preferredIndex.value());
        List<ApplyMinstroyIndicesResponse.ItemResult> results = new java.util.ArrayList<>();

        for (LocalEstimateLine line : lines) {
            BigDecimal oldPrice = scale2(line.getCurrentTotal());
            line.setLaborIndex(factor);
            line.setMaterialIndex(factor);
            line.setEquipmentIndex(factor);
            line.setCurrentLaborCost(scale2(line.getBaseLaborCost().multiply(factor)));
            line.setCurrentMaterialCost(scale2(line.getBaseMaterialCost().multiply(factor)));
            line.setCurrentEquipmentCost(scale2(line.getBaseEquipmentCost().multiply(factor)));
            line.setCurrentOverheadCost(scale2(line.getBaseOverheadCost().multiply(factor)));
            line.setCurrentTotal(scale2(line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())
                    .add(line.getCurrentOverheadCost())));
            line.setDirectCosts(scale2(line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())));
            // НР = 80% от ФОТ (МДС 81-33); СП = 50% от ОЗП (МДС 81-25)
            BigDecimal laborCostApply = line.getCurrentLaborCost();
            line.setOverheadCosts(scale2(laborCostApply.multiply(overheadRate(estimate))));
            line.setEstimatedProfit(scale2(laborCostApply.multiply(profitRate(estimate))));
            line.setPriceIndex(factor);

            if (line.getQuantity() != null && line.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                line.setCurrentPrice(scale2(line.getCurrentTotal()
                        .divide(line.getQuantity(), 2, RoundingMode.HALF_UP)));
            } else {
                line.setCurrentPrice(scale2(line.getCurrentTotal()));
            }

            lineRepository.save(line);

            results.add(new ApplyMinstroyIndicesResponse.ItemResult(
                    line.getName(),
                    oldPrice.doubleValue(),
                    line.getCurrentTotal().doubleValue(),
                    factor.doubleValue()
            ));
        }

        recalculateEstimateTotalsFromLines(estimate, lines);
        transitionEstimateStatus(estimate, LocalEstimateStatus.CALCULATED);
        estimate.setCalculatedAt(Instant.now());
        estimateRepository.save(estimate);

        return new ApplyMinstroyIndicesResponse(estimateId, request.indices().size(), results);
    }

    // === Normative Data ===

    @Transactional(readOnly = true)
    public List<NormativeSectionResponse> getNormativeSections(UUID databaseId, UUID parentId) {
        List<NormativeSection> sections;
        if (parentId != null) {
            sections = sectionRepository.findByDatabaseIdAndParentIdAndDeletedFalse(databaseId, parentId);
        } else {
            sections = sectionRepository.findByDatabaseIdAndParentIdIsNullAndDeletedFalse(databaseId);
        }
        return sections.stream()
                .map(NormativeSectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RateResourceItemResponse> getRateResources(UUID rateId) {
        return resourceItemRepository.findByRateIdAndDeletedFalse(rateId)
                .stream()
                .map(RateResourceItemResponse::fromEntity)
                .toList();
    }

    // === Private helpers ===

    private LocalEstimate getEstimateOrThrow(UUID id) {
        return estimateRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Локальная смета не найдена: " + id));
    }

    private BigDecimal resolveIndex(String region, String targetQuarter, String... workTypeFallbacks) {
        if (targetQuarter == null || targetQuarter.isBlank()) {
            return BigDecimal.ONE;
        }

        BigDecimal rawIndex = null;

        if (region != null && !region.isBlank()) {
            for (String workType : workTypeFallbacks) {
                Optional<PriceIndex> regional = priceIndexRepository
                        .findByRegionAndWorkTypeAndTargetQuarter(region.trim(), workType, targetQuarter);
                if (regional.isPresent()) {
                    rawIndex = regional.get().getIndexValue();
                    break;
                }
            }
        }

        if (rawIndex == null) {
            List<PriceIndex> targetQuarterIndices = priceIndexRepository.findByTargetQuarter(targetQuarter)
                    .stream()
                    .filter(i -> !i.isDeleted())
                    .toList();
            for (String workType : workTypeFallbacks) {
                Optional<PriceIndex> anyRegion = targetQuarterIndices.stream()
                        .filter(i -> i.getWorkType().equalsIgnoreCase(workType))
                        .findFirst();
                if (anyRegion.isPresent()) {
                    rawIndex = anyRegion.get().getIndexValue();
                    break;
                }
            }
        }

        if (rawIndex == null) {
            return BigDecimal.ONE;
        }

        // Cap the escalation index to prevent unreasonable price inflation
        if (rawIndex.compareTo(MAX_ESCALATION_INDEX) > 0) {
            log.warn("Escalation index {} exceeds maximum allowed {} for region={}, quarter={}. Capping to {}.",
                    rawIndex, MAX_ESCALATION_INDEX, region, targetQuarter, MAX_ESCALATION_INDEX);
            return MAX_ESCALATION_INDEX;
        }

        return rawIndex;
    }

    private BigDecimal safeMultiply(BigDecimal value, BigDecimal multiplier) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private void transitionEstimateStatus(LocalEstimate estimate, LocalEstimateStatus targetStatus) {
        LocalEstimateStatus current = estimate.getStatus();
        if (current == targetStatus) {
            return;
        }
        if (!current.canTransitionTo(targetStatus)) {
            throw new IllegalStateException("Недопустимый переход статуса локальной сметы: "
                    + current + " -> " + targetStatus);
        }
        estimate.setStatus(targetStatus);
    }

    private void recalculateEstimateTotalsFromLines(LocalEstimate estimate, List<LocalEstimateLine> lines) {
        BigDecimal totalDirect = BigDecimal.ZERO;
        BigDecimal totalOverhead = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;
        for (LocalEstimateLine line : lines) {
            totalDirect = totalDirect.add(line.getDirectCosts() != null
                    ? line.getDirectCosts()
                    : line.getCurrentLaborCost().add(line.getCurrentMaterialCost()).add(line.getCurrentEquipmentCost()));
            totalOverhead = totalOverhead.add(line.getOverheadCosts() != null
                    ? line.getOverheadCosts()
                    : line.getCurrentOverheadCost());
            // МДС 81-25: СП уже накоплена по строкам как 50% от ФОТ
            totalProfit = totalProfit.add(line.getEstimatedProfit() != null
                    ? line.getEstimatedProfit()
                    : BigDecimal.ZERO);
        }

        BigDecimal totalEstimatedProfit = scale2(totalProfit);
        BigDecimal subtotal = totalDirect.add(totalOverhead).add(totalEstimatedProfit);
        BigDecimal vatAmount = scale2(subtotal.multiply(estimate.getVatRate())
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP));
        BigDecimal totalWithVat = scale2(subtotal.add(vatAmount));

        estimate.setTotalDirectCost(scale2(totalDirect));
        estimate.setTotalOverhead(scale2(totalOverhead));
        estimate.setTotalEstimatedProfit(totalEstimatedProfit);
        estimate.setTotalWithVat(totalWithVat);
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
            case "installation", "монтаж" -> "Монтаж";
            default -> normalized;
        };
    }

    private String normalizeQuarter(String rawQuarter, String fallbackQuarter) {
        String value = (rawQuarter == null || rawQuarter.isBlank()) ? fallbackQuarter : rawQuarter;
        if (value == null || value.isBlank()) {
            return null;
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

    private String mapWorkTypeToIndexType(String workType) {
        if (workType == null) {
            return "construction";
        }
        return switch (workType.toLowerCase()) {
            case "материалы", "materials" -> "materials";
            case "машины", "механизмы", "equipment" -> "equipment";
            case "монтаж", "installation" -> "installation";
            default -> "construction";
        };
    }
}
