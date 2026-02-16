package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.DepreciationMethod;
import com.privod.platform.modules.accounting.domain.FixedAsset;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;
import com.privod.platform.modules.accounting.repository.FixedAssetRepository;
import com.privod.platform.modules.accounting.web.dto.CreateFixedAssetRequest;
import com.privod.platform.modules.accounting.web.dto.FixedAssetResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FixedAssetService {

    private final FixedAssetRepository fixedAssetRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<FixedAssetResponse> listAssets(FixedAssetStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (status != null) {
            return fixedAssetRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(FixedAssetResponse::fromEntity);
        }
        return fixedAssetRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(FixedAssetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public FixedAssetResponse getAsset(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);
        return FixedAssetResponse.fromEntity(asset);
    }

    @Transactional
    public FixedAssetResponse createAsset(CreateFixedAssetRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        fixedAssetRepository.findByOrganizationIdAndInventoryNumberAndDeletedFalse(organizationId, request.inventoryNumber())
                .ifPresent(existing -> {
                    throw new IllegalStateException("ОС с инв. номером " + request.inventoryNumber() + " уже существует");
                });

        FixedAsset asset = FixedAsset.builder()
                .organizationId(organizationId)
                .code(request.code())
                .name(request.name())
                .inventoryNumber(request.inventoryNumber())
                .accountId(request.accountId())
                .purchaseDate(request.purchaseDate())
                .purchaseAmount(request.purchaseAmount())
                .usefulLifeMonths(request.usefulLifeMonths())
                .depreciationMethod(request.depreciationMethod() != null
                        ? request.depreciationMethod() : DepreciationMethod.LINEAR)
                .currentValue(request.purchaseAmount())
                .status(FixedAssetStatus.DRAFT)
                .build();

        asset = fixedAssetRepository.save(asset);
        auditService.logCreate("FixedAsset", asset.getId());

        log.info("ОС создано: {} ({}) стоимостью {} руб.",
                asset.getName(), asset.getInventoryNumber(), asset.getPurchaseAmount());
        return FixedAssetResponse.fromEntity(asset);
    }

    @Transactional
    public FixedAssetResponse activateAsset(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);
        FixedAssetStatus oldStatus = asset.getStatus();

        if (!asset.canTransitionTo(FixedAssetStatus.ACTIVE)) {
            throw new IllegalStateException(
                    String.format("Невозможно ввести в эксплуатацию ОС из статуса %s",
                            oldStatus.getDisplayName()));
        }

        asset.setStatus(FixedAssetStatus.ACTIVE);
        asset = fixedAssetRepository.save(asset);
        auditService.logStatusChange("FixedAsset", asset.getId(), oldStatus.name(), "ACTIVE");

        log.info("ОС введено в эксплуатацию: {} ({})", asset.getName(), asset.getId());
        return FixedAssetResponse.fromEntity(asset);
    }

    @Transactional
    public FixedAssetResponse disposeAsset(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);
        FixedAssetStatus oldStatus = asset.getStatus();

        if (!asset.canTransitionTo(FixedAssetStatus.DISPOSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно списать ОС из статуса %s", oldStatus.getDisplayName()));
        }

        asset.setStatus(FixedAssetStatus.DISPOSED);
        asset = fixedAssetRepository.save(asset);
        auditService.logStatusChange("FixedAsset", asset.getId(), oldStatus.name(), "DISPOSED");

        log.info("ОС списано: {} ({})", asset.getName(), asset.getId());
        return FixedAssetResponse.fromEntity(asset);
    }

    @Transactional
    public FixedAssetResponse updateAsset(UUID id, CreateFixedAssetRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);

        if (request.name() != null) asset.setName(request.name());
        if (request.inventoryNumber() != null && !request.inventoryNumber().equals(asset.getInventoryNumber())) {
            fixedAssetRepository.findByOrganizationIdAndInventoryNumberAndDeletedFalse(organizationId, request.inventoryNumber())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalStateException("ОС с инв. номером " + request.inventoryNumber() + " уже существует");
                    });
            asset.setInventoryNumber(request.inventoryNumber());
        }
        if (request.accountId() != null) asset.setAccountId(request.accountId());
        if (request.purchaseDate() != null) asset.setPurchaseDate(request.purchaseDate());
        if (request.purchaseAmount() != null) asset.setPurchaseAmount(request.purchaseAmount());
        if (request.usefulLifeMonths() != null) asset.setUsefulLifeMonths(request.usefulLifeMonths());
        if (request.depreciationMethod() != null) asset.setDepreciationMethod(request.depreciationMethod());

        asset = fixedAssetRepository.save(asset);
        auditService.logUpdate("FixedAsset", asset.getId(), "multiple", null, null);

        log.info("ОС обновлено: {} ({})", asset.getName(), asset.getId());
        return FixedAssetResponse.fromEntity(asset);
    }

    @Transactional
    public void deleteAsset(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);
        asset.softDelete();
        fixedAssetRepository.save(asset);
        auditService.logDelete("FixedAsset", id);
        log.info("ОС удалено: {} ({})", asset.getName(), id);
    }

    /**
     * Calculates monthly depreciation for a single active asset and updates its currentValue.
     */
    @Transactional
    public FixedAssetResponse calculateDepreciation(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FixedAsset asset = getAssetOrThrow(id, organizationId);

        if (asset.getStatus() != FixedAssetStatus.ACTIVE) {
            throw new IllegalStateException("Амортизация начисляется только для ОС в статусе ACTIVE");
        }

        if (asset.getCurrentValue().compareTo(BigDecimal.ZERO) <= 0) {
            log.info("ОС {} полностью амортизировано", asset.getName());
            return FixedAssetResponse.fromEntity(asset);
        }

        int monthsElapsed = (int) ChronoUnit.MONTHS.between(asset.getPurchaseDate(), LocalDate.now());
        BigDecimal depreciation = asset.calculateMonthlyDepreciation(monthsElapsed);

        // Don't depreciate below zero
        BigDecimal newValue = asset.getCurrentValue().subtract(depreciation);
        if (newValue.compareTo(BigDecimal.ZERO) < 0) {
            depreciation = asset.getCurrentValue();
            newValue = BigDecimal.ZERO;
        }

        asset.setCurrentValue(newValue);
        asset = fixedAssetRepository.save(asset);

        log.info("Амортизация ОС {}: -{} руб., остаток {} руб.", asset.getName(), depreciation, newValue);
        return FixedAssetResponse.fromEntity(asset);
    }

    /**
     * Batch depreciation: processes all active assets for the current month.
     * Called by scheduler.
     */
    @Transactional
    public int calculateMonthlyDepreciationBatch() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<FixedAsset> activeAssets = fixedAssetRepository.findByOrganizationIdAndStatusAndDeletedFalse(
                organizationId, FixedAssetStatus.ACTIVE);

        int processed = 0;
        for (FixedAsset asset : activeAssets) {
            if (asset.getCurrentValue().compareTo(BigDecimal.ZERO) <= 0) continue;

            int monthsElapsed = (int) ChronoUnit.MONTHS.between(asset.getPurchaseDate(), LocalDate.now());
            BigDecimal depreciation = asset.calculateMonthlyDepreciation(monthsElapsed);

            BigDecimal newValue = asset.getCurrentValue().subtract(depreciation);
            if (newValue.compareTo(BigDecimal.ZERO) < 0) {
                newValue = BigDecimal.ZERO;
            }
            asset.setCurrentValue(newValue);
            processed++;
        }

        fixedAssetRepository.saveAll(activeAssets);
        log.info("Ежемесячная амортизация: обработано {} ОС", processed);
        return processed;
    }

    private FixedAsset getAssetOrThrow(UUID id, UUID organizationId) {
        return fixedAssetRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Основное средство не найдено: " + id));
    }
}
