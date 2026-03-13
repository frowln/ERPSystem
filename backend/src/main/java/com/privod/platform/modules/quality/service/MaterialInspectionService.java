package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.quality.domain.MaterialInspection;
import com.privod.platform.modules.quality.domain.MaterialInspectionResult;
import com.privod.platform.modules.quality.repository.MaterialInspectionRepository;
import com.privod.platform.modules.quality.web.dto.CreateMaterialInspectionRequest;
import com.privod.platform.modules.quality.web.dto.MaterialInspectionResponse;
import com.privod.platform.modules.warehouse.service.StockMovementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialInspectionService {

    private final MaterialInspectionRepository materialInspectionRepository;
    private final AuditService auditService;
    private final StockMovementService stockMovementService;

    @Transactional(readOnly = true)
    public Page<MaterialInspectionResponse> list(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return materialInspectionRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(MaterialInspectionResponse::fromEntity);
        }
        return materialInspectionRepository.findByDeletedFalse(pageable)
                .map(MaterialInspectionResponse::fromEntity);
    }

    @Transactional
    public MaterialInspectionResponse create(CreateMaterialInspectionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateNumber();

        MaterialInspection inspection = MaterialInspection.builder()
                .organizationId(organizationId)
                .number(number)
                .materialName(request.materialName())
                .supplier(request.supplier())
                .batchNumber(request.batchNumber())
                .inspectionDate(request.inspectionDate())
                .inspectorName(request.inspectorName())
                .result(request.result())
                .testProtocolNumber(request.testProtocolNumber())
                .testResults(request.testResults() != null ? request.testResults() : new ArrayList<>())
                .notes(request.notes())
                .projectId(request.projectId())
                .materialId(request.materialId())
                .quantity(request.quantity())
                .destinationLocationId(request.destinationLocationId())
                .build();

        inspection = materialInspectionRepository.save(inspection);
        auditService.logCreate("MaterialInspection", inspection.getId());

        // P1-SAF-6: При ACCEPTED + наличии materialId + quantity → авто StockMovement(RECEIPT)
        if (request.result() == MaterialInspectionResult.accepted
                && request.materialId() != null
                && request.quantity() != null
                && request.quantity().compareTo(java.math.BigDecimal.ZERO) > 0) {
            try {
                stockMovementService.createAutoReceiptFromDelivery(
                        inspection.getId(), organizationId,
                        List.of(request.materialId()),
                        List.of(request.quantity()),
                        List.of("")
                );
                log.info("Авто-приходный ордер создан из входного контроля {}", inspection.getNumber());
            } catch (Exception ex) {
                log.warn("Не удалось авто-создать приходный ордер из входного контроля {}: {}",
                        inspection.getNumber(), ex.getMessage());
            }
        }

        log.info("Material inspection created: {} ({})", inspection.getNumber(), inspection.getId());
        return MaterialInspectionResponse.fromEntity(inspection);
    }

    private String generateNumber() {
        long seq = materialInspectionRepository.getNextNumberSequence();
        return String.format("MI-%05d", seq);
    }
}
