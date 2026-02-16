package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.specification.domain.AnalogRequest;
import com.privod.platform.modules.specification.domain.AnalogRequestStatus;
import com.privod.platform.modules.specification.domain.MaterialAnalog;
import com.privod.platform.modules.specification.repository.AnalogRequestRepository;
import com.privod.platform.modules.specification.repository.MaterialAnalogRepository;
import com.privod.platform.modules.specification.web.dto.AnalogRequestResponse;
import com.privod.platform.modules.specification.web.dto.CreateAnalogRequestRequest;
import com.privod.platform.modules.specification.web.dto.CreateMaterialAnalogRequest;
import com.privod.platform.modules.specification.web.dto.MaterialAnalogResponse;
import com.privod.platform.modules.specification.web.dto.ReviewAnalogRequestRequest;
import com.privod.platform.modules.specification.web.dto.UpdateMaterialAnalogRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialAnalogService {

    private final MaterialAnalogRepository analogRepository;
    private final AnalogRequestRepository requestRepository;
    private final AuditService auditService;

    // --- Material Analogs ---

    @Transactional(readOnly = true)
    public Page<MaterialAnalogResponse> listAnalogs(UUID originalMaterialId, Pageable pageable) {
        if (originalMaterialId != null) {
            return analogRepository.findByOriginalMaterialIdAndDeletedFalse(originalMaterialId, pageable)
                    .map(MaterialAnalogResponse::fromEntity);
        }
        return analogRepository.findByDeletedFalse(pageable)
                .map(MaterialAnalogResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialAnalogResponse getAnalog(UUID id) {
        MaterialAnalog analog = getAnalogOrThrow(id);
        return MaterialAnalogResponse.fromEntity(analog);
    }

    @Transactional(readOnly = true)
    public List<MaterialAnalogResponse> getActiveAnalogsForMaterial(UUID materialId) {
        return analogRepository.findByOriginalMaterialIdAndIsActiveTrueAndDeletedFalse(materialId)
                .stream()
                .map(MaterialAnalogResponse::fromEntity)
                .toList();
    }

    @Transactional
    public MaterialAnalogResponse createAnalog(CreateMaterialAnalogRequest request) {
        MaterialAnalog analog = MaterialAnalog.builder()
                .originalMaterialId(request.originalMaterialId())
                .originalMaterialName(request.originalMaterialName())
                .analogMaterialId(request.analogMaterialId())
                .analogMaterialName(request.analogMaterialName())
                .substitutionType(request.substitutionType())
                .priceRatio(request.priceRatio())
                .qualityRating(request.qualityRating())
                .conditions(request.conditions())
                .isActive(true)
                .build();

        analog = analogRepository.save(analog);
        auditService.logCreate("MaterialAnalog", analog.getId());

        log.info("Material analog created: {} -> {} ({}) ({})",
                request.originalMaterialName(), request.analogMaterialName(),
                request.substitutionType(), analog.getId());
        return MaterialAnalogResponse.fromEntity(analog);
    }

    @Transactional
    public MaterialAnalogResponse updateAnalog(UUID id, UpdateMaterialAnalogRequest request) {
        MaterialAnalog analog = getAnalogOrThrow(id);

        if (request.originalMaterialName() != null) {
            analog.setOriginalMaterialName(request.originalMaterialName());
        }
        if (request.analogMaterialName() != null) {
            analog.setAnalogMaterialName(request.analogMaterialName());
        }
        if (request.substitutionType() != null) {
            analog.setSubstitutionType(request.substitutionType());
        }
        if (request.priceRatio() != null) {
            analog.setPriceRatio(request.priceRatio());
        }
        if (request.qualityRating() != null) {
            analog.setQualityRating(request.qualityRating());
        }
        if (request.conditions() != null) {
            analog.setConditions(request.conditions());
        }
        if (request.isActive() != null) {
            analog.setActive(request.isActive());
        }

        analog = analogRepository.save(analog);
        auditService.logUpdate("MaterialAnalog", analog.getId(), "multiple", null, null);

        log.info("Material analog updated: {}", analog.getId());
        return MaterialAnalogResponse.fromEntity(analog);
    }

    @Transactional
    public MaterialAnalogResponse approveAnalog(UUID id, UUID approvedById) {
        MaterialAnalog analog = getAnalogOrThrow(id);
        analog.setApprovedById(approvedById);
        analog.setApprovedAt(LocalDateTime.now());

        analog = analogRepository.save(analog);
        auditService.logUpdate("MaterialAnalog", analog.getId(), "approvedById", null, approvedById.toString());

        log.info("Material analog approved: {} by {}", id, approvedById);
        return MaterialAnalogResponse.fromEntity(analog);
    }

    @Transactional
    public void deleteAnalog(UUID id) {
        MaterialAnalog analog = getAnalogOrThrow(id);
        analog.softDelete();
        analogRepository.save(analog);
        auditService.logDelete("MaterialAnalog", analog.getId());

        log.info("Material analog deleted: {}", id);
    }

    // --- Analog Requests ---

    @Transactional(readOnly = true)
    public Page<AnalogRequestResponse> listRequests(UUID projectId, AnalogRequestStatus status, Pageable pageable) {
        if (projectId != null) {
            return requestRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(AnalogRequestResponse::fromEntity);
        }
        if (status != null) {
            return requestRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(AnalogRequestResponse::fromEntity);
        }
        return requestRepository.findByDeletedFalse(pageable)
                .map(AnalogRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AnalogRequestResponse getRequest(UUID id) {
        AnalogRequest request = getRequestOrThrow(id);
        return AnalogRequestResponse.fromEntity(request);
    }

    @Transactional
    public AnalogRequestResponse createRequest(CreateAnalogRequestRequest request) {
        AnalogRequest analogRequest = AnalogRequest.builder()
                .projectId(request.projectId())
                .originalMaterialId(request.originalMaterialId())
                .requestedById(request.requestedById())
                .reason(request.reason())
                .status(AnalogRequestStatus.PENDING)
                .build();

        analogRequest = requestRepository.save(analogRequest);
        auditService.logCreate("AnalogRequest", analogRequest.getId());

        log.info("Analog request created for material {} on project {} ({})",
                request.originalMaterialId(), request.projectId(), analogRequest.getId());
        return AnalogRequestResponse.fromEntity(analogRequest);
    }

    @Transactional
    public AnalogRequestResponse reviewRequest(UUID id, ReviewAnalogRequestRequest request) {
        AnalogRequest analogRequest = getRequestOrThrow(id);

        if (analogRequest.getStatus() != AnalogRequestStatus.PENDING) {
            throw new IllegalStateException("Заявка на аналог уже рассмотрена");
        }

        String oldStatus = analogRequest.getStatus().name();
        analogRequest.setStatus(request.status());
        analogRequest.setApprovedById(request.approvedById());
        analogRequest.setReviewComment(request.reviewComment());

        if (request.status() == AnalogRequestStatus.APPROVED && request.approvedAnalogId() != null) {
            analogRequest.setApprovedAnalogId(request.approvedAnalogId());
        }

        analogRequest = requestRepository.save(analogRequest);
        auditService.logStatusChange("AnalogRequest", analogRequest.getId(), oldStatus, request.status().name());

        log.info("Analog request reviewed: {} -> {} by {} ({})",
                id, request.status(), request.approvedById(), analogRequest.getId());
        return AnalogRequestResponse.fromEntity(analogRequest);
    }

    @Transactional(readOnly = true)
    public List<AnalogRequestResponse> getPendingRequests() {
        return requestRepository.findByStatusAndDeletedFalse(AnalogRequestStatus.PENDING)
                .stream()
                .map(AnalogRequestResponse::fromEntity)
                .toList();
    }

    private MaterialAnalog getAnalogOrThrow(UUID id) {
        return analogRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Аналог материала не найден: " + id));
    }

    private AnalogRequest getRequestOrThrow(UUID id) {
        return requestRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Заявка на аналог не найдена: " + id));
    }
}
