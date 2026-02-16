package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.LimitFenceSheet;
import com.privod.platform.modules.warehouse.domain.LimitFenceSheetStatus;
import com.privod.platform.modules.warehouse.repository.LimitFenceSheetRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LimitFenceSheetService {

    private final LimitFenceSheetRepository sheetRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<LimitFenceSheet> listSheets(LimitFenceSheetStatus status, UUID projectId,
                                             UUID materialId, Pageable pageable) {
        Specification<LimitFenceSheet> spec = Specification.where(notDeleted());
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (projectId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("projectId"), projectId));
        }
        if (materialId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("materialId"), materialId));
        }
        return sheetRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public LimitFenceSheet getSheet(UUID id) {
        return getSheetOrThrow(id);
    }

    @Transactional(readOnly = true)
    public BigDecimal getRemainingLimit(UUID projectId, UUID materialId) {
        return sheetRepository.sumRemainingLimitByProjectAndMaterial(projectId, materialId);
    }

    @Transactional
    public LimitFenceSheet createSheet(LimitFenceSheet sheet) {
        sheet.setStatus(LimitFenceSheetStatus.ACTIVE);
        if (sheet.getIssuedQuantity() == null) sheet.setIssuedQuantity(BigDecimal.ZERO);
        if (sheet.getReturnedQuantity() == null) sheet.setReturnedQuantity(BigDecimal.ZERO);

        sheet = sheetRepository.save(sheet);
        auditService.logCreate("LimitFenceSheet", sheet.getId());
        log.info("Limit fence sheet created: {} ({}) project={} material={}",
                sheet.getSheetNumber(), sheet.getId(), sheet.getProjectId(), sheet.getMaterialId());
        return sheet;
    }

    @Transactional
    public LimitFenceSheet updateSheet(UUID id, LimitFenceSheet updates) {
        LimitFenceSheet sheet = getSheetOrThrow(id);
        if (sheet.getStatus() != LimitFenceSheetStatus.ACTIVE) {
            throw new IllegalStateException("Редактирование ЛЗВ возможно только в активном статусе");
        }

        if (updates.getLimitQuantity() != null) sheet.setLimitQuantity(updates.getLimitQuantity());
        if (updates.getPeriodStart() != null) sheet.setPeriodStart(updates.getPeriodStart());
        if (updates.getPeriodEnd() != null) sheet.setPeriodEnd(updates.getPeriodEnd());
        if (updates.getWarehouseId() != null) sheet.setWarehouseId(updates.getWarehouseId());
        if (updates.getResponsibleId() != null) sheet.setResponsibleId(updates.getResponsibleId());
        if (updates.getNotes() != null) sheet.setNotes(updates.getNotes());

        sheet = sheetRepository.save(sheet);
        auditService.logUpdate("LimitFenceSheet", sheet.getId(), "multiple", null, null);
        log.info("Limit fence sheet updated: {} ({})", sheet.getSheetNumber(), sheet.getId());
        return sheet;
    }

    @Transactional
    public LimitFenceSheet issueBySheet(UUID id, BigDecimal quantity) {
        LimitFenceSheet sheet = getSheetOrThrow(id);
        if (sheet.getStatus() != LimitFenceSheetStatus.ACTIVE) {
            throw new IllegalStateException("Выдача возможна только по активной ЛЗВ");
        }

        BigDecimal remaining = sheet.getLimitQuantity()
                .subtract(sheet.getIssuedQuantity())
                .add(sheet.getReturnedQuantity());

        if (quantity.compareTo(remaining) > 0) {
            throw new IllegalStateException(
                    String.format("Превышение лимита. Доступно: %s, Запрошено: %s", remaining, quantity));
        }

        sheet.setIssuedQuantity(sheet.getIssuedQuantity().add(quantity));

        // Auto-exhaust if limit reached
        BigDecimal newRemaining = sheet.getLimitQuantity()
                .subtract(sheet.getIssuedQuantity())
                .add(sheet.getReturnedQuantity());
        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            sheet.setStatus(LimitFenceSheetStatus.EXHAUSTED);
            log.info("Limit fence sheet exhausted: {}", sheet.getSheetNumber());
        }

        sheet = sheetRepository.save(sheet);
        log.info("Issued {} from LFS {}, remaining: {}",
                quantity, sheet.getSheetNumber(), newRemaining);
        return sheet;
    }

    @Transactional
    public LimitFenceSheet returnBySheet(UUID id, BigDecimal quantity) {
        LimitFenceSheet sheet = getSheetOrThrow(id);
        if (sheet.getStatus() == LimitFenceSheetStatus.CLOSED
                || sheet.getStatus() == LimitFenceSheetStatus.CANCELLED) {
            throw new IllegalStateException("Возврат невозможен для закрытой/отменённой ЛЗВ");
        }

        sheet.setReturnedQuantity(sheet.getReturnedQuantity().add(quantity));

        // Re-activate if was exhausted
        if (sheet.getStatus() == LimitFenceSheetStatus.EXHAUSTED) {
            sheet.setStatus(LimitFenceSheetStatus.ACTIVE);
        }

        sheet = sheetRepository.save(sheet);
        log.info("Returned {} to LFS {}", quantity, sheet.getSheetNumber());
        return sheet;
    }

    @Transactional
    public LimitFenceSheet closeSheet(UUID id) {
        LimitFenceSheet sheet = getSheetOrThrow(id);
        if (sheet.getStatus() == LimitFenceSheetStatus.CLOSED
                || sheet.getStatus() == LimitFenceSheetStatus.CANCELLED) {
            throw new IllegalStateException("ЛЗВ уже закрыта или отменена");
        }

        LimitFenceSheetStatus old = sheet.getStatus();
        sheet.setStatus(LimitFenceSheetStatus.CLOSED);
        sheet = sheetRepository.save(sheet);
        auditService.logStatusChange("LimitFenceSheet", sheet.getId(), old.name(), LimitFenceSheetStatus.CLOSED.name());
        log.info("Limit fence sheet closed: {} ({})", sheet.getSheetNumber(), sheet.getId());
        return sheet;
    }

    @Transactional
    public void deleteSheet(UUID id) {
        LimitFenceSheet sheet = getSheetOrThrow(id);
        if (sheet.getIssuedQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Невозможно удалить ЛЗВ с проведёнными выдачами");
        }
        sheet.softDelete();
        sheetRepository.save(sheet);
        auditService.logDelete("LimitFenceSheet", id);
        log.info("Limit fence sheet deleted: {} ({})", sheet.getSheetNumber(), id);
    }

    @Transactional(readOnly = true)
    public List<LimitFenceSheet> findExpiredSheets() {
        return sheetRepository.findActiveByDate(LocalDate.now()).stream()
                .filter(s -> s.getPeriodEnd().isBefore(LocalDate.now()))
                .toList();
    }

    private LimitFenceSheet getSheetOrThrow(UUID id) {
        return sheetRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Лимитно-заборная ведомость не найдена: " + id));
    }

    private static Specification<LimitFenceSheet> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }
}
