package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.WarehouseLocation;
import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;
import com.privod.platform.modules.warehouse.repository.WarehouseLocationRepository;
import com.privod.platform.modules.warehouse.web.dto.CreateWarehouseLocationRequest;
import com.privod.platform.modules.warehouse.web.dto.UpdateWarehouseLocationRequest;
import com.privod.platform.modules.warehouse.web.dto.WarehouseLocationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseLocationService {

    private final WarehouseLocationRepository locationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WarehouseLocationResponse> listLocations(String search, WarehouseLocationType locationType,
                                                          UUID projectId, Pageable pageable) {
        Specification<WarehouseLocation> spec = Specification
                .where(WarehouseLocationSpecification.notDeleted())
                .and(WarehouseLocationSpecification.hasLocationType(locationType))
                .and(WarehouseLocationSpecification.belongsToProject(projectId))
                .and(WarehouseLocationSpecification.searchByNameOrCode(search));

        return locationRepository.findAll(spec, pageable).map(WarehouseLocationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WarehouseLocationResponse getLocation(UUID id) {
        WarehouseLocation location = getLocationOrThrow(id);
        return WarehouseLocationResponse.fromEntity(location);
    }

    @Transactional(readOnly = true)
    public List<WarehouseLocationResponse> getChildren(UUID parentId) {
        return locationRepository.findByParentIdAndDeletedFalse(parentId)
                .stream()
                .map(WarehouseLocationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WarehouseLocationResponse createLocation(CreateWarehouseLocationRequest request) {
        if (request.code() != null && locationRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Склад с кодом '" + request.code() + "' уже существует");
        }

        WarehouseLocation location = WarehouseLocation.builder()
                .name(request.name())
                .code(request.code())
                .locationType(request.locationType())
                .projectId(request.projectId())
                .address(request.address())
                .responsibleId(request.responsibleId())
                .responsibleName(request.responsibleName())
                .parentId(request.parentId())
                .active(true)
                .build();

        location = locationRepository.save(location);
        auditService.logCreate("WarehouseLocation", location.getId());

        log.info("Warehouse location created: {} - {} ({})", location.getCode(), location.getName(), location.getId());
        return WarehouseLocationResponse.fromEntity(location);
    }

    @Transactional
    public WarehouseLocationResponse updateLocation(UUID id, UpdateWarehouseLocationRequest request) {
        WarehouseLocation location = getLocationOrThrow(id);

        if (request.name() != null) {
            location.setName(request.name());
        }
        if (request.code() != null) {
            if (!request.code().equals(location.getCode())
                    && locationRepository.existsByCodeAndDeletedFalse(request.code())) {
                throw new IllegalArgumentException("Склад с кодом '" + request.code() + "' уже существует");
            }
            location.setCode(request.code());
        }
        if (request.locationType() != null) {
            location.setLocationType(request.locationType());
        }
        if (request.projectId() != null) {
            location.setProjectId(request.projectId());
        }
        if (request.address() != null) {
            location.setAddress(request.address());
        }
        if (request.responsibleId() != null) {
            location.setResponsibleId(request.responsibleId());
        }
        if (request.responsibleName() != null) {
            location.setResponsibleName(request.responsibleName());
        }
        if (request.parentId() != null) {
            location.setParentId(request.parentId());
        }
        if (request.active() != null) {
            location.setActive(request.active());
        }

        location = locationRepository.save(location);
        auditService.logUpdate("WarehouseLocation", location.getId(), "multiple", null, null);

        log.info("Warehouse location updated: {} ({})", location.getName(), location.getId());
        return WarehouseLocationResponse.fromEntity(location);
    }

    @Transactional
    public void deleteLocation(UUID id) {
        WarehouseLocation location = getLocationOrThrow(id);
        location.softDelete();
        locationRepository.save(location);
        auditService.logDelete("WarehouseLocation", id);

        log.info("Warehouse location deleted: {} ({})", location.getName(), id);
    }

    private WarehouseLocation getLocationOrThrow(UUID id) {
        return locationRepository.findById(id)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Складская локация не найдена: " + id));
    }
}
