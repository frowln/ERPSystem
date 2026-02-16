package com.privod.platform.modules.calendar.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.ScheduleItem;
import com.privod.platform.modules.calendar.repository.ConstructionScheduleRepository;
import com.privod.platform.modules.calendar.repository.ScheduleItemRepository;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleItemRequest;
import com.privod.platform.modules.calendar.web.dto.GanttItemResponse;
import com.privod.platform.modules.calendar.web.dto.ScheduleItemResponse;
import com.privod.platform.modules.calendar.web.dto.UpdateProgressRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateScheduleItemRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleItemService {

    private final ScheduleItemRepository itemRepository;
    private final ConstructionScheduleRepository scheduleRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ScheduleItemResponse> listItems(UUID scheduleId) {
        return itemRepository.findByScheduleIdAndDeletedFalseOrderBySortOrder(scheduleId)
                .stream()
                .map(ScheduleItemResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleItemResponse getItem(UUID itemId) {
        ScheduleItem item = getItemOrThrow(itemId);
        return ScheduleItemResponse.fromEntity(item);
    }

    @Transactional
    public ScheduleItemResponse createItem(UUID scheduleId, CreateScheduleItemRequest request) {
        scheduleRepository.findById(scheduleId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Календарный план не найден: " + scheduleId));

        int maxSortOrder = itemRepository.findMaxSortOrder(scheduleId);

        ScheduleItem item = ScheduleItem.builder()
                .scheduleId(scheduleId)
                .parentItemId(request.parentItemId())
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .workType(request.workType())
                .plannedStartDate(request.plannedStartDate())
                .plannedEndDate(request.plannedEndDate())
                .duration(request.duration())
                .progress(request.progress() != null ? request.progress() : 0)
                .predecessorItemId(request.predecessorItemId())
                .lagDays(request.lagDays() != null ? request.lagDays() : 0)
                .responsibleId(request.responsibleId())
                .responsibleName(request.responsibleName())
                .isCriticalPath(request.isCriticalPath())
                .sortOrder(maxSortOrder + 1)
                .build();

        item = itemRepository.save(item);
        auditService.logCreate("ScheduleItem", item.getId());

        log.info("Schedule item created: {} in schedule {} ({})",
                item.getName(), scheduleId, item.getId());
        return ScheduleItemResponse.fromEntity(item);
    }

    @Transactional
    public ScheduleItemResponse updateItem(UUID itemId, UpdateScheduleItemRequest request) {
        ScheduleItem item = getItemOrThrow(itemId);

        if (request.parentItemId() != null) {
            item.setParentItemId(request.parentItemId());
        }
        if (request.code() != null) {
            item.setCode(request.code());
        }
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.description() != null) {
            item.setDescription(request.description());
        }
        if (request.workType() != null) {
            item.setWorkType(request.workType());
        }
        if (request.plannedStartDate() != null) {
            item.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            item.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            item.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            item.setActualEndDate(request.actualEndDate());
        }
        if (request.duration() != null) {
            item.setDuration(request.duration());
        }
        if (request.progress() != null) {
            item.setProgress(request.progress());
        }
        if (request.predecessorItemId() != null) {
            item.setPredecessorItemId(request.predecessorItemId());
        }
        if (request.lagDays() != null) {
            item.setLagDays(request.lagDays());
        }
        if (request.responsibleId() != null) {
            item.setResponsibleId(request.responsibleId());
        }
        if (request.responsibleName() != null) {
            item.setResponsibleName(request.responsibleName());
        }
        item.setCriticalPath(request.isCriticalPath());

        item = itemRepository.save(item);
        auditService.logUpdate("ScheduleItem", item.getId(), "multiple", null, null);

        log.info("Schedule item updated: {} ({})", item.getName(), item.getId());
        return ScheduleItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        ScheduleItem item = getItemOrThrow(itemId);
        item.softDelete();
        itemRepository.save(item);
        auditService.logDelete("ScheduleItem", itemId);
        log.info("Schedule item deleted: {} ({})", item.getName(), itemId);
    }

    @Transactional
    public ScheduleItemResponse updateProgress(UUID itemId, UpdateProgressRequest request) {
        ScheduleItem item = getItemOrThrow(itemId);
        int oldProgress = item.getProgress();
        item.setProgress(request.progress());
        item = itemRepository.save(item);

        auditService.logUpdate("ScheduleItem", item.getId(), "progress",
                String.valueOf(oldProgress), String.valueOf(request.progress()));

        log.info("Schedule item progress updated: {} -> {} ({})",
                oldProgress, request.progress(), item.getId());
        return ScheduleItemResponse.fromEntity(item);
    }

    @Transactional
    public List<ScheduleItemResponse> reorder(UUID scheduleId, List<UUID> itemIds) {
        List<ScheduleItem> items = itemRepository.findByScheduleIdAndDeletedFalseOrderBySortOrder(scheduleId);
        Map<UUID, ScheduleItem> itemMap = items.stream()
                .collect(Collectors.toMap(ScheduleItem::getId, i -> i));

        List<ScheduleItem> reordered = new ArrayList<>();
        for (int i = 0; i < itemIds.size(); i++) {
            ScheduleItem item = itemMap.get(itemIds.get(i));
            if (item != null) {
                item.setSortOrder(i);
                reordered.add(item);
            }
        }

        itemRepository.saveAll(reordered);
        log.info("Schedule items reordered for schedule: {}", scheduleId);

        return reordered.stream()
                .map(ScheduleItemResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GanttItemResponse> getScheduleGantt(UUID scheduleId) {
        List<ScheduleItem> allItems = itemRepository
                .findByScheduleIdAndDeletedFalseOrderBySortOrder(scheduleId);

        Map<UUID, List<ScheduleItem>> childrenMap = allItems.stream()
                .filter(item -> item.getParentItemId() != null)
                .collect(Collectors.groupingBy(ScheduleItem::getParentItemId));

        List<ScheduleItem> rootItems = allItems.stream()
                .filter(item -> item.getParentItemId() == null)
                .toList();

        return rootItems.stream()
                .map(item -> buildGanttTree(item, childrenMap))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleItemResponse> getCriticalPath(UUID scheduleId) {
        return itemRepository.findByScheduleIdAndIsCriticalPathTrueAndDeletedFalseOrderBySortOrder(scheduleId)
                .stream()
                .map(ScheduleItemResponse::fromEntity)
                .toList();
    }

    private GanttItemResponse buildGanttTree(ScheduleItem item, Map<UUID, List<ScheduleItem>> childrenMap) {
        List<ScheduleItem> children = childrenMap.getOrDefault(item.getId(), List.of());
        List<GanttItemResponse> childResponses = children.stream()
                .map(child -> buildGanttTree(child, childrenMap))
                .toList();
        return GanttItemResponse.fromEntity(item, childResponses);
    }

    private ScheduleItem getItemOrThrow(UUID id) {
        return itemRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция плана не найдена: " + id));
    }
}
