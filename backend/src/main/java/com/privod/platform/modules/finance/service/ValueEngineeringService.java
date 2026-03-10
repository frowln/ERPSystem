package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.web.dto.UpdateVeItemRequest;
import com.privod.platform.modules.finance.web.dto.VeItemResponse;
import com.privod.platform.modules.specification.domain.AnalogRequest;
import com.privod.platform.modules.specification.domain.AnalogRequestStatus;
import com.privod.platform.modules.specification.domain.MaterialAnalog;
import com.privod.platform.modules.specification.domain.QualityRating;
import com.privod.platform.modules.specification.domain.SubstitutionType;
import com.privod.platform.modules.specification.repository.AnalogRequestRepository;
import com.privod.platform.modules.specification.repository.MaterialAnalogRepository;
import com.privod.platform.modules.specification.web.dto.CreateVeProposalRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValueEngineeringService {

    private final AnalogRequestRepository analogRequestRepository;
    private final MaterialAnalogRepository materialAnalogRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<VeItemResponse> listByProject(UUID projectId) {
        List<AnalogRequest> requests = analogRequestRepository.findByProjectIdAndDeletedFalse(
                projectId, Pageable.unpaged()).getContent();

        // Pre-fetch analog materials for approved analog IDs
        List<UUID> approvedAnalogIds = requests.stream()
                .map(AnalogRequest::getApprovedAnalogId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, MaterialAnalog> approvedAnalogMap = approvedAnalogIds.isEmpty()
                ? Map.of()
                : materialAnalogRepository.findAllById(approvedAnalogIds).stream()
                        .collect(Collectors.toMap(MaterialAnalog::getId, a -> a));

        return requests.stream()
                .map(ar -> toResponse(ar, approvedAnalogMap))
                .toList();
    }

    @Transactional
    public VeItemResponse create(UUID projectId, CreateVeProposalRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();

        // Create a MaterialAnalog entry representing the VE substitution
        MaterialAnalog analog = MaterialAnalog.builder()
                .originalMaterialId(request.specItemId() != null ? request.specItemId() : UUID.randomUUID())
                .originalMaterialName(request.originalMaterialName())
                .analogMaterialId(UUID.randomUUID()) // placeholder for the analog
                .analogMaterialName(request.analogMaterialName())
                .substitutionType(SubstitutionType.FULL)
                .qualityRating(mapQualityImpactToRating(request.qualityImpact()))
                .priceRatio(request.originalPrice().compareTo(BigDecimal.ZERO) > 0
                        ? request.analogPrice().divide(request.originalPrice(), 4, RoundingMode.HALF_UP)
                        : BigDecimal.ONE)
                .isActive(true)
                .conditions(request.reason())
                .build();
        analog = materialAnalogRepository.save(analog);

        // Create the AnalogRequest (VE proposal)
        AnalogRequest analogRequest = AnalogRequest.builder()
                .projectId(projectId)
                .originalMaterialId(analog.getOriginalMaterialId())
                .requestedById(userId)
                .reason(request.reason())
                .status(AnalogRequestStatus.PENDING)
                .approvedAnalogId(analog.getId())
                .build();
        analogRequest = analogRequestRepository.save(analogRequest);

        auditService.logCreate("AnalogRequest", analogRequest.getId());
        log.info("VE proposal created for project {}: {} -> {} ({})",
                projectId, request.originalMaterialName(), request.analogMaterialName(), analogRequest.getId());

        BigDecimal savingsPerUnit = request.originalPrice().subtract(request.analogPrice());
        BigDecimal totalSavings = savingsPerUnit.multiply(request.quantity()).setScale(2, RoundingMode.HALF_UP);

        return new VeItemResponse(
                analogRequest.getId(), projectId,
                request.originalMaterialName(), request.originalMaterialCode(), request.originalPrice(),
                request.analogMaterialName(), request.analogBrand(), request.analogManufacturer(),
                request.analogPrice(), request.quantity(), savingsPerUnit, totalSavings,
                request.qualityImpact(), request.reason(),
                analogRequest.getStatus().name(), analogRequest.getStatus().getDisplayName(),
                userId, null, null, request.specItemId(),
                analogRequest.getCreatedAt(), analogRequest.getUpdatedAt()
        );
    }

    @Transactional
    public VeItemResponse update(UUID projectId, UUID itemId, UpdateVeItemRequest request) {
        AnalogRequest ar = analogRequestRepository.findById(itemId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("VE предложение не найдено: " + itemId));

        if (!ar.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("VE предложение не принадлежит указанному проекту");
        }

        if (request.reason() != null) {
            ar.setReason(request.reason());
        }
        if (request.reviewComment() != null) {
            ar.setReviewComment(request.reviewComment());
        }
        if (request.status() != null) {
            try {
                AnalogRequestStatus newStatus = AnalogRequestStatus.valueOf(request.status());
                ar.setStatus(newStatus);
                if (newStatus == AnalogRequestStatus.APPROVED) {
                    ar.setApprovedById(SecurityUtils.requireCurrentUserId());
                }
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Недопустимый статус: " + request.status());
            }
        }

        // Update associated MaterialAnalog if it exists
        if (ar.getApprovedAnalogId() != null) {
            MaterialAnalog analog = materialAnalogRepository.findById(ar.getApprovedAnalogId()).orElse(null);
            if (analog != null) {
                if (request.analogMaterialName() != null) {
                    analog.setAnalogMaterialName(request.analogMaterialName());
                }
                if (request.qualityImpact() != null) {
                    analog.setQualityRating(mapQualityImpactToRating(request.qualityImpact()));
                }
                if (request.reason() != null) {
                    analog.setConditions(request.reason());
                }
                materialAnalogRepository.save(analog);
            }
        }

        ar = analogRequestRepository.save(ar);
        auditService.logUpdate("AnalogRequest", ar.getId(), "multiple", null, null);

        log.info("VE proposal updated: {} ({})", itemId, projectId);

        return toResponse(ar, ar.getApprovedAnalogId() != null
                ? materialAnalogRepository.findById(ar.getApprovedAnalogId())
                        .map(a -> Map.of(a.getId(), a))
                        .orElse(Map.of())
                : Map.of());
    }

    private VeItemResponse toResponse(AnalogRequest ar, Map<UUID, MaterialAnalog> analogMap) {
        MaterialAnalog analog = ar.getApprovedAnalogId() != null
                ? analogMap.get(ar.getApprovedAnalogId()) : null;

        String originalName = analog != null && analog.getOriginalMaterialName() != null
                ? analog.getOriginalMaterialName() : "";
        String analogName = analog != null && analog.getAnalogMaterialName() != null
                ? analog.getAnalogMaterialName() : "";
        String qualityImpact = analog != null && analog.getQualityRating() != null
                ? analog.getQualityRating().name() : "";

        return new VeItemResponse(
                ar.getId(), ar.getProjectId(),
                originalName, "", BigDecimal.ZERO,
                analogName, "", "", BigDecimal.ZERO,
                BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO,
                qualityImpact, ar.getReason(),
                ar.getStatus().name(), ar.getStatus().getDisplayName(),
                ar.getRequestedById(), ar.getApprovedById(),
                ar.getReviewComment(), null,
                ar.getCreatedAt(), ar.getUpdatedAt()
        );
    }

    private QualityRating mapQualityImpactToRating(String qualityImpact) {
        if (qualityImpact == null) return QualityRating.EQUAL;
        return switch (qualityImpact.toUpperCase()) {
            case "IMPROVEMENT" -> QualityRating.BETTER;
            case "ACCEPTABLE_REDUCTION" -> QualityRating.LOWER;
            default -> QualityRating.EQUAL;
        };
    }
}
