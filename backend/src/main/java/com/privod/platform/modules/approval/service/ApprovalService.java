package com.privod.platform.modules.approval.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.approval.domain.ApprovalChain;
import com.privod.platform.modules.approval.domain.ApprovalStep;
import com.privod.platform.modules.approval.repository.ApprovalChainRepository;
import com.privod.platform.modules.approval.repository.ApprovalStepRepository;
import com.privod.platform.modules.approval.web.dto.ApprovalChainResponse;
import com.privod.platform.modules.approval.web.dto.ApprovalStepResponse;
import com.privod.platform.modules.approval.web.dto.CreateApprovalChainRequest;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final ApprovalChainRepository chainRepository;
    private final ApprovalStepRepository stepRepository;
    private final SpecificationRepository specificationRepository;

    @Transactional
    public ApprovalChainResponse createChain(CreateApprovalChainRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        ApprovalChain chain = ApprovalChain.builder()
                .organizationId(organizationId)
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .name(request.getName())
                .status("PENDING")
                .build();

        int order = 1;
        for (CreateApprovalChainRequest.StepData stepData : request.getSteps()) {
            // P1-DOC-1: Устанавливаем deadline = now() + slaHours при создании шага
            Instant stepDeadline = null;
            if (stepData.getSlaHours() != null && stepData.getSlaHours() > 0) {
                stepDeadline = Instant.now().plus(stepData.getSlaHours(), java.time.temporal.ChronoUnit.HOURS);
            }
            ApprovalStep step = ApprovalStep.builder()
                    .stepOrder(order++)
                    .approverName(stepData.getApproverName())
                    .approverRole(stepData.getApproverRole())
                    .status("PENDING")
                    .slaHours(stepData.getSlaHours())
                    .deadline(stepDeadline)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            chain.addStep(step);
        }

        chain = chainRepository.save(chain);
        log.info("Created approval chain {} for {} {}", chain.getId(), request.getEntityType(), request.getEntityId());

        // Cascade: move linked entity to IN_REVIEW when chain is created
        cascadeEntityStatus(chain, "IN_REVIEW");

        return toResponse(chain);
    }

    @Transactional(readOnly = true)
    public ApprovalChainResponse getChain(String entityType, UUID entityId) {
        return chainRepository.findFirstByEntityTypeAndEntityIdAndDeletedFalseOrderByCreatedAtDesc(entityType, entityId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ApprovalChainResponse> listChains() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return chainRepository.findByOrganizationIdAndDeletedFalse(orgId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApprovalChainResponse getChainById(UUID id) {
        ApprovalChain chain = chainRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Approval chain not found: " + id));
        return toResponse(chain);
    }

    @Transactional
    public ApprovalStepResponse approveStep(UUID stepId, String comment) {
        ApprovalStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new EntityNotFoundException("Approval step not found: " + stepId));

        if (!"PENDING".equals(step.getStatus())) {
            throw new IllegalStateException("Step is already decided: " + step.getStatus());
        }

        step.setStatus("APPROVED");
        step.setComment(comment);
        step.setDecidedAt(Instant.now());
        step.setUpdatedAt(Instant.now());
        step = stepRepository.save(step);

        // Update chain status
        updateChainStatus(step.getChain());

        log.info("Approved step {} in chain {}", stepId, step.getChain().getId());
        return toStepResponse(step);
    }

    @Transactional
    public ApprovalStepResponse rejectStep(UUID stepId, String comment) {
        ApprovalStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new EntityNotFoundException("Approval step not found: " + stepId));

        if (!"PENDING".equals(step.getStatus())) {
            throw new IllegalStateException("Step is already decided: " + step.getStatus());
        }

        step.setStatus("REJECTED");
        step.setComment(comment);
        step.setDecidedAt(Instant.now());
        step.setUpdatedAt(Instant.now());
        step = stepRepository.save(step);

        // Reject the entire chain
        ApprovalChain chain = step.getChain();
        chain.setStatus("REJECTED");
        chainRepository.save(chain);

        // Cascade: revert entity to DRAFT
        cascadeEntityStatus(chain, "REJECTED");

        log.info("Rejected step {} in chain {}", stepId, chain.getId());
        return toStepResponse(step);
    }

    private void updateChainStatus(ApprovalChain chain) {
        List<ApprovalStep> steps = chain.getSteps();

        boolean allApproved = steps.stream().allMatch(s -> "APPROVED".equals(s.getStatus()));
        boolean anyRejected = steps.stream().anyMatch(s -> "REJECTED".equals(s.getStatus()));
        boolean anyApproved = steps.stream().anyMatch(s -> "APPROVED".equals(s.getStatus()));

        String oldStatus = chain.getStatus();

        if (allApproved) {
            chain.setStatus("APPROVED");
        } else if (anyRejected) {
            chain.setStatus("REJECTED");
        } else if (anyApproved) {
            chain.setStatus("IN_PROGRESS");
        } else {
            chain.setStatus("PENDING");
        }

        chainRepository.save(chain);

        // Cascade status change to linked entity
        if (!chain.getStatus().equals(oldStatus)) {
            cascadeEntityStatus(chain, chain.getStatus());
        }
    }

    /**
     * Cascade approval chain status to the linked entity (e.g. Specification).
     */
    private void cascadeEntityStatus(ApprovalChain chain, String chainStatus) {
        try {
            if ("SPECIFICATION".equals(chain.getEntityType())) {
                specificationRepository.findByIdAndDeletedFalse(chain.getEntityId()).ifPresent(spec -> {
                    SpecificationStatus target = switch (chainStatus) {
                        case "IN_REVIEW" -> SpecificationStatus.IN_REVIEW;
                        case "APPROVED" -> SpecificationStatus.APPROVED;
                        case "REJECTED" -> SpecificationStatus.DRAFT;
                        default -> null;
                    };
                    if (target != null && spec.getStatus() != target) {
                        log.info("Cascading status {} -> {} for Specification {}", spec.getStatus(), target, spec.getId());
                        spec.setStatus(target);
                        if (target == SpecificationStatus.APPROVED) {
                            spec.setCurrent(true);
                        }
                        specificationRepository.save(spec);
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Could not cascade entity status for {} {}: {}", chain.getEntityType(), chain.getEntityId(), e.getMessage());
        }
    }

    private ApprovalChainResponse toResponse(ApprovalChain chain) {
        List<ApprovalStepResponse> stepResponses = chain.getSteps().stream()
                .map(this::toStepResponse)
                .collect(Collectors.toList());

        return ApprovalChainResponse.builder()
                .id(chain.getId())
                .entityType(chain.getEntityType())
                .entityId(chain.getEntityId())
                .name(chain.getName())
                .status(chain.getStatus())
                .steps(stepResponses)
                .createdAt(chain.getCreatedAt())
                .build();
    }

    private ApprovalStepResponse toStepResponse(ApprovalStep step) {
        return ApprovalStepResponse.builder()
                .id(step.getId())
                .stepOrder(step.getStepOrder())
                .approverName(step.getApproverName())
                .approverRole(step.getApproverRole())
                .status(step.getStatus())
                .comment(step.getComment())
                .decidedAt(step.getDecidedAt())
                .createdAt(step.getCreatedAt())
                .build();
    }
}
