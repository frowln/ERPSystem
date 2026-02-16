package com.privod.platform.modules.procurement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.procurement.web.dto.ProcurementSupplierOptionResponse;
import com.privod.platform.modules.procurement.web.dto.SendPriceRequestsRequest;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementDirectoryService {

    private final CounterpartyRepository counterpartyRepository;
    private final MaterialRepository materialRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ProcurementSupplierOptionResponse> listSuppliers() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return counterpartyRepository.findByOrganizationIdAndSupplierAndDeletedFalse(organizationId, true).stream()
                .filter(Counterparty::isActive)
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .map(ProcurementSupplierOptionResponse::fromCounterparty)
                .toList();
    }

    @Transactional
    public void sendPriceRequests(SendPriceRequestsRequest request) {
        if (request.deadline().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Дедлайн не может быть в прошлом");
        }

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> materialIds = normalizeUuids(request.materialIds());
        List<UUID> supplierIds = normalizeUuids(request.supplierIds());

        Map<UUID, Material> materialsById = materialRepository.findAllById(materialIds).stream()
                .collect(Collectors.toMap(Material::getId, Function.identity()));
        ensureAllMaterialsExist(materialIds, materialsById);

        Map<UUID, Counterparty> suppliersById = counterpartyRepository
                .findByOrganizationIdAndSupplierAndDeletedFalse(organizationId, true).stream()
                .filter(Counterparty::isActive)
                .collect(Collectors.toMap(Counterparty::getId, Function.identity()));
        ensureAllSuppliersExist(supplierIds, suppliersById);

        Map<String, String> quantitiesByMaterialId = request.quantities().entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> entry.getKey().trim().toLowerCase(),
                        Map.Entry::getValue,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));

        for (UUID materialId : materialIds) {
            String quantityRaw = quantitiesByMaterialId.get(materialId.toString().toLowerCase());
            parsePositiveQuantity(quantityRaw, materialId);
        }

        UUID batchId = UUID.randomUUID();
        auditService.logCreate("PriceRequestBatch", batchId);
        log.info(
                "Price requests prepared: batchId={}, materials={}, suppliers={}, deadline={}, deliveryAddress={}",
                batchId,
                materialIds.size(),
                supplierIds.size(),
                request.deadline(),
                request.deliveryAddress()
        );
    }

    private List<UUID> normalizeUuids(List<UUID> ids) {
        return List.copyOf(new LinkedHashSet<>(ids));
    }

    private void ensureAllMaterialsExist(List<UUID> materialIds, Map<UUID, Material> materialsById) {
        if (materialsById.size() == materialIds.size()) {
            return;
        }
        List<UUID> missing = materialIds.stream()
                .filter(materialId -> !materialsById.containsKey(materialId))
                .toList();
        throw new EntityNotFoundException("Материалы не найдены: " + missing);
    }

    private void ensureAllSuppliersExist(List<UUID> supplierIds, Map<UUID, Counterparty> suppliersById) {
        if (supplierIds.stream().allMatch(suppliersById::containsKey)) {
            return;
        }
        List<UUID> missing = supplierIds.stream()
                .filter(supplierId -> !suppliersById.containsKey(supplierId))
                .toList();
        throw new EntityNotFoundException("Поставщики не найдены или недоступны: " + missing);
    }

    private void parsePositiveQuantity(String raw, UUID materialId) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("Не указано количество для материала: " + materialId);
        }

        String normalized = raw.trim().replace(',', '.');
        try {
            BigDecimal quantity = new BigDecimal(normalized);
            if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Количество должно быть больше нуля для материала: " + materialId);
            }
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Некорректное количество для материала: " + materialId, ex);
        }
    }
}
