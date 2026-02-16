package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.CompletionPercentage;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.CompletionPercentageRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CompletionPercentageResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateCompletionPercentageRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompletionPercentageService {

    private final CompletionPercentageRepository completionPercentageRepository;
    private final RevenueContractService revenueContractService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CompletionPercentageResponse> listByContract(UUID revenueContractId, Pageable pageable) {
        return completionPercentageRepository
                .findByRevenueContractIdAndDeletedFalseOrderByCalculationDateDesc(revenueContractId, pageable)
                .map(CompletionPercentageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CompletionPercentageResponse getById(UUID id) {
        CompletionPercentage cp = getOrThrow(id);
        return CompletionPercentageResponse.fromEntity(cp);
    }

    @Transactional(readOnly = true)
    public CompletionPercentageResponse getLatest(UUID revenueContractId) {
        revenueContractService.getContractOrThrow(revenueContractId);
        CompletionPercentage cp = completionPercentageRepository.findLatestByContract(revenueContractId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Нет записей процента завершения для договора: " + revenueContractId));
        return CompletionPercentageResponse.fromEntity(cp);
    }

    @Transactional
    public CompletionPercentageResponse create(CreateCompletionPercentageRequest request) {
        RevenueContract contract = revenueContractService.getContractOrThrow(request.revenueContractId());

        BigDecimal cumulativeCost = request.cumulativeCostIncurred();
        BigDecimal totalEstimatedCost = request.totalEstimatedCost() != null
                ? request.totalEstimatedCost() : contract.getTotalEstimatedCost();

        // Calculate percent complete
        BigDecimal percentComplete;
        if (request.physicalPercentComplete() != null) {
            // Manual override
            percentComplete = request.physicalPercentComplete();
        } else if (cumulativeCost != null && totalEstimatedCost != null
                && totalEstimatedCost.compareTo(BigDecimal.ZERO) > 0) {
            percentComplete = cumulativeCost
                    .multiply(new BigDecimal("100"))
                    .divide(totalEstimatedCost, 4, RoundingMode.HALF_UP);
            if (percentComplete.compareTo(new BigDecimal("100")) > 0) {
                percentComplete = new BigDecimal("100.0000");
            }
        } else {
            percentComplete = BigDecimal.ZERO;
        }

        CompletionPercentage cp = CompletionPercentage.builder()
                .revenueContractId(request.revenueContractId())
                .calculationDate(request.calculationDate())
                .method(request.method() != null ? request.method() : contract.getRecognitionMethod())
                .cumulativeCostIncurred(cumulativeCost)
                .totalEstimatedCost(totalEstimatedCost)
                .percentComplete(percentComplete)
                .physicalPercentComplete(request.physicalPercentComplete())
                .notes(request.notes())
                .calculatedById(request.calculatedById())
                .build();

        cp = completionPercentageRepository.save(cp);
        auditService.logCreate("CompletionPercentage", cp.getId());

        log.info("CompletionPercentage created: {} for contract {} ({}%)",
                cp.getId(), cp.getRevenueContractId(), cp.getPercentComplete());
        return CompletionPercentageResponse.fromEntity(cp);
    }

    @Transactional
    public void delete(UUID id) {
        CompletionPercentage cp = getOrThrow(id);
        cp.softDelete();
        completionPercentageRepository.save(cp);
        auditService.logDelete("CompletionPercentage", id);
        log.info("CompletionPercentage soft-deleted: {}", id);
    }

    private CompletionPercentage getOrThrow(UUID id) {
        return completionPercentageRepository.findById(id)
                .filter(cp -> !cp.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Процент завершения не найден: " + id));
    }
}
