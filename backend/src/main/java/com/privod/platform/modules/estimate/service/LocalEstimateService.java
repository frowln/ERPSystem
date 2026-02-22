package com.privod.platform.modules.estimate.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.estimate.domain.CalculationMethod;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import com.privod.platform.modules.estimate.domain.MinstroyIndexImport;
import com.privod.platform.modules.estimate.domain.NormativeSection;
import com.privod.platform.modules.estimate.domain.RateResourceItem;
import com.privod.platform.modules.estimate.repository.LocalEstimateLineRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateRepository;
import com.privod.platform.modules.estimate.repository.MinstroyIndexImportRepository;
import com.privod.platform.modules.estimate.repository.NormativeSectionRepository;
import com.privod.platform.modules.estimate.repository.RateResourceItemRepository;
import com.privod.platform.modules.estimate.web.dto.AddEstimateLineRequest;
import com.privod.platform.modules.estimate.web.dto.CreateLocalEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.ImportMinstroyIndicesRequest;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateDetailResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateLineResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateResponse;
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

    private static final BigDecimal ESTIMATED_PROFIT_PERCENT = new BigDecimal("0.08");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

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
                .vatRate(new BigDecimal("20.00"))
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

        String region = estimate.getRegion();
        String targetQuarter = estimate.getPriceLevelQuarter();

        BigDecimal totalDirectCost = BigDecimal.ZERO;
        BigDecimal totalOverhead = BigDecimal.ZERO;

        for (LocalEstimateLine line : lines) {
            // Look up indices for the line
            BigDecimal laborIdx = findIndex(region, "СМР", targetQuarter);
            BigDecimal materialIdx = findIndex(region, "Материалы", targetQuarter);
            BigDecimal equipmentIdx = findIndex(region, "Машины", targetQuarter);

            // If specific index not found, try general СМР index for all
            if (materialIdx.compareTo(BigDecimal.ONE) == 0) {
                materialIdx = laborIdx;
            }
            if (equipmentIdx.compareTo(BigDecimal.ONE) == 0) {
                equipmentIdx = laborIdx;
            }

            line.setLaborIndex(laborIdx);
            line.setMaterialIndex(materialIdx);
            line.setEquipmentIndex(equipmentIdx);

            // RIM method: current = base * index
            line.setCurrentLaborCost(scale2(line.getBaseLaborCost().multiply(laborIdx)));
            line.setCurrentMaterialCost(scale2(line.getBaseMaterialCost().multiply(materialIdx)));
            line.setCurrentEquipmentCost(scale2(line.getBaseEquipmentCost().multiply(equipmentIdx)));
            line.setCurrentOverheadCost(scale2(line.getBaseOverheadCost().multiply(laborIdx)));

            BigDecimal currentTotal = line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost())
                    .add(line.getCurrentOverheadCost());
            line.setCurrentTotal(scale2(currentTotal));

            lineRepository.save(line);

            BigDecimal directForLine = line.getCurrentLaborCost()
                    .add(line.getCurrentMaterialCost())
                    .add(line.getCurrentEquipmentCost());
            totalDirectCost = totalDirectCost.add(directForLine);
            totalOverhead = totalOverhead.add(line.getCurrentOverheadCost());
        }

        // Estimated profit = percentage of direct costs
        BigDecimal totalEstimatedProfit = scale2(totalDirectCost.multiply(ESTIMATED_PROFIT_PERCENT));

        BigDecimal subtotal = totalDirectCost.add(totalOverhead).add(totalEstimatedProfit);
        BigDecimal vatAmount = scale2(subtotal.multiply(estimate.getVatRate())
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP));
        BigDecimal totalWithVat = scale2(subtotal.add(vatAmount));

        estimate.setTotalDirectCost(scale2(totalDirectCost));
        estimate.setTotalOverhead(scale2(totalOverhead));
        estimate.setTotalEstimatedProfit(totalEstimatedProfit);
        estimate.setTotalWithVat(totalWithVat);
        estimate.setStatus(LocalEstimateStatus.CALCULATED);
        estimate.setCalculatedAt(Instant.now());

        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("LocalEstimate", estimate.getId(), "DRAFT", "CALCULATED");

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

        if (estimate.getStatus() != LocalEstimateStatus.CALCULATED) {
            throw new IllegalStateException(
                    "Смета может быть утверждена только из статуса CALCULATED. Текущий статус: "
                            + estimate.getStatus());
        }

        LocalEstimateStatus oldStatus = estimate.getStatus();
        estimate.setStatus(LocalEstimateStatus.APPROVED);
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
        estimate.softDelete();
        estimateRepository.save(estimate);
        auditService.logDelete("LocalEstimate", id);
        log.info("Локальная смета удалена: {} ({})", estimate.getName(), id);
    }

    // === Minstroy Index Import ===

    @Transactional
    public int importMinstroyIndices(ImportMinstroyIndicesRequest request) {
        int count = 0;

        for (ImportMinstroyIndicesRequest.IndexEntry entry : request.entries()) {
            PriceIndex index = PriceIndex.builder()
                    .region(entry.region())
                    .workType(entry.workType())
                    .baseQuarter(entry.baseQuarter())
                    .targetQuarter(request.quarter())
                    .indexValue(entry.indexValue())
                    .source(request.source())
                    .build();

            priceIndexRepository.save(index);
            count++;
        }

        MinstroyIndexImport importRecord = MinstroyIndexImport.builder()
                .quarter(request.quarter())
                .importSource(request.source())
                .importDate(Instant.now())
                .indicesCount(count)
                .status("COMPLETED")
                .build();

        importRepository.save(importRecord);
        auditService.logCreate("MinstroyIndexImport", importRecord.getId());

        log.info("Импортировано {} индексов Минстроя за квартал {}", count, request.quarter());
        return count;
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

    private BigDecimal findIndex(String region, String workType, String targetQuarter) {
        if (region == null || targetQuarter == null) {
            return BigDecimal.ONE;
        }
        Optional<PriceIndex> indexOpt = priceIndexRepository
                .findByRegionAndWorkTypeAndTargetQuarter(region, workType, targetQuarter);
        return indexOpt.map(PriceIndex::getIndexValue).orElse(BigDecimal.ONE);
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
}
