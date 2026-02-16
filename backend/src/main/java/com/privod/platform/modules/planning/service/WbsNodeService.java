package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.DependencyType;
import com.privod.platform.modules.planning.domain.WbsDependency;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;
import com.privod.platform.modules.planning.repository.WbsDependencyRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.web.dto.CreateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.UpdateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.WbsNodeResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WbsNodeService {

    private final WbsNodeRepository wbsNodeRepository;
    private final WbsDependencyRepository wbsDependencyRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WbsNodeResponse> findByProject(UUID projectId, Pageable pageable) {
        if (projectId == null) {
            return wbsNodeRepository.findByDeletedFalse(pageable)
                    .map(WbsNodeResponse::fromEntity);
        }
        return wbsNodeRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(WbsNodeResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WbsNodeResponse findById(UUID id) {
        WbsNode node = getNodeOrThrow(id);
        return WbsNodeResponse.fromEntity(node);
    }

    @Transactional(readOnly = true)
    public List<WbsNodeResponse> findTree(UUID projectId) {
        return wbsNodeRepository.findRootNodesByProjectId(projectId)
                .stream()
                .map(WbsNodeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WbsNodeResponse> findChildren(UUID parentId) {
        return wbsNodeRepository.findByParentIdAndDeletedFalseOrderBySortOrder(parentId)
                .stream()
                .map(WbsNodeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WbsNodeResponse> findCriticalPath(UUID projectId) {
        return wbsNodeRepository.findByProjectIdAndIsCriticalTrueAndDeletedFalse(projectId)
                .stream()
                .map(WbsNodeResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WbsNodeResponse create(CreateWbsNodeRequest request) {
        if (request.parentId() != null) {
            getNodeOrThrow(request.parentId());
        }

        validateDates(request.plannedStartDate(), request.plannedEndDate());

        WbsNode node = WbsNode.builder()
                .projectId(request.projectId())
                .parentId(request.parentId())
                .code(request.code())
                .name(request.name())
                .nodeType(request.nodeType() != null ? request.nodeType() : WbsNodeType.ACTIVITY)
                .level(request.level())
                .sortOrder(request.sortOrder())
                .plannedStartDate(request.plannedStartDate())
                .plannedEndDate(request.plannedEndDate())
                .duration(request.duration())
                .percentComplete(request.percentComplete() != null ? request.percentComplete() : BigDecimal.ZERO)
                .costCodeId(request.costCodeId())
                .responsibleId(request.responsibleId())
                .build();

        node = wbsNodeRepository.save(node);
        auditService.logCreate("WbsNode", node.getId());

        log.info("WBS узел создан: {} - {} ({})", node.getCode(), node.getName(), node.getId());
        return WbsNodeResponse.fromEntity(node);
    }

    @Transactional
    public WbsNodeResponse update(UUID id, UpdateWbsNodeRequest request) {
        WbsNode node = getNodeOrThrow(id);

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new IllegalArgumentException("Узел WBS не может быть родителем самого себя");
            }
            getNodeOrThrow(request.parentId());
            node.setParentId(request.parentId());
        }
        if (request.code() != null) {
            node.setCode(request.code());
        }
        if (request.name() != null) {
            node.setName(request.name());
        }
        if (request.nodeType() != null) {
            node.setNodeType(request.nodeType());
        }
        if (request.level() != null) {
            node.setLevel(request.level());
        }
        if (request.sortOrder() != null) {
            node.setSortOrder(request.sortOrder());
        }
        if (request.plannedStartDate() != null) {
            node.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            node.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            node.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            node.setActualEndDate(request.actualEndDate());
        }
        if (request.duration() != null) {
            node.setDuration(request.duration());
        }
        if (request.percentComplete() != null) {
            node.setPercentComplete(request.percentComplete());
        }
        if (request.costCodeId() != null) {
            node.setCostCodeId(request.costCodeId());
        }
        if (request.responsibleId() != null) {
            node.setResponsibleId(request.responsibleId());
        }

        validateDates(node.getPlannedStartDate(), node.getPlannedEndDate());

        node = wbsNodeRepository.save(node);
        auditService.logUpdate("WbsNode", node.getId(), "multiple", null, null);

        log.info("WBS узел обновлён: {} ({})", node.getName(), node.getId());
        return WbsNodeResponse.fromEntity(node);
    }

    @Transactional
    public void delete(UUID id) {
        WbsNode node = getNodeOrThrow(id);
        node.softDelete();
        wbsNodeRepository.save(node);
        auditService.logDelete("WbsNode", id);
        log.info("WBS узел удалён: {} ({})", node.getName(), id);
    }

    /**
     * Full CPM recalculation: forward pass → backward pass → float → critical path.
     */
    @Transactional
    public void recalculateCpm(UUID projectId) {
        calculateForwardPass(projectId);
        calculateBackwardPass(projectId);
        log.info("CPM пересчитан для проекта {}", projectId);
    }

    /**
     * Forward pass: calculates Early Start (ES) and Early Finish (EF) for all nodes.
     * Uses topological sort (Kahn's algorithm) to process nodes in dependency order.
     */
    @Transactional
    public void calculateForwardPass(UUID projectId) {
        List<WbsNode> nodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);
        if (nodes.isEmpty()) return;

        List<WbsDependency> dependencies = wbsDependencyRepository.findByProjectId(projectId);
        Map<UUID, WbsNode> nodeMap = new HashMap<>();
        nodes.forEach(n -> nodeMap.put(n.getId(), n));

        // Build adjacency: successor → list of dependencies where it is the successor
        Map<UUID, List<WbsDependency>> incomingDeps = new HashMap<>();
        Map<UUID, Integer> inDegree = new HashMap<>();
        nodes.forEach(n -> {
            incomingDeps.put(n.getId(), new ArrayList<>());
            inDegree.put(n.getId(), 0);
        });

        for (WbsDependency dep : dependencies) {
            if (nodeMap.containsKey(dep.getSuccessorId())) {
                incomingDeps.get(dep.getSuccessorId()).add(dep);
                inDegree.merge(dep.getSuccessorId(), 1, Integer::sum);
            }
        }

        // Topological sort via Kahn's algorithm
        Queue<UUID> queue = new LinkedList<>();
        for (WbsNode node : nodes) {
            if (inDegree.getOrDefault(node.getId(), 0) == 0) {
                queue.add(node.getId());
            }
        }

        // Determine project start date
        LocalDate projectStart = nodes.stream()
                .map(WbsNode::getPlannedStartDate)
                .filter(d -> d != null)
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());

        List<UUID> topoOrder = new ArrayList<>();
        while (!queue.isEmpty()) {
            UUID nodeId = queue.poll();
            topoOrder.add(nodeId);
            WbsNode current = nodeMap.get(nodeId);

            // If no predecessors, ES = planned start or project start
            if (incomingDeps.get(nodeId).isEmpty()) {
                current.setEarlyStart(current.getPlannedStartDate() != null ? current.getPlannedStartDate() : projectStart);
            } else {
                // ES = max(constraint from each predecessor)
                LocalDate maxEs = null;
                for (WbsDependency dep : incomingDeps.get(nodeId)) {
                    WbsNode pred = nodeMap.get(dep.getPredecessorId());
                    if (pred == null) continue;
                    LocalDate constraint = calculateForwardConstraint(pred, current, dep);
                    if (maxEs == null || (constraint != null && constraint.isAfter(maxEs))) {
                        maxEs = constraint;
                    }
                }
                current.setEarlyStart(maxEs != null ? maxEs : projectStart);
            }

            // EF = ES + duration - 1 (inclusive)
            int dur = current.getDuration() != null && current.getDuration() > 0 ? current.getDuration() : 1;
            current.setEarlyFinish(current.getEarlyStart().plusDays(dur - 1));

            // Reduce in-degree for successors
            for (WbsDependency dep : dependencies) {
                if (dep.getPredecessorId().equals(nodeId) && nodeMap.containsKey(dep.getSuccessorId())) {
                    int newDeg = inDegree.get(dep.getSuccessorId()) - 1;
                    inDegree.put(dep.getSuccessorId(), newDeg);
                    if (newDeg == 0) {
                        queue.add(dep.getSuccessorId());
                    }
                }
            }
        }

        wbsNodeRepository.saveAll(nodes);
        log.info("Прямой проход CPM для проекта {}: {} узлов обработано", projectId, topoOrder.size());
    }

    /**
     * Backward pass: calculates Late Start (LS), Late Finish (LF), Total Float, Free Float,
     * and marks critical path nodes.
     */
    @Transactional
    public void calculateBackwardPass(UUID projectId) {
        List<WbsNode> nodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);
        if (nodes.isEmpty()) return;

        List<WbsDependency> dependencies = wbsDependencyRepository.findByProjectId(projectId);
        Map<UUID, WbsNode> nodeMap = new HashMap<>();
        nodes.forEach(n -> nodeMap.put(n.getId(), n));

        // Build outgoing deps: predecessor → list of dependencies
        Map<UUID, List<WbsDependency>> outgoingDeps = new HashMap<>();
        nodes.forEach(n -> outgoingDeps.put(n.getId(), new ArrayList<>()));

        for (WbsDependency dep : dependencies) {
            if (nodeMap.containsKey(dep.getPredecessorId())) {
                outgoingDeps.get(dep.getPredecessorId()).add(dep);
            }
        }

        // Find the project end date (latest early finish)
        LocalDate projectEnd = nodes.stream()
                .map(WbsNode::getEarlyFinish)
                .filter(d -> d != null)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());

        // Reverse topological order: start from terminal nodes (no outgoing)
        Map<UUID, Integer> outDegree = new HashMap<>();
        nodes.forEach(n -> outDegree.put(n.getId(), 0));
        for (WbsDependency dep : dependencies) {
            if (nodeMap.containsKey(dep.getPredecessorId())) {
                outDegree.merge(dep.getPredecessorId(), 1, Integer::sum);
            }
        }

        Queue<UUID> queue = new LinkedList<>();
        for (WbsNode node : nodes) {
            if (outDegree.getOrDefault(node.getId(), 0) == 0) {
                queue.add(node.getId());
            }
        }

        while (!queue.isEmpty()) {
            UUID nodeId = queue.poll();
            WbsNode current = nodeMap.get(nodeId);

            // If no successors, LF = project end
            if (outgoingDeps.get(nodeId).isEmpty()) {
                current.setLateFinish(projectEnd);
            } else {
                // LF = min(constraint from each successor)
                LocalDate minLf = null;
                for (WbsDependency dep : outgoingDeps.get(nodeId)) {
                    WbsNode succ = nodeMap.get(dep.getSuccessorId());
                    if (succ == null) continue;
                    LocalDate constraint = calculateBackwardConstraint(current, succ, dep);
                    if (minLf == null || (constraint != null && constraint.isBefore(minLf))) {
                        minLf = constraint;
                    }
                }
                current.setLateFinish(minLf != null ? minLf : projectEnd);
            }

            // LS = LF - duration + 1
            int dur = current.getDuration() != null && current.getDuration() > 0 ? current.getDuration() : 1;
            current.setLateStart(current.getLateFinish().minusDays(dur - 1));

            // Total Float = LS - ES (in days)
            if (current.getEarlyStart() != null && current.getLateStart() != null) {
                int totalFloat = (int) java.time.temporal.ChronoUnit.DAYS.between(current.getEarlyStart(), current.getLateStart());
                current.setTotalFloat(totalFloat);
                current.setIsCritical(totalFloat == 0);
            }

            // Free Float = min(ES_successor - EF_current - 1) for FS dependencies
            int freeFloat = Integer.MAX_VALUE;
            for (WbsDependency dep : outgoingDeps.get(nodeId)) {
                WbsNode succ = nodeMap.get(dep.getSuccessorId());
                if (succ != null && succ.getEarlyStart() != null && current.getEarlyFinish() != null
                        && dep.getDependencyType() == DependencyType.FINISH_TO_START) {
                    int ff = (int) java.time.temporal.ChronoUnit.DAYS.between(current.getEarlyFinish(), succ.getEarlyStart()) - 1 + (dep.getLagDays() != null ? dep.getLagDays() : 0);
                    freeFloat = Math.min(freeFloat, ff);
                }
            }
            current.setFreeFloat(freeFloat == Integer.MAX_VALUE ? 0 : Math.max(0, freeFloat));

            // Reduce out-degree for predecessors
            for (WbsDependency dep : dependencies) {
                if (dep.getSuccessorId().equals(nodeId) && nodeMap.containsKey(dep.getPredecessorId())) {
                    int newDeg = outDegree.get(dep.getPredecessorId()) - 1;
                    outDegree.put(dep.getPredecessorId(), newDeg);
                    if (newDeg == 0) {
                        queue.add(dep.getPredecessorId());
                    }
                }
            }
        }

        wbsNodeRepository.saveAll(nodes);
        long criticalCount = nodes.stream().filter(n -> Boolean.TRUE.equals(n.getIsCritical())).count();
        log.info("Обратный проход CPM для проекта {}: {} узлов, {} на критическом пути", projectId, nodes.size(), criticalCount);
    }

    /**
     * Calculates the forward constraint date for a successor based on dependency type.
     */
    private LocalDate calculateForwardConstraint(WbsNode pred, WbsNode succ, WbsDependency dep) {
        int lag = dep.getLagDays() != null ? dep.getLagDays() : 0;
        return switch (dep.getDependencyType()) {
            case FINISH_TO_START ->
                    pred.getEarlyFinish() != null ? pred.getEarlyFinish().plusDays(1 + lag) : null;
            case START_TO_START ->
                    pred.getEarlyStart() != null ? pred.getEarlyStart().plusDays(lag) : null;
            case FINISH_TO_FINISH -> {
                if (pred.getEarlyFinish() == null) yield null;
                int succDur = succ.getDuration() != null && succ.getDuration() > 0 ? succ.getDuration() : 1;
                yield pred.getEarlyFinish().plusDays(lag).minusDays(succDur - 1);
            }
            case START_TO_FINISH -> {
                if (pred.getEarlyStart() == null) yield null;
                int succDur = succ.getDuration() != null && succ.getDuration() > 0 ? succ.getDuration() : 1;
                yield pred.getEarlyStart().plusDays(lag).minusDays(succDur - 1);
            }
        };
    }

    /**
     * Calculates the backward constraint date for a predecessor based on dependency type.
     */
    private LocalDate calculateBackwardConstraint(WbsNode pred, WbsNode succ, WbsDependency dep) {
        int lag = dep.getLagDays() != null ? dep.getLagDays() : 0;
        return switch (dep.getDependencyType()) {
            case FINISH_TO_START ->
                    succ.getLateStart() != null ? succ.getLateStart().minusDays(1 + lag) : null;
            case START_TO_START -> {
                if (succ.getLateStart() == null) yield null;
                int predDur = pred.getDuration() != null && pred.getDuration() > 0 ? pred.getDuration() : 1;
                yield succ.getLateStart().minusDays(lag).plusDays(predDur - 1);
            }
            case FINISH_TO_FINISH ->
                    succ.getLateFinish() != null ? succ.getLateFinish().minusDays(lag) : null;
            case START_TO_FINISH -> {
                if (succ.getLateFinish() == null) yield null;
                int predDur = pred.getDuration() != null && pred.getDuration() > 0 ? pred.getDuration() : 1;
                yield succ.getLateFinish().minusDays(lag).plusDays(predDur - 1);
            }
        };
    }

    private WbsNode getNodeOrThrow(UUID id) {
        return wbsNodeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Узел WBS не найден: " + id));
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }
}
