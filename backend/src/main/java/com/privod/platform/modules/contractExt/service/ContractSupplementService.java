package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ContractSupplement;
import com.privod.platform.modules.contractExt.domain.SupplementStatus;
import com.privod.platform.modules.contractExt.repository.ContractSupplementRepository;
import com.privod.platform.modules.contractExt.web.dto.ContractSupplementResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSupplementRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractSupplementService {

    private final ContractSupplementRepository supplementRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ContractSupplementResponse> listByContract(UUID contractId, Pageable pageable) {
        return supplementRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractSupplementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContractSupplementResponse getById(UUID id) {
        ContractSupplement supplement = getOrThrow(id);
        return ContractSupplementResponse.fromEntity(supplement);
    }

    @Transactional
    public ContractSupplementResponse create(CreateSupplementRequest request) {
        ContractSupplement supplement = ContractSupplement.builder()
                .contractId(request.contractId())
                .number(request.number())
                .supplementDate(request.supplementDate() != null ? request.supplementDate() : LocalDate.now())
                .reason(request.reason())
                .description(request.description())
                .amountChange(request.amountChange())
                .newTotalAmount(request.newTotalAmount())
                .deadlineChange(request.deadlineChange())
                .newDeadline(request.newDeadline())
                .status(SupplementStatus.DRAFT)
                .signatories(request.signatories())
                .build();

        supplement = supplementRepository.save(supplement);
        auditService.logCreate("ContractSupplement", supplement.getId());

        log.info("Contract supplement created: {} for contract {}", supplement.getNumber(), supplement.getContractId());
        return ContractSupplementResponse.fromEntity(supplement);
    }

    @Transactional
    public ContractSupplementResponse approve(UUID id) {
        ContractSupplement supplement = getOrThrow(id);

        if (supplement.getStatus() != SupplementStatus.DRAFT) {
            throw new IllegalStateException("Согласовать можно только ДС в статусе Черновик");
        }

        SupplementStatus oldStatus = supplement.getStatus();
        supplement.setStatus(SupplementStatus.APPROVED);
        supplement = supplementRepository.save(supplement);

        auditService.logStatusChange("ContractSupplement", supplement.getId(),
                oldStatus.name(), SupplementStatus.APPROVED.name());

        log.info("Supplement approved: {} ({})", supplement.getNumber(), supplement.getId());
        return ContractSupplementResponse.fromEntity(supplement);
    }

    @Transactional
    public ContractSupplementResponse sign(UUID id) {
        ContractSupplement supplement = getOrThrow(id);

        if (supplement.getStatus() != SupplementStatus.APPROVED) {
            throw new IllegalStateException("Подписать можно только согласованное ДС");
        }

        SupplementStatus oldStatus = supplement.getStatus();
        supplement.setStatus(SupplementStatus.SIGNED);
        supplement.setSignedAt(Instant.now());
        supplement = supplementRepository.save(supplement);

        auditService.logStatusChange("ContractSupplement", supplement.getId(),
                oldStatus.name(), SupplementStatus.SIGNED.name());

        log.info("Supplement signed: {} ({})", supplement.getNumber(), supplement.getId());
        return ContractSupplementResponse.fromEntity(supplement);
    }

    private ContractSupplement getOrThrow(UUID id) {
        return supplementRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Дополнительное соглашение не найдено: " + id));
    }
}
