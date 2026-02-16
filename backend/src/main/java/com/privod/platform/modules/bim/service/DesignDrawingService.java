package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.DesignDrawing;
import com.privod.platform.modules.bim.domain.DrawingStatus;
import com.privod.platform.modules.bim.repository.DesignDrawingRepository;
import com.privod.platform.modules.bim.web.dto.CreateDesignDrawingRequest;
import com.privod.platform.modules.bim.web.dto.DesignDrawingResponse;
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
public class DesignDrawingService {

    private final DesignDrawingRepository designDrawingRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DesignDrawingResponse> listDrawings(UUID packageId, Pageable pageable) {
        if (packageId != null) {
            return designDrawingRepository.findByPackageIdAndDeletedFalse(packageId, pageable)
                    .map(DesignDrawingResponse::fromEntity);
        }
        return designDrawingRepository.findByDeletedFalse(pageable)
                .map(DesignDrawingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DesignDrawingResponse getDrawing(UUID id) {
        DesignDrawing drawing = getDrawingOrThrow(id);
        return DesignDrawingResponse.fromEntity(drawing);
    }

    @Transactional
    public DesignDrawingResponse createDrawing(CreateDesignDrawingRequest request) {
        DesignDrawing drawing = DesignDrawing.builder()
                .packageId(request.packageId())
                .number(request.number())
                .title(request.title())
                .revision(request.revision() != null ? request.revision() : "0")
                .scale(request.scale() != null ? request.scale() : "1:100")
                .format(request.format() != null ? request.format() : "A1")
                .fileUrl(request.fileUrl())
                .status(DrawingStatus.DRAFT)
                .discipline(request.discipline())
                .build();

        drawing = designDrawingRepository.save(drawing);
        auditService.logCreate("DesignDrawing", drawing.getId());

        log.info("Design drawing created: {} - {} ({})", drawing.getNumber(), drawing.getTitle(), drawing.getId());
        return DesignDrawingResponse.fromEntity(drawing);
    }

    @Transactional
    public DesignDrawingResponse updateDrawing(UUID id, CreateDesignDrawingRequest request) {
        DesignDrawing drawing = getDrawingOrThrow(id);

        drawing.setPackageId(request.packageId());
        drawing.setNumber(request.number());
        drawing.setTitle(request.title());
        drawing.setRevision(request.revision() != null ? request.revision() : "0");
        drawing.setScale(request.scale() != null ? request.scale() : "1:100");
        drawing.setFormat(request.format() != null ? request.format() : "A1");
        drawing.setFileUrl(request.fileUrl());
        drawing.setDiscipline(request.discipline());

        drawing = designDrawingRepository.save(drawing);
        auditService.logUpdate("DesignDrawing", drawing.getId(), "multiple", null, null);

        log.info("Design drawing updated: {} - {} ({})", drawing.getNumber(), drawing.getTitle(), drawing.getId());
        return DesignDrawingResponse.fromEntity(drawing);
    }

    @Transactional
    public DesignDrawingResponse setCurrentDrawing(UUID id) {
        DesignDrawing drawing = getDrawingOrThrow(id);

        if (drawing.getStatus() != DrawingStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Перевести в статус 'Действующий' можно только из статуса 'Черновик', текущий: '%s'",
                            drawing.getStatus().getDisplayName()));
        }

        DrawingStatus oldStatus = drawing.getStatus();
        drawing.setStatus(DrawingStatus.CURRENT);

        drawing = designDrawingRepository.save(drawing);
        auditService.logStatusChange("DesignDrawing", drawing.getId(),
                oldStatus.name(), DrawingStatus.CURRENT.name());

        log.info("Design drawing set to current: {} ({})", drawing.getNumber(), drawing.getId());
        return DesignDrawingResponse.fromEntity(drawing);
    }

    @Transactional
    public DesignDrawingResponse supersedeDrawing(UUID id) {
        DesignDrawing drawing = getDrawingOrThrow(id);

        if (drawing.getStatus() != DrawingStatus.CURRENT) {
            throw new IllegalStateException(
                    String.format("Заместить можно только действующий чертёж, текущий статус: '%s'",
                            drawing.getStatus().getDisplayName()));
        }

        DrawingStatus oldStatus = drawing.getStatus();
        drawing.setStatus(DrawingStatus.SUPERSEDED);

        drawing = designDrawingRepository.save(drawing);
        auditService.logStatusChange("DesignDrawing", drawing.getId(),
                oldStatus.name(), DrawingStatus.SUPERSEDED.name());

        log.info("Design drawing superseded: {} ({})", drawing.getNumber(), drawing.getId());
        return DesignDrawingResponse.fromEntity(drawing);
    }

    @Transactional
    public void deleteDrawing(UUID id) {
        DesignDrawing drawing = getDrawingOrThrow(id);
        drawing.softDelete();
        designDrawingRepository.save(drawing);
        auditService.logDelete("DesignDrawing", drawing.getId());

        log.info("Design drawing deleted: {} ({})", drawing.getNumber(), drawing.getId());
    }

    private DesignDrawing getDrawingOrThrow(UUID id) {
        return designDrawingRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Чертёж не найден: " + id));
    }
}
