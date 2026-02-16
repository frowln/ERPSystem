package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ClaimStatus;
import com.privod.platform.modules.contractExt.domain.ContractClaim;
import com.privod.platform.modules.contractExt.repository.ContractClaimRepository;
import com.privod.platform.modules.contractExt.web.dto.ContractClaimResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateClaimRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractClaimService {

    private final ContractClaimRepository claimRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ContractClaimResponse> listByContract(UUID contractId, Pageable pageable) {
        return claimRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractClaimResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContractClaimResponse getById(UUID id) {
        ContractClaim claim = getOrThrow(id);
        return ContractClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ContractClaimResponse create(CreateClaimRequest request) {
        String code = generateClaimCode();

        ContractClaim claim = ContractClaim.builder()
                .contractId(request.contractId())
                .code(code)
                .claimType(request.claimType())
                .subject(request.subject())
                .description(request.description())
                .amount(request.amount())
                .evidenceUrls(request.evidenceUrls())
                .filedById(request.filedById())
                .filedAt(Instant.now())
                .status(ClaimStatus.FILED)
                .build();

        claim = claimRepository.save(claim);
        auditService.logCreate("ContractClaim", claim.getId());

        log.info("Claim created: {} for contract {}", claim.getCode(), claim.getContractId());
        return ContractClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ContractClaimResponse changeStatus(UUID id, ClaimStatus newStatus, String responseText) {
        ContractClaim claim = getOrThrow(id);
        ClaimStatus oldStatus = claim.getStatus();

        validateStatusTransition(oldStatus, newStatus);

        claim.setStatus(newStatus);

        if (newStatus == ClaimStatus.UNDER_REVIEW) {
            claim.setRespondedAt(Instant.now());
        }
        if (newStatus == ClaimStatus.ACCEPTED || newStatus == ClaimStatus.REJECTED) {
            claim.setRespondedAt(Instant.now());
            claim.setResponseText(responseText);
        }
        if (newStatus == ClaimStatus.RESOLVED) {
            claim.setResolvedAt(Instant.now());
            claim.setResolutionNotes(responseText);
        }

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ContractClaim", claim.getId(), oldStatus.name(), newStatus.name());

        log.info("Claim status changed: {} from {} to {} ({})",
                claim.getCode(), oldStatus, newStatus, claim.getId());
        return ContractClaimResponse.fromEntity(claim);
    }

    private void validateStatusTransition(ClaimStatus from, ClaimStatus to) {
        boolean valid = switch (from) {
            case FILED -> to == ClaimStatus.UNDER_REVIEW || to == ClaimStatus.ACCEPTED || to == ClaimStatus.REJECTED;
            case UNDER_REVIEW -> to == ClaimStatus.ACCEPTED || to == ClaimStatus.REJECTED;
            case ACCEPTED -> to == ClaimStatus.RESOLVED;
            case REJECTED, RESOLVED -> false;
        };
        if (!valid) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести претензию из статуса %s в %s",
                            from.getDisplayName(), to.getDisplayName()));
        }
    }

    private String generateClaimCode() {
        long seq = claimRepository.getNextClaimCodeSequence();
        return String.format("CLM-%05d", seq);
    }

    private ContractClaim getOrThrow(UUID id) {
        return claimRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Претензия не найдена: " + id));
    }
}
