package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.UnitOfMeasure;
import com.privod.platform.modules.warehouse.repository.UnitOfMeasureRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository uomRepository;
    private final AuditService auditService;

    // ── Queries ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UnitOfMeasure> list(String quantityGroup, Pageable pageable) {
        if (StringUtils.hasText(quantityGroup)) {
            return uomRepository.findByQuantityGroupAndDeletedFalse(quantityGroup, pageable);
        }
        return uomRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public UnitOfMeasure getById(UUID id) {
        return uomRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Единица измерения не найдена: " + id));
    }

    @Transactional(readOnly = true)
    public UnitOfMeasure getByCode(String okeiCode) {
        return uomRepository.findByOkeiCodeAndDeletedFalse(okeiCode)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Единица измерения с кодом ОКЕИ не найдена: " + okeiCode));
    }

    @Transactional(readOnly = true)
    public Optional<UnitOfMeasure> findBySymbol(String symbol) {
        return uomRepository.findBySymbolAndDeletedFalse(symbol);
    }

    // ── Commands ─────────────────────────────────────────────────────────────

    public UnitOfMeasure create(UnitOfMeasure req) {
        if (uomRepository.existsByOkeiCodeAndDeletedFalse(req.getOkeiCode())) {
            throw new IllegalArgumentException(
                    "Единица измерения с кодом ОКЕИ '" + req.getOkeiCode() + "' уже существует");
        }
        UnitOfMeasure saved = uomRepository.save(req);
        auditService.logCreate("UnitOfMeasure", saved.getId());
        log.info("UoM created: {} ({}) id={}", saved.getSymbol(), saved.getOkeiCode(), saved.getId());
        return saved;
    }

    public UnitOfMeasure update(UUID id, UnitOfMeasure req) {
        UnitOfMeasure existing = getById(id);

        if (StringUtils.hasText(req.getName())) {
            existing.setName(req.getName());
        }
        if (StringUtils.hasText(req.getSymbol())) {
            existing.setSymbol(req.getSymbol());
        }
        if (StringUtils.hasText(req.getQuantityGroup())) {
            existing.setQuantityGroup(req.getQuantityGroup());
        }
        if (req.getConversionFactor() != null) {
            existing.setConversionFactor(req.getConversionFactor());
        }
        if (req.getBaseUnitCode() != null) {
            existing.setBaseUnitCode(req.getBaseUnitCode());
        }
        existing.setActive(req.isActive());

        UnitOfMeasure saved = uomRepository.save(existing);
        auditService.logUpdate("UnitOfMeasure", saved.getId(), "multiple", null, null);
        log.info("UoM updated: {} id={}", saved.getSymbol(), saved.getId());
        return saved;
    }

    public void deactivate(UUID id) {
        UnitOfMeasure uom = getById(id);
        uom.softDelete();
        uomRepository.save(uom);
        auditService.logDelete("UnitOfMeasure", id);
        log.info("UoM deactivated: {} id={}", uom.getSymbol(), id);
    }

    // ── Conversion ────────────────────────────────────────────────────────────

    /**
     * Converts {@code qty} from the unit identified by {@code fromSymbol} to the unit
     * identified by {@code toSymbol}.
     *
     * <p>Algorithm: both units must share the same {@code quantityGroup}.  Conversion
     * goes through the common base unit using the stored {@code conversionFactor}:
     * <pre>
     *   qty_in_base = qty * fromUnit.conversionFactor   (or qty when fromUnit IS the base)
     *   result      = qty_in_base / toUnit.conversionFactor (or qty_in_base when toUnit IS the base)
     * </pre>
     *
     * @throws IllegalArgumentException when units belong to different quantity groups
     *                                  or a required conversion factor is missing.
     */
    @Transactional(readOnly = true)
    public BigDecimal convert(String fromSymbol, String toSymbol, BigDecimal qty) {
        if (fromSymbol.equalsIgnoreCase(toSymbol)) {
            return qty;
        }

        UnitOfMeasure from = uomRepository.findBySymbolAndDeletedFalse(fromSymbol)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Единица измерения не найдена: " + fromSymbol));
        UnitOfMeasure to = uomRepository.findBySymbolAndDeletedFalse(toSymbol)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Единица измерения не найдена: " + toSymbol));

        String fromGroup = from.getQuantityGroup();
        String toGroup = to.getQuantityGroup();
        if (fromGroup == null || !fromGroup.equalsIgnoreCase(toGroup)) {
            throw new IllegalArgumentException(
                    "Невозможно конвертировать единицы разных групп: "
                            + fromGroup + " → " + toGroup);
        }

        // Convert from → base
        BigDecimal inBase;
        if (from.getConversionFactor() == null) {
            // fromUnit IS the base
            inBase = qty;
        } else {
            inBase = qty.multiply(from.getConversionFactor());
        }

        // Convert base → to
        if (to.getConversionFactor() == null) {
            // toUnit IS the base
            return inBase.setScale(6, RoundingMode.HALF_UP);
        } else {
            if (to.getConversionFactor().compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException(
                        "Коэффициент конвертации для единицы '" + toSymbol + "' равен нулю");
            }
            return inBase.divide(to.getConversionFactor(), 6, RoundingMode.HALF_UP);
        }
    }
}
