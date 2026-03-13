package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import com.privod.platform.modules.estimate.repository.LocalEstimateLineRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.StockMovementRepository;
import com.privod.platform.modules.warehouse.repository.WarehouseLocationRepository;
import com.privod.platform.modules.warehouse.web.dto.LowStockAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.MaterialAvailabilityResponse;
import com.privod.platform.modules.warehouse.web.dto.MaterialConsumptionRow;
import com.privod.platform.modules.warehouse.web.dto.StockEntryResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final StockEntryRepository stockEntryRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProjectRepository projectRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LocalEstimateRepository localEstimateRepository;
    private final LocalEstimateLineRepository localEstimateLineRepository;

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> listAll(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return stockEntryRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> getStockByLocation(UUID locationId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateLocationTenant(locationId, organizationId);
        return stockEntryRepository.findByLocationIdAndOrganizationIdAndDeletedFalse(locationId, organizationId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> getStockByMaterial(UUID materialId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getMaterialOrThrow(materialId, organizationId);
        return stockEntryRepository.findByMaterialIdAndOrganizationIdAndDeletedFalse(materialId, organizationId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialAvailabilityResponse getMaterialAvailability(UUID materialId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Material material = getMaterialOrThrow(materialId, organizationId);

        List<StockEntry> entries = stockEntryRepository.findByMaterialIdAndOrganizationIdAndDeletedFalse(materialId, organizationId);

        BigDecimal totalQuantity = entries.stream()
                .map(StockEntry::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalReserved = entries.stream()
                .map(e -> e.getReservedQuantity() != null ? e.getReservedQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAvailable = totalQuantity.subtract(totalReserved);

        List<StockEntryResponse> stockByLocation = entries.stream()
                .map(StockEntryResponse::fromEntity)
                .toList();

        return new MaterialAvailabilityResponse(
                materialId,
                material.getName(),
                totalQuantity,
                totalReserved,
                totalAvailable,
                stockByLocation
        );
    }

    @Transactional(readOnly = true)
    public List<LowStockAlertResponse> getLowStockAlerts() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<StockEntry> lowStockEntries = stockEntryRepository.findLowStockEntriesByOrganizationId(organizationId);

        return lowStockEntries.stream()
                .map(entry -> {
                    Material material = materialRepository
                            .findByIdAndOrganizationIdAndDeletedFalse(entry.getMaterialId(), organizationId)
                            .orElse(null);
                    BigDecimal minLevel = material != null ? material.getMinStockLevel() : BigDecimal.ZERO;
                    BigDecimal deficit = minLevel.subtract(entry.getQuantity());

                    return new LowStockAlertResponse(
                            entry.getId(),
                            entry.getMaterialId(),
                            entry.getMaterialName(),
                            entry.getLocationId(),
                            entry.getQuantity(),
                            minLevel,
                            deficit
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> getProjectStock(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        return stockEntryRepository.findByProjectIdAndOrganizationId(projectId, organizationId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    /**
     * P1-WAR-2: Plan vs actual material consumption report for a project.
     * Plan  → LocalEstimateLine.quantity aggregated by line name (estimate material positions).
     * Actual → StockMovement(CONSUMPTION).lines aggregated by materialName.
     * Rows are matched by lowercased name containment.
     */
    @Transactional(readOnly = true)
    public List<MaterialConsumptionRow> getProjectConsumptionReport(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        // --- Plan: aggregate LocalEstimateLines by name ---
        List<LocalEstimate> estimates = localEstimateRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId);

        // name (lowercase) → { qty, cost, unit }
        record PlanEntry(BigDecimal qty, BigDecimal cost, String unit) {}
        Map<String, PlanEntry> planMap = new LinkedHashMap<>();

        for (LocalEstimate estimate : estimates) {
            List<LocalEstimateLine> lines = localEstimateLineRepository
                    .findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(estimate.getId());
            for (LocalEstimateLine line : lines) {
                if (line.getName() == null || line.getQuantity() == null) continue;
                String key = line.getName().toLowerCase();
                PlanEntry existing = planMap.get(key);
                BigDecimal addCost = line.getBaseMaterialCost() != null ? line.getBaseMaterialCost() : BigDecimal.ZERO;
                if (existing == null) {
                    planMap.put(key, new PlanEntry(line.getQuantity(), addCost, line.getUnit()));
                } else {
                    planMap.put(key, new PlanEntry(
                            existing.qty().add(line.getQuantity()),
                            existing.cost().add(addCost),
                            existing.unit()));
                }
            }
        }

        // --- Actual: aggregate from CONSUMPTION movements ---
        List<Object[]> consumptions = stockMovementRepository.consumptionByProjectGroupedByMaterial(projectId);
        // [material_id, material_name, unit_of_measure, consumed]

        List<MaterialConsumptionRow> rows = new ArrayList<>();

        for (Object[] row : consumptions) {
            UUID matId = row[0] != null ? UUID.fromString(row[0].toString()) : null;
            String matName = row[1] != null ? row[1].toString() : "Неизвестный материал";
            String unit = row[2] != null ? row[2].toString() : null;
            BigDecimal actual = new BigDecimal(row[3].toString());

            // Try to match against plan by name containment
            String matNameLower = matName.toLowerCase();
            String matchKey = planMap.keySet().stream()
                    .filter(k -> k.contains(matNameLower) || matNameLower.contains(k))
                    .findFirst()
                    .orElse(null);

            BigDecimal planned = BigDecimal.ZERO;
            BigDecimal plannedCost = BigDecimal.ZERO;
            if (matchKey != null) {
                PlanEntry entry = planMap.get(matchKey);
                planned = entry.qty();
                plannedCost = entry.cost();
                if (unit == null) unit = entry.unit();
                planMap.remove(matchKey); // consumed from plan map
            }

            BigDecimal deviation = actual.subtract(planned);
            BigDecimal deviationPct = planned.compareTo(BigDecimal.ZERO) != 0
                    ? deviation.divide(planned, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                    : null;

            rows.add(new MaterialConsumptionRow(matName, matId, unit, planned, plannedCost, actual, deviation, deviationPct));
        }

        // Remaining plan-only items (planned but not yet consumed)
        for (Map.Entry<String, PlanEntry> entry : planMap.entrySet()) {
            rows.add(new MaterialConsumptionRow(
                    entry.getKey(), null, entry.getValue().unit(),
                    entry.getValue().qty(), entry.getValue().cost(),
                    BigDecimal.ZERO,
                    entry.getValue().qty().negate(),
                    BigDecimal.valueOf(-100)));
        }

        log.info("Consumption report: projectId={}, actualLines={}, planOnlyLines={}",
                projectId, consumptions.size(), planMap.size());
        return rows;
    }

    private Material getMaterialOrThrow(UUID materialId, UUID organizationId) {
        return materialRepository.findByIdAndOrganizationIdAndDeletedFalse(materialId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Материал не найден: " + materialId));
    }

    private void validateLocationTenant(UUID locationId, UUID organizationId) {
        warehouseLocationRepository.findByIdAndOrganizationIdAndDeletedFalse(locationId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Складская локация не найдена: " + locationId));
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }
}
