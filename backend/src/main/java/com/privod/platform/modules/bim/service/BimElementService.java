package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.BimElement;
import com.privod.platform.modules.bim.repository.BimElementRepository;
import com.privod.platform.modules.bim.web.dto.BimElementResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimElementRequest;
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
public class BimElementService {

    private final BimElementRepository bimElementRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<BimElementResponse> listElements(UUID modelId, Pageable pageable) {
        if (modelId != null) {
            return bimElementRepository.findByModelIdAndDeletedFalse(modelId, pageable)
                    .map(BimElementResponse::fromEntity);
        }
        return bimElementRepository.findByDeletedFalse(pageable)
                .map(BimElementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BimElementResponse getElement(UUID id) {
        BimElement element = getElementOrThrow(id);
        return BimElementResponse.fromEntity(element);
    }

    @Transactional
    public BimElementResponse createElement(CreateBimElementRequest request) {
        BimElement element = BimElement.builder()
                .modelId(request.modelId())
                .elementId(request.elementId())
                .ifcType(request.ifcType())
                .name(request.name())
                .properties(request.properties())
                .geometry(request.geometry())
                .floor(request.floor())
                .zone(request.zone())
                .build();

        element = bimElementRepository.save(element);
        auditService.logCreate("BimElement", element.getId());

        log.info("BIM element created: {} ({}) for model {}", element.getElementId(), element.getId(), element.getModelId());
        return BimElementResponse.fromEntity(element);
    }

    @Transactional
    public BimElementResponse updateElement(UUID id, CreateBimElementRequest request) {
        BimElement element = getElementOrThrow(id);

        element.setModelId(request.modelId());
        element.setElementId(request.elementId());
        element.setIfcType(request.ifcType());
        element.setName(request.name());
        element.setProperties(request.properties());
        element.setGeometry(request.geometry());
        element.setFloor(request.floor());
        element.setZone(request.zone());

        element = bimElementRepository.save(element);
        auditService.logUpdate("BimElement", element.getId(), "multiple", null, null);

        log.info("BIM element updated: {} ({}) for model {}", element.getElementId(), element.getId(), element.getModelId());
        return BimElementResponse.fromEntity(element);
    }

    @Transactional
    public void deleteElement(UUID id) {
        BimElement element = getElementOrThrow(id);
        element.softDelete();
        bimElementRepository.save(element);
        auditService.logDelete("BimElement", element.getId());

        log.info("BIM element deleted: {} ({})", element.getElementId(), element.getId());
    }

    private BimElement getElementOrThrow(UUID id) {
        return bimElementRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM элемент не найден: " + id));
    }
}
