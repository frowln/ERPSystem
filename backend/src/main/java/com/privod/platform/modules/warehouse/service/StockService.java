package com.privod.platform.modules.warehouse.service;

import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
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

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> listAll(Pageable pageable) {
        return stockEntryRepository.findByDeletedFalse(pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> getStockByLocation(UUID locationId, Pageable pageable) {
        return stockEntryRepository.findByLocationIdAndDeletedFalse(locationId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockEntryResponse> getStockByMaterial(UUID materialId, Pageable pageable) {
        return stockEntryRepository.findByMaterialIdAndDeletedFalse(materialId, pageable)
                .map(StockEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialAvailabilityResponse getMaterialAvailability(UUID materialId) {
        Material material = materialRepository.findById(materialId)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Материал не найден: " + materialId));

        List<StockEntry> entries = stockEntryRepository.findByMaterialIdAndDeletedFalse(materialId);

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
        List<StockEntry> lowStockEntries = stockEntryRepository.findLowStockEntries();

        return lowStockEntries.stream()
                .map(entry -> {
                    Material material = materialRepository.findById(entry.getMaterialId()).orElse(null);
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
        return stockEntryRepository.findByProjectId(projectId, pageable)
                .map(StockEntryResponse::fromEntity);
    }
}
