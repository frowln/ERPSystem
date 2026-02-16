package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.ResourceAllocation;
import com.privod.platform.modules.planning.repository.ResourceAllocationRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateResourceAllocationRequest;
import com.privod.platform.modules.planning.web.dto.ResourceAllocationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceAllocationService {

    private final ResourceAllocationRepository allocationRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ResourceAllocationResponse> findByWbsNode(UUID wbsNodeId, Pageable pageable) {
        if (wbsNodeId == null) {
            return allocationRepository.findByDeletedFalse(pageable)
                    .map(ResourceAllocationResponse::fromEntity);
        }
        return allocationRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId, pageable)
                .map(ResourceAllocationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ResourceAllocationResponse> findAllByWbsNode(UUID wbsNodeId) {
        return allocationRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId)
                .stream()
                .map(ResourceAllocationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceAllocationResponse findById(UUID id) {
        ResourceAllocation alloc = getAllocationOrThrow(id);
        return ResourceAllocationResponse.fromEntity(alloc);
    }

    @Transactional
    public ResourceAllocationResponse create(CreateResourceAllocationRequest request) {
        wbsNodeRepository.findById(request.wbsNodeId())
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Узел WBS не найден: " + request.wbsNodeId()));

        validateDates(request.startDate(), request.endDate());

        ResourceAllocation alloc = ResourceAllocation.builder()
                .wbsNodeId(request.wbsNodeId())
                .resourceType(request.resourceType())
                .resourceId(request.resourceId())
                .resourceName(request.resourceName())
                .plannedUnits(request.plannedUnits())
                .actualUnits(request.actualUnits() != null ? request.actualUnits() : BigDecimal.ZERO)
                .unitRate(request.unitRate())
                .plannedCost(request.plannedCost())
                .actualCost(request.actualCost() != null ? request.actualCost() : BigDecimal.ZERO)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();

        alloc = allocationRepository.save(alloc);
        auditService.logCreate("ResourceAllocation", alloc.getId());

        log.info("Распределение ресурса создано: {} для узла WBS {} ({})",
                alloc.getResourceName(), alloc.getWbsNodeId(), alloc.getId());
        return ResourceAllocationResponse.fromEntity(alloc);
    }

    @Transactional
    public void delete(UUID id) {
        ResourceAllocation alloc = getAllocationOrThrow(id);
        alloc.softDelete();
        allocationRepository.save(alloc);
        auditService.logDelete("ResourceAllocation", id);
        log.info("Распределение ресурса удалено: {}", id);
    }

    private ResourceAllocation getAllocationOrThrow(UUID id) {
        return allocationRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Распределение ресурса не найдено: " + id));
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }
}
