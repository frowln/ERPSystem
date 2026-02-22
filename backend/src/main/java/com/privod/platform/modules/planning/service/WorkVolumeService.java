package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.domain.WorkVolumeEntry;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.repository.WorkVolumeEntryRepository;
import com.privod.platform.modules.planning.web.dto.CreateWorkVolumeEntryRequest;
import com.privod.platform.modules.planning.web.dto.WorkVolumeEntryResponse;
import com.privod.platform.modules.planning.web.dto.WorkVolumeSummaryResponse;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkVolumeService {

    private final WorkVolumeEntryRepository workVolumeEntryRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WorkVolumeEntryResponse> findByProject(UUID projectId, Pageable pageable) {
        validateProjectAccess(projectId);
        return workVolumeEntryRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(WorkVolumeEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<WorkVolumeEntryResponse> findByWbsNode(UUID wbsNodeId, Pageable pageable) {
        return workVolumeEntryRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId, pageable)
                .map(WorkVolumeEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkVolumeEntryResponse findById(UUID id) {
        WorkVolumeEntry entry = workVolumeEntryRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись объёма работ не найдена: " + id));
        return WorkVolumeEntryResponse.fromEntity(entry);
    }

    @Transactional(readOnly = true)
    public List<WorkVolumeEntryResponse> findByProjectAndDate(UUID projectId, LocalDate date) {
        validateProjectAccess(projectId);
        return workVolumeEntryRepository.findByProjectIdAndRecordDateAndDeletedFalse(projectId, date)
                .stream()
                .map(WorkVolumeEntryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WorkVolumeEntryResponse create(CreateWorkVolumeEntryRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        validateProjectAccess(request.projectId());

        WbsNode node = wbsNodeRepository.findById(request.wbsNodeId())
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Узел WBS не найден: " + request.wbsNodeId()));

        if (!node.getProjectId().equals(request.projectId())) {
            throw new IllegalArgumentException("Узел WBS не принадлежит указанному проекту");
        }

        WorkVolumeEntry entry = WorkVolumeEntry.builder()
                .organizationId(currentOrgId)
                .projectId(request.projectId())
                .wbsNodeId(request.wbsNodeId())
                .recordDate(request.recordDate())
                .quantity(request.quantity())
                .unitOfMeasure(request.unitOfMeasure())
                .description(request.description())
                .notes(request.notes())
                .creatorId(currentUserId)
                .build();

        entry = workVolumeEntryRepository.save(entry);
        auditService.logCreate("WorkVolumeEntry", entry.getId());

        recalculateProgress(request.wbsNodeId());

        log.info("Запись объёма работ создана: узел {} дата {} кол-во {}",
                node.getCode(), request.recordDate(), request.quantity());
        return WorkVolumeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public WorkVolumeEntryResponse update(UUID id, CreateWorkVolumeEntryRequest request) {
        WorkVolumeEntry entry = workVolumeEntryRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись объёма работ не найдена: " + id));

        entry.setRecordDate(request.recordDate());
        entry.setQuantity(request.quantity());
        entry.setUnitOfMeasure(request.unitOfMeasure());
        entry.setDescription(request.description());
        entry.setNotes(request.notes());

        entry = workVolumeEntryRepository.save(entry);
        auditService.logUpdate("WorkVolumeEntry", entry.getId(), "multiple", null, null);

        recalculateProgress(entry.getWbsNodeId());

        return WorkVolumeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void delete(UUID id) {
        WorkVolumeEntry entry = workVolumeEntryRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись объёма работ не найдена: " + id));

        UUID wbsNodeId = entry.getWbsNodeId();
        entry.softDelete();
        workVolumeEntryRepository.save(entry);
        auditService.logDelete("WorkVolumeEntry", id);

        recalculateProgress(wbsNodeId);
    }

    @Transactional(readOnly = true)
    public List<WorkVolumeSummaryResponse> getVolumeSummary(UUID projectId, LocalDate date) {
        validateProjectAccess(projectId);

        List<WbsNode> nodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);
        List<Object[]> cumulativeData = workVolumeEntryRepository.sumQuantityGroupedByProject(projectId);

        Map<UUID, BigDecimal> cumulativeMap = new HashMap<>();
        for (Object[] row : cumulativeData) {
            cumulativeMap.put((UUID) row[0], (BigDecimal) row[1]);
        }

        Map<UUID, BigDecimal> todayMap = new HashMap<>();
        if (date != null) {
            List<WorkVolumeEntry> todayEntries = workVolumeEntryRepository
                    .findByProjectIdAndRecordDateAndDeletedFalse(projectId, date);
            for (WorkVolumeEntry e : todayEntries) {
                todayMap.put(e.getWbsNodeId(), e.getQuantity());
            }
        }

        List<WorkVolumeSummaryResponse> result = new ArrayList<>();
        for (WbsNode node : nodes) {
            if (node.getNodeType() == WbsNodeType.WORK_PACKAGE || node.getNodeType() == WbsNodeType.ACTIVITY) {
                result.add(WorkVolumeSummaryResponse.of(
                        node.getId(),
                        node.getCode(),
                        node.getName(),
                        node.getNodeType().name(),
                        node.getVolumeUnitOfMeasure(),
                        node.getPlannedVolume(),
                        cumulativeMap.getOrDefault(node.getId(), BigDecimal.ZERO),
                        todayMap.get(node.getId())
                ));
            }
        }
        return result;
    }

    private void recalculateProgress(UUID wbsNodeId) {
        WbsNode node = wbsNodeRepository.findById(wbsNodeId)
                .filter(n -> !n.isDeleted())
                .orElse(null);
        if (node == null || node.getPlannedVolume() == null || node.getPlannedVolume().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal cumulative = workVolumeEntryRepository.sumQuantityByWbsNodeId(wbsNodeId);
        BigDecimal percent = cumulative.multiply(BigDecimal.valueOf(100))
                .divide(node.getPlannedVolume(), 2, RoundingMode.HALF_UP)
                .min(BigDecimal.valueOf(100));

        node.setPercentComplete(percent);
        wbsNodeRepository.save(node);
        log.debug("Прогресс пересчитан для узла {}: {}%", node.getCode(), percent);
    }

    private void validateProjectAccess(UUID projectId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, currentOrgId)
                .orElseThrow(() -> new AccessDeniedException("Проект не найден или доступ запрещён"));
    }
}
