package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.BimModelStatus;
import com.privod.platform.modules.bim.repository.BimModelRepository;
import com.privod.platform.modules.bim.web.dto.BimModelResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimModelRequest;
import com.privod.platform.modules.bim.web.dto.UpdateBimModelRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BimModelService {

    private final BimModelRepository bimModelRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<BimModelResponse> listModels(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return bimModelRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(BimModelResponse::fromEntity);
        }
        return bimModelRepository.findByDeletedFalse(pageable)
                .map(BimModelResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BimModelResponse getModel(UUID id) {
        BimModel model = getModelOrThrow(id);
        return BimModelResponse.fromEntity(model);
    }

    @Transactional
    public BimModelResponse createModel(CreateBimModelRequest request) {
        BimModel model = BimModel.builder()
                .name(request.name())
                .projectId(request.projectId())
                .modelType(request.modelType())
                .format(request.format())
                .fileUrl(request.fileUrl())
                .fileSize(request.fileSize())
                .description(request.description())
                .status(BimModelStatus.DRAFT)
                .uploadedById(request.uploadedById())
                .elementCount(0)
                .modelVersion(1)
                .build();

        model = bimModelRepository.save(model);
        auditService.logCreate("BimModel", model.getId());

        log.info("BIM model created: {} ({})", model.getName(), model.getId());
        return BimModelResponse.fromEntity(model);
    }

    @Transactional
    public BimModelResponse updateModel(UUID id, UpdateBimModelRequest request) {
        BimModel model = getModelOrThrow(id);

        if (request.name() != null) {
            model.setName(request.name());
        }
        if (request.modelType() != null) {
            model.setModelType(request.modelType());
        }
        if (request.format() != null) {
            model.setFormat(request.format());
        }
        if (request.fileUrl() != null) {
            model.setFileUrl(request.fileUrl());
        }
        if (request.fileSize() != null) {
            model.setFileSize(request.fileSize());
        }
        if (request.description() != null) {
            model.setDescription(request.description());
        }
        if (request.status() != null) {
            model.setStatus(request.status());
        }
        if (request.uploadedById() != null) {
            model.setUploadedById(request.uploadedById());
        }
        if (request.elementCount() != null) {
            model.setElementCount(request.elementCount());
        }

        model = bimModelRepository.save(model);
        auditService.logUpdate("BimModel", model.getId(), "multiple", null, null);

        log.info("BIM model updated: {} ({})", model.getName(), model.getId());
        return BimModelResponse.fromEntity(model);
    }

    @Transactional
    public BimModelResponse importModel(UUID id) {
        BimModel model = getModelOrThrow(id);

        if (model.getStatus() != BimModelStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Невозможно импортировать модель из статуса '%s'",
                            model.getStatus().getDisplayName()));
        }

        BimModelStatus oldStatus = model.getStatus();
        model.setStatus(BimModelStatus.IMPORTED);

        model = bimModelRepository.save(model);
        auditService.logStatusChange("BimModel", model.getId(),
                oldStatus.name(), BimModelStatus.IMPORTED.name());

        log.info("BIM model imported: {} ({})", model.getName(), model.getId());
        return BimModelResponse.fromEntity(model);
    }

    @Transactional
    public BimModelResponse processModel(UUID id) {
        BimModel model = getModelOrThrow(id);

        if (model.getStatus() != BimModelStatus.IMPORTED) {
            throw new IllegalStateException(
                    String.format("Невозможно обработать модель из статуса '%s'",
                            model.getStatus().getDisplayName()));
        }

        BimModelStatus oldStatus = model.getStatus();
        model.setStatus(BimModelStatus.PROCESSED);

        model = bimModelRepository.save(model);
        auditService.logStatusChange("BimModel", model.getId(),
                oldStatus.name(), BimModelStatus.PROCESSED.name());

        log.info("BIM model processed: {} ({})", model.getName(), model.getId());
        return BimModelResponse.fromEntity(model);
    }

    @Transactional
    public void deleteModel(UUID id) {
        BimModel model = getModelOrThrow(id);
        model.softDelete();
        bimModelRepository.save(model);
        auditService.logDelete("BimModel", model.getId());

        log.info("BIM model deleted: {} ({})", model.getName(), model.getId());
    }

    private BimModel getModelOrThrow(UUID id) {
        return bimModelRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель не найдена: " + id));
    }
}
