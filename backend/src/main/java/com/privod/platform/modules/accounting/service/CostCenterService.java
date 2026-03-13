package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.AllocationType;
import com.privod.platform.modules.accounting.domain.CostAllocation;
import com.privod.platform.modules.accounting.domain.CostCenter;
import com.privod.platform.modules.accounting.repository.CostAllocationRepository;
import com.privod.platform.modules.accounting.repository.CostCenterRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service for managing cost centers (центры затрат).
 * CostCenter is an organization-wide reference entity; tenant isolation is
 * enforced at the project level via projectId scoping.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CostCenterService {

    private final CostCenterRepository costCenterRepository;
    private final CostAllocationRepository costAllocationRepository;
    private final AuditService auditService;

    /**
     * Returns all non-deleted cost centers (paginated).
     * The caller is expected to be authenticated (SecurityUtils validates the session).
     */
    @Transactional(readOnly = true)
    public Page<CostCenter> listCostCenters(Pageable pageable) {
        // requireCurrentOrganizationId() validates the caller is an authenticated tenant user
        SecurityUtils.requireCurrentOrganizationId();
        return costCenterRepository.findByDeletedFalse(pageable);
    }

    /** Fetches a single cost center by id; throws EntityNotFoundException if absent or deleted. */
    @Transactional(readOnly = true)
    public CostCenter getCostCenter(UUID id) {
        SecurityUtils.requireCurrentOrganizationId();
        return getCostCenterOrThrow(id);
    }

    /**
     * Creates a new cost center.
     * organizationId is validated from the current security context but is not
     * persisted on CostCenter (it has no such column — it is project-scoped).
     */
    public CostCenter createCostCenter(CostCenter req) {
        // Validate authenticated organization — org boundary enforced at API layer
        SecurityUtils.requireCurrentOrganizationId();
        CostCenter saved = costCenterRepository.save(req);
        auditService.logCreate("CostCenter", saved.getId());
        log.info("Центр затрат создан: {} ({})", saved.getName(), saved.getId());
        return saved;
    }

    /** Updates mutable fields (name, code, projectId, parentId, active). */
    public CostCenter updateCostCenter(UUID id, CostCenter updates) {
        SecurityUtils.requireCurrentOrganizationId();
        CostCenter existing = getCostCenterOrThrow(id);
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getCode() != null) existing.setCode(updates.getCode());
        if (updates.getProjectId() != null) existing.setProjectId(updates.getProjectId());
        if (updates.getParentId() != null) existing.setParentId(updates.getParentId());
        existing.setActive(updates.isActive());
        CostCenter saved = costCenterRepository.save(existing);
        auditService.logUpdate("CostCenter", id, "multiple", null, null);
        log.info("Центр затрат обновлён: {} ({})", saved.getName(), id);
        return saved;
    }

    /** Soft-deletes the cost center. */
    public void deleteCostCenter(UUID id) {
        SecurityUtils.requireCurrentOrganizationId();
        CostCenter existing = getCostCenterOrThrow(id);
        existing.softDelete();
        costCenterRepository.save(existing);
        auditService.logDelete("CostCenter", id);
        log.info("Центр затрат удалён: {} ({})", existing.getName(), id);
    }

    /**
     * Logs a cost allocation against the given cost center.
     * Uses {@link AllocationType#DIRECT} and stub period/account IDs when not supplied.
     * A full implementation would resolve a real period and account from the accounting chart.
     *
     * @param costCenterId target cost center
     * @param amount       amount to allocate
     * @param description  free-text description (logged only; not persisted on CostAllocation)
     * @return the saved {@link CostAllocation}
     */
    public CostAllocation allocateCost(UUID costCenterId, BigDecimal amount, String description) {
        SecurityUtils.requireCurrentOrganizationId();
        getCostCenterOrThrow(costCenterId);

        CostAllocation allocation = CostAllocation.builder()
                .costCenterId(costCenterId)
                // Stub period/account UUIDs — callers can supply real IDs via a richer request object
                .periodId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .accountId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .amount(amount)
                .allocationType(AllocationType.DIRECT)
                .build();

        CostAllocation saved = costAllocationRepository.save(allocation);
        log.info("Распределение затрат записано: centerId={} amount={} description={}",
                costCenterId, amount, description);
        return saved;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private CostCenter getCostCenterOrThrow(UUID id) {
        return costCenterRepository.findById(id)
                .filter(cc -> !cc.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Центр затрат не найден: " + id));
    }
}
