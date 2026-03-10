package com.privod.platform.modules.task.service;

import com.privod.platform.modules.task.domain.DependencyType;
import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskDependency;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import com.privod.platform.modules.task.repository.TaskDependencyRepository;
import com.privod.platform.modules.task.web.dto.CreateTaskDependencyRequest;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskDependencyService {

    private final TaskDependencyRepository dependencyRepository;
    private final ProjectTaskRepository taskRepository;

    @Transactional
    public TaskDependencyResponse createDependency(UUID organizationId, CreateTaskDependencyRequest request) {
        UUID predecessorId = request.predecessorTaskId();
        UUID successorId = request.successorTaskId();

        if (predecessorId.equals(successorId)) {
            throw new IllegalArgumentException("Задача не может зависеть от самой себя");
        }

        ProjectTask predecessor = getTaskOrThrow(predecessorId);
        ProjectTask successor = getTaskOrThrow(successorId);

        if (dependencyRepository.existsByTaskIdAndDependsOnTaskId(successorId, predecessorId)) {
            throw new IllegalStateException("Зависимость уже существует");
        }

        // Circular dependency check: ensure successor is not already a (transitive) predecessor of predecessor
        if (wouldCreateCycle(predecessorId, successorId)) {
            throw new IllegalStateException("Создание этой зависимости приведёт к циклической зависимости");
        }

        DependencyType type = request.dependencyType() != null
                ? request.dependencyType()
                : DependencyType.FINISH_TO_START;
        int lagDays = request.lagDays() != null ? request.lagDays() : 0;

        TaskDependency dependency = TaskDependency.builder()
                .taskId(successorId)
                .dependsOnTaskId(predecessorId)
                .dependencyType(type)
                .lagDays(lagDays)
                .build();

        dependency = dependencyRepository.save(dependency);

        log.info("Dependency created: {} -> {} (type={}, lag={})",
                predecessorId, successorId, type, lagDays);

        return TaskDependencyResponse.fromEntity(dependency,
                predecessor.getCode(), predecessor.getTitle());
    }

    @Transactional
    public void deleteDependency(UUID organizationId, UUID dependencyId) {
        TaskDependency dependency = dependencyRepository.findById(dependencyId)
                .orElseThrow(() -> new EntityNotFoundException("Зависимость не найдена: " + dependencyId));

        dependencyRepository.delete(dependency);
        log.info("Dependency deleted: {} (predecessor={}, successor={})",
                dependencyId, dependency.getDependsOnTaskId(), dependency.getTaskId());
    }

    @Transactional(readOnly = true)
    public List<TaskDependencyResponse> getDependencies(UUID organizationId, UUID taskId) {
        getTaskOrThrow(taskId);

        List<TaskDependency> dependencies = dependencyRepository
                .findByTaskIdOrDependsOnTaskId(taskId, taskId);

        return enrichWithTitles(dependencies);
    }

    @Transactional(readOnly = true)
    public List<TaskDependencyResponse> getProjectDependencies(UUID organizationId, UUID projectId) {
        List<TaskDependency> dependencies = dependencyRepository.findAllByProjectId(projectId);
        return enrichWithTitles(dependencies);
    }

    /**
     * Basic critical path analysis using topological sort and longest-path computation.
     * Returns an ordered list of task IDs representing the critical path (longest chain of dependencies).
     */
    @Transactional(readOnly = true)
    public List<CriticalPathEntry> getCriticalPath(UUID organizationId, UUID projectId) {
        List<ProjectTask> tasks = taskRepository
                .findByProjectIdAndDeletedFalseOrderByPlannedStartDateAscSortOrderAsc(projectId);

        if (tasks.isEmpty()) {
            return List.of();
        }

        List<TaskDependency> dependencies = dependencyRepository.findAllByProjectId(projectId);

        // Build adjacency: predecessorId -> list of (successorId, lagDays)
        Map<UUID, List<DependencyEdge>> adjacency = new HashMap<>();
        Map<UUID, Integer> inDegree = new HashMap<>();
        Map<UUID, ProjectTask> taskMap = new HashMap<>();

        for (ProjectTask task : tasks) {
            taskMap.put(task.getId(), task);
            adjacency.put(task.getId(), new ArrayList<>());
            inDegree.put(task.getId(), 0);
        }

        for (TaskDependency dep : dependencies) {
            UUID pred = dep.getDependsOnTaskId();
            UUID succ = dep.getTaskId();
            if (taskMap.containsKey(pred) && taskMap.containsKey(succ)) {
                adjacency.computeIfAbsent(pred, k -> new ArrayList<>())
                        .add(new DependencyEdge(succ, dep.getLagDays(), dep.getDependencyType()));
                inDegree.merge(succ, 1, Integer::sum);
            }
        }

        // Topological sort (Kahn's algorithm) + longest path (early start/finish)
        Map<UUID, Long> earlyFinish = new HashMap<>();
        Map<UUID, UUID> predecessor = new LinkedHashMap<>(); // for path reconstruction
        Queue<UUID> queue = new LinkedList<>();

        for (var entry : inDegree.entrySet()) {
            UUID taskId = entry.getKey();
            long duration = computeTaskDuration(taskMap.get(taskId));
            if (entry.getValue() == 0) {
                queue.add(taskId);
                earlyFinish.put(taskId, duration);
            } else {
                earlyFinish.put(taskId, 0L);
            }
            predecessor.put(taskId, null);
        }

        List<UUID> topoOrder = new ArrayList<>();
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            topoOrder.add(current);
            long currentEF = earlyFinish.get(current);

            for (DependencyEdge edge : adjacency.getOrDefault(current, List.of())) {
                long succDuration = computeTaskDuration(taskMap.get(edge.successorId));
                long candidateEF = currentEF + edge.lagDays + succDuration;

                if (candidateEF > earlyFinish.getOrDefault(edge.successorId, 0L)) {
                    earlyFinish.put(edge.successorId, candidateEF);
                    predecessor.put(edge.successorId, current);
                }

                int newIn = inDegree.get(edge.successorId) - 1;
                inDegree.put(edge.successorId, newIn);
                if (newIn == 0) {
                    queue.add(edge.successorId);
                }
            }
        }

        // Find the task with the maximum early finish — that's the end of the critical path
        UUID endTask = null;
        long maxEF = 0;
        for (var entry : earlyFinish.entrySet()) {
            if (entry.getValue() >= maxEF) {
                maxEF = entry.getValue();
                endTask = entry.getKey();
            }
        }

        // Reconstruct the critical path by walking backward
        List<CriticalPathEntry> criticalPath = new ArrayList<>();
        UUID current = endTask;
        while (current != null) {
            ProjectTask task = taskMap.get(current);
            if (task != null) {
                criticalPath.add(0, new CriticalPathEntry(
                        task.getId(),
                        task.getCode(),
                        task.getTitle(),
                        task.getPlannedStartDate(),
                        task.getPlannedEndDate(),
                        computeTaskDuration(task),
                        earlyFinish.get(current)
                ));
            }
            current = predecessor.get(current);
        }

        return criticalPath;
    }

    // ─── Internal helpers ───

    /**
     * Checks if adding successor as dependent on predecessor would create a cycle.
     * Walks from predecessor backward through its own predecessors to see if successor is reachable.
     */
    private boolean wouldCreateCycle(UUID predecessorId, UUID successorId) {
        Set<UUID> visited = new HashSet<>();
        Queue<UUID> queue = new LinkedList<>();
        queue.add(predecessorId);

        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (current.equals(successorId)) {
                return true;
            }
            if (!visited.add(current)) {
                continue;
            }
            // Find all tasks that "current" depends on (current is the successor in those edges)
            List<TaskDependency> deps = dependencyRepository.findByTaskId(current);
            for (TaskDependency dep : deps) {
                queue.add(dep.getDependsOnTaskId());
            }
        }
        return false;
    }

    private List<TaskDependencyResponse> enrichWithTitles(List<TaskDependency> dependencies) {
        if (dependencies.isEmpty()) {
            return List.of();
        }

        Set<UUID> taskIds = new HashSet<>();
        for (TaskDependency dep : dependencies) {
            taskIds.add(dep.getTaskId());
            taskIds.add(dep.getDependsOnTaskId());
        }

        Map<UUID, String> codeMap = new HashMap<>();
        Map<UUID, String> titleMap = new HashMap<>();
        taskRepository.findAllById(taskIds).forEach(t -> {
            codeMap.put(t.getId(), t.getCode());
            titleMap.put(t.getId(), t.getTitle());
        });

        return dependencies.stream()
                .map(dep -> TaskDependencyResponse.fromEntity(dep,
                        codeMap.get(dep.getDependsOnTaskId()),
                        titleMap.get(dep.getDependsOnTaskId())))
                .toList();
    }

    private ProjectTask getTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + id));
    }

    private long computeTaskDuration(ProjectTask task) {
        if (task.getPlannedStartDate() != null && task.getPlannedEndDate() != null) {
            long days = ChronoUnit.DAYS.between(task.getPlannedStartDate(), task.getPlannedEndDate());
            return Math.max(days, 1);
        }
        return 1; // default 1-day duration for tasks without planned dates
    }

    // ─── Inner record types ───

    private record DependencyEdge(UUID successorId, int lagDays, DependencyType type) {
    }

    public record CriticalPathEntry(
            UUID taskId,
            String taskCode,
            String taskTitle,
            LocalDate plannedStart,
            LocalDate plannedEnd,
            long durationDays,
            long earlyFinishDay
    ) {
    }
}
