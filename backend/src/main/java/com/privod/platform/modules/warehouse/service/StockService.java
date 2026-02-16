package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
import com.privod.platform.modules.warehouse.repository.WarehouseLocationRepository;
import com.privod.platform.modules.warehouse.web.dto.LowStockAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.MaterialAvailabilityResponse;
import com.privod.platform.modules.warehouse.web.dto.StockEntryResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final StockEntryRepository stockEntryRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProjectRepository projectRepository;

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
