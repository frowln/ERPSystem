package com.privod.platform.modules.priceCoefficient.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.priceCoefficient.domain.CoefficientStatus;
import com.privod.platform.modules.priceCoefficient.domain.PriceCoefficient;
import com.privod.platform.modules.priceCoefficient.repository.PriceCoefficientRepository;
import com.privod.platform.modules.priceCoefficient.web.dto.CalculatePriceRequest;
import com.privod.platform.modules.priceCoefficient.web.dto.CalculatePriceResponse;
import com.privod.platform.modules.priceCoefficient.web.dto.PriceCoefficientRequest;
import com.privod.platform.modules.priceCoefficient.web.dto.PriceCoefficientResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceCoefficientService {

    private final PriceCoefficientRepository priceCoefficientRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PriceCoefficientResponse> listCoefficients(Pageable pageable) {
        return priceCoefficientRepository.findByDeletedFalse(pageable)
                .map(PriceCoefficientResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PriceCoefficientResponse getCoefficient(UUID id) {
        PriceCoefficient pc = getCoefficientOrThrow(id);
        return PriceCoefficientResponse.fromEntity(pc);
    }

    @Transactional
    public PriceCoefficientResponse createCoefficient(PriceCoefficientRequest request) {
        validateDates(request.effectiveFrom(), request.effectiveTo());

        if (request.code() != null && priceCoefficientRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Коэффициент с кодом '" + request.code() + "' уже существует");
        }

        PriceCoefficient pc = PriceCoefficient.builder()
                .name(request.name())
                .code(request.code())
                .value(request.value())
                .effectiveFrom(request.effectiveFrom())
                .effectiveTo(request.effectiveTo())
                .contractId(request.contractId())
                .projectId(request.projectId())
                .type(request.type())
                .status(CoefficientStatus.DRAFT)
                .description(request.description())
                .appliedToEstimateItems(request.appliedToEstimateItems() != null
                        ? request.appliedToEstimateItems() : false)
                .build();

        pc = priceCoefficientRepository.save(pc);
        auditService.logCreate("PriceCoefficient", pc.getId());

        log.info("Ценовой коэффициент создан: {} - {} ({})", pc.getCode(), pc.getName(), pc.getId());
        return PriceCoefficientResponse.fromEntity(pc);
    }

    @Transactional
    public PriceCoefficientResponse updateCoefficient(UUID id, PriceCoefficientRequest request) {
        PriceCoefficient pc = getCoefficientOrThrow(id);

        if (pc.getStatus() != CoefficientStatus.DRAFT) {
            throw new IllegalStateException(
                    "Редактирование коэффициента возможно только в статусе Черновик");
        }

        validateDates(request.effectiveFrom(), request.effectiveTo());

        if (request.name() != null) {
            pc.setName(request.name());
        }
        if (request.code() != null) {
            pc.setCode(request.code());
        }
        if (request.value() != null) {
            pc.setValue(request.value());
        }
        if (request.effectiveFrom() != null) {
            pc.setEffectiveFrom(request.effectiveFrom());
        }
        if (request.effectiveTo() != null) {
            pc.setEffectiveTo(request.effectiveTo());
        }
        if (request.contractId() != null) {
            pc.setContractId(request.contractId());
        }
        if (request.projectId() != null) {
            pc.setProjectId(request.projectId());
        }
        if (request.type() != null) {
            pc.setType(request.type());
        }
        if (request.description() != null) {
            pc.setDescription(request.description());
        }
        if (request.appliedToEstimateItems() != null) {
            pc.setAppliedToEstimateItems(request.appliedToEstimateItems());
        }

        pc = priceCoefficientRepository.save(pc);
        auditService.logUpdate("PriceCoefficient", pc.getId(), "multiple", null, null);

        log.info("Ценовой коэффициент обновлён: {} ({})", pc.getCode(), pc.getId());
        return PriceCoefficientResponse.fromEntity(pc);
    }

    @Transactional
    public PriceCoefficientResponse activateCoefficient(UUID id) {
        PriceCoefficient pc = getCoefficientOrThrow(id);
        CoefficientStatus oldStatus = pc.getStatus();

        if (!oldStatus.canTransitionTo(CoefficientStatus.ACTIVE)) {
            throw new IllegalStateException(
                    String.format("Невозможно активировать коэффициент из статуса %s",
                            oldStatus.getDisplayName()));
        }

        pc.setStatus(CoefficientStatus.ACTIVE);
        pc = priceCoefficientRepository.save(pc);
        auditService.logStatusChange("PriceCoefficient", pc.getId(),
                oldStatus.name(), CoefficientStatus.ACTIVE.name());

        log.info("Ценовой коэффициент активирован: {} ({})", pc.getCode(), pc.getId());
        return PriceCoefficientResponse.fromEntity(pc);
    }

    @Transactional
    public PriceCoefficientResponse expireCoefficient(UUID id) {
        PriceCoefficient pc = getCoefficientOrThrow(id);
        CoefficientStatus oldStatus = pc.getStatus();

        if (!oldStatus.canTransitionTo(CoefficientStatus.EXPIRED)) {
            throw new IllegalStateException(
                    String.format("Невозможно завершить действие коэффициента из статуса %s",
                            oldStatus.getDisplayName()));
        }

        pc.setStatus(CoefficientStatus.EXPIRED);
        pc.setEffectiveTo(LocalDate.now());
        pc = priceCoefficientRepository.save(pc);
        auditService.logStatusChange("PriceCoefficient", pc.getId(),
                oldStatus.name(), CoefficientStatus.EXPIRED.name());

        log.info("Ценовой коэффициент истёк: {} ({})", pc.getCode(), pc.getId());
        return PriceCoefficientResponse.fromEntity(pc);
    }

    @Transactional
    public void deleteCoefficient(UUID id) {
        PriceCoefficient pc = getCoefficientOrThrow(id);
        pc.softDelete();
        priceCoefficientRepository.save(pc);
        auditService.logDelete("PriceCoefficient", pc.getId());

        log.info("Ценовой коэффициент удалён: {} ({})", pc.getCode(), pc.getId());
    }

    @Transactional(readOnly = true)
    public List<PriceCoefficientResponse> findByContractId(UUID contractId) {
        return priceCoefficientRepository.findByContractIdAndDeletedFalse(contractId)
                .stream()
                .map(PriceCoefficientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PriceCoefficientResponse> findActiveByProjectId(UUID projectId) {
        return priceCoefficientRepository.findActiveByProjectId(projectId)
                .stream()
                .map(PriceCoefficientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CalculatePriceResponse calculateAdjustedPrice(CalculatePriceRequest request) {
        List<PriceCoefficient> coefficients;
        LocalDate effectiveDate = request.effectiveDate() != null ? request.effectiveDate() : LocalDate.now();

        if (request.coefficientIds() != null && !request.coefficientIds().isEmpty()) {
            coefficients = priceCoefficientRepository.findAllById(request.coefficientIds())
                    .stream()
                    .filter(pc -> !pc.isDeleted() && pc.getStatus() == CoefficientStatus.ACTIVE)
                    .toList();
        } else if (request.projectId() != null) {
            coefficients = priceCoefficientRepository
                    .findActiveByProjectIdAndDate(request.projectId(), effectiveDate);
        } else if (request.contractId() != null) {
            coefficients = priceCoefficientRepository
                    .findByContractIdAndDeletedFalse(request.contractId())
                    .stream()
                    .filter(pc -> pc.getStatus() == CoefficientStatus.ACTIVE
                            && pc.isEffectiveOn(effectiveDate))
                    .toList();
        } else {
            coefficients = List.of();
        }

        BigDecimal totalCoefficient = BigDecimal.ONE;
        List<CalculatePriceResponse.AppliedCoefficient> appliedCoefficients = new ArrayList<>();

        for (PriceCoefficient pc : coefficients) {
            totalCoefficient = totalCoefficient.multiply(pc.getValue());
            appliedCoefficients.add(new CalculatePriceResponse.AppliedCoefficient(
                    pc.getName(),
                    pc.getCode(),
                    pc.getType().getDisplayName(),
                    pc.getValue()
            ));
        }

        BigDecimal adjustedPrice = request.originalPrice()
                .multiply(totalCoefficient)
                .setScale(2, RoundingMode.HALF_UP);

        return new CalculatePriceResponse(
                request.originalPrice(),
                adjustedPrice,
                totalCoefficient.setScale(6, RoundingMode.HALF_UP),
                appliedCoefficients
        );
    }

    private PriceCoefficient getCoefficientOrThrow(UUID id) {
        return priceCoefficientRepository.findById(id)
                .filter(pc -> !pc.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Ценовой коэффициент не найден: " + id));
    }

    private void validateDates(LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException(
                    "Дата окончания действия должна быть позже даты начала действия");
        }
    }
}
