package com.privod.platform.modules.monteCarlo.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloResult;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloSimulation;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloTask;
import com.privod.platform.modules.monteCarlo.domain.SimulationStatus;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloResultRepository;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloSimulationRepository;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloTaskRepository;
import com.privod.platform.modules.monteCarlo.web.dto.CreateMonteCarloSimulationRequest;
import com.privod.platform.modules.monteCarlo.web.dto.CreateMonteCarloTaskRequest;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloResultResponse;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloSimulationResponse;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloTaskResponse;
import com.privod.platform.modules.monteCarlo.web.dto.UpdateMonteCarloSimulationRequest;
import com.privod.platform.modules.monteCarlo.web.dto.UpdateMonteCarloTaskRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonteCarloService {

    private final MonteCarloSimulationRepository simulationRepository;
    private final MonteCarloTaskRepository taskRepository;
    private final MonteCarloResultRepository resultRepository;
    private final AuditService auditService;

    // ---- Simulation CRUD ----

    @Transactional(readOnly = true)
    public Page<MonteCarloSimulationResponse> listSimulations(SimulationStatus status, Pageable pageable) {
        if (status != null) {
            return simulationRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(MonteCarloSimulationResponse::fromEntity);
        }
        return simulationRepository.findByDeletedFalse(pageable)
                .map(MonteCarloSimulationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MonteCarloSimulationResponse getSimulation(UUID id) {
        MonteCarloSimulation simulation = getSimulationOrThrow(id);
        return MonteCarloSimulationResponse.fromEntity(simulation);
    }

    @Transactional
    public MonteCarloSimulationResponse createSimulation(CreateMonteCarloSimulationRequest request) {
        MonteCarloSimulation simulation = MonteCarloSimulation.builder()
                .name(request.name())
                .projectId(request.projectId())
                .status(SimulationStatus.DRAFT)
                .iterations(request.iterations() != null ? request.iterations() : 10000)
                .confidenceLevel(request.confidenceLevel() != null
                        ? request.confidenceLevel() : new BigDecimal("0.85"))
                .baselineStartDate(request.baselineStartDate())
                .baselineDuration(request.baselineDuration())
                .description(request.description())
                .build();

        simulation = simulationRepository.save(simulation);
        auditService.logCreate("MonteCarloSimulation", simulation.getId());

        log.info("Симуляция Монте-Карло создана: {} ({})", simulation.getName(), simulation.getId());
        return MonteCarloSimulationResponse.fromEntity(simulation);
    }

    @Transactional
    public MonteCarloSimulationResponse updateSimulation(UUID id, UpdateMonteCarloSimulationRequest request) {
        MonteCarloSimulation simulation = getSimulationOrThrow(id);

        if (simulation.getStatus() != SimulationStatus.DRAFT) {
            throw new IllegalStateException("Изменение возможно только в статусе 'Черновик'");
        }

        if (request.name() != null) {
            simulation.setName(request.name());
        }
        if (request.projectId() != null) {
            simulation.setProjectId(request.projectId());
        }
        if (request.iterations() != null) {
            simulation.setIterations(request.iterations());
        }
        if (request.confidenceLevel() != null) {
            simulation.setConfidenceLevel(request.confidenceLevel());
        }
        if (request.baselineStartDate() != null) {
            simulation.setBaselineStartDate(request.baselineStartDate());
        }
        if (request.baselineDuration() != null) {
            simulation.setBaselineDuration(request.baselineDuration());
        }
        if (request.description() != null) {
            simulation.setDescription(request.description());
        }

        simulation = simulationRepository.save(simulation);
        auditService.logUpdate("MonteCarloSimulation", simulation.getId(), "multiple", null, null);

        log.info("Симуляция Монте-Карло обновлена: {} ({})", simulation.getName(), simulation.getId());
        return MonteCarloSimulationResponse.fromEntity(simulation);
    }

    @Transactional
    public void deleteSimulation(UUID id) {
        MonteCarloSimulation simulation = getSimulationOrThrow(id);
        simulation.softDelete();
        simulationRepository.save(simulation);
        auditService.logDelete("MonteCarloSimulation", simulation.getId());

        log.info("Симуляция Монте-Карло удалена: {} ({})", simulation.getName(), simulation.getId());
    }

    // ---- Task CRUD ----

    @Transactional(readOnly = true)
    public List<MonteCarloTaskResponse> listTasks(UUID simulationId) {
        getSimulationOrThrow(simulationId);
        return taskRepository.findBySimulationIdAndDeletedFalse(simulationId).stream()
                .map(MonteCarloTaskResponse::fromEntity)
                .toList();
    }

    @Transactional
    public MonteCarloTaskResponse addTask(UUID simulationId, CreateMonteCarloTaskRequest request) {
        MonteCarloSimulation simulation = getSimulationOrThrow(simulationId);

        if (simulation.getStatus() != SimulationStatus.DRAFT) {
            throw new IllegalStateException("Добавление задач возможно только в статусе 'Черновик'");
        }

        validateDurations(request.optimisticDuration(), request.mostLikelyDuration(),
                request.pessimisticDuration());

        MonteCarloTask task = MonteCarloTask.builder()
                .simulationId(simulationId)
                .taskName(request.taskName())
                .wbsNodeId(request.wbsNodeId())
                .optimisticDuration(request.optimisticDuration())
                .mostLikelyDuration(request.mostLikelyDuration())
                .pessimisticDuration(request.pessimisticDuration())
                .distribution(request.distribution() != null
                        ? request.distribution()
                        : com.privod.platform.modules.monteCarlo.domain.DistributionType.PERT)
                .dependencies(request.dependencies())
                .build();

        task = taskRepository.save(task);
        auditService.logCreate("MonteCarloTask", task.getId());

        log.info("Задача Монте-Карло добавлена: {} для симуляции {} ({})",
                task.getTaskName(), simulationId, task.getId());
        return MonteCarloTaskResponse.fromEntity(task);
    }

    @Transactional
    public MonteCarloTaskResponse updateTask(UUID simulationId, UUID taskId,
                                              UpdateMonteCarloTaskRequest request) {
        MonteCarloSimulation simulation = getSimulationOrThrow(simulationId);

        if (simulation.getStatus() != SimulationStatus.DRAFT) {
            throw new IllegalStateException("Изменение задач возможно только в статусе 'Черновик'");
        }

        MonteCarloTask task = getTaskOrThrow(taskId);

        if (!task.getSimulationId().equals(simulationId)) {
            throw new IllegalArgumentException("Задача не принадлежит указанной симуляции");
        }

        if (request.taskName() != null) {
            task.setTaskName(request.taskName());
        }
        if (request.wbsNodeId() != null) {
            task.setWbsNodeId(request.wbsNodeId());
        }
        if (request.optimisticDuration() != null) {
            task.setOptimisticDuration(request.optimisticDuration());
        }
        if (request.mostLikelyDuration() != null) {
            task.setMostLikelyDuration(request.mostLikelyDuration());
        }
        if (request.pessimisticDuration() != null) {
            task.setPessimisticDuration(request.pessimisticDuration());
        }
        if (request.distribution() != null) {
            task.setDistribution(request.distribution());
        }
        if (request.dependencies() != null) {
            task.setDependencies(request.dependencies());
        }

        validateDurations(task.getOptimisticDuration(), task.getMostLikelyDuration(),
                task.getPessimisticDuration());

        task = taskRepository.save(task);
        auditService.logUpdate("MonteCarloTask", task.getId(), "multiple", null, null);

        log.info("Задача Монте-Карло обновлена: {} ({})", task.getTaskName(), task.getId());
        return MonteCarloTaskResponse.fromEntity(task);
    }

    @Transactional
    public void deleteTask(UUID simulationId, UUID taskId) {
        MonteCarloSimulation simulation = getSimulationOrThrow(simulationId);

        if (simulation.getStatus() != SimulationStatus.DRAFT) {
            throw new IllegalStateException("Удаление задач возможно только в статусе 'Черновик'");
        }

        MonteCarloTask task = getTaskOrThrow(taskId);

        if (!task.getSimulationId().equals(simulationId)) {
            throw new IllegalArgumentException("Задача не принадлежит указанной симуляции");
        }

        task.softDelete();
        taskRepository.save(task);
        auditService.logDelete("MonteCarloTask", task.getId());

        log.info("Задача Монте-Карло удалена: {} ({})", task.getTaskName(), task.getId());
    }

    // ---- Run simulation ----

    @Transactional
    public MonteCarloSimulationResponse runSimulation(UUID simulationId) {
        MonteCarloSimulation simulation = getSimulationOrThrow(simulationId);

        if (!simulation.canTransitionTo(SimulationStatus.RUNNING)) {
            throw new IllegalStateException(
                    String.format("Невозможно запустить симуляцию из статуса %s",
                            simulation.getStatus().getDisplayName()));
        }

        List<MonteCarloTask> tasks = taskRepository.findBySimulationIdAndDeletedFalse(simulationId);
        if (tasks.isEmpty()) {
            throw new IllegalStateException("Невозможно запустить симуляцию без задач");
        }

        simulation.setStatus(SimulationStatus.RUNNING);
        simulation.setStartedAt(Instant.now());
        simulationRepository.save(simulation);

        try {
            // PERT calculation for critical path aggregation:
            // For each task: mean = (O + 4M + P) / 6, stddev = (P - O) / 6
            // Aggregate: total_mean = sum(means), total_stddev = sqrt(sum(variances))

            double totalMean = 0.0;
            double totalVariance = 0.0;

            for (MonteCarloTask task : tasks) {
                double o = task.getOptimisticDuration();
                double m = task.getMostLikelyDuration();
                double p = task.getPessimisticDuration();

                double mean = (o + 4.0 * m + p) / 6.0;
                double stddev = (p - o) / 6.0;
                double variance = stddev * stddev;

                totalMean += mean;
                totalVariance += variance;
            }

            double totalStddev = Math.sqrt(totalVariance);

            // Calculate percentiles using z-scores for normal distribution
            // P50 = mean (z=0), P85 (z=1.0364), P95 (z=1.6449)
            int p50Duration = (int) Math.round(totalMean);
            int p85Duration = (int) Math.round(totalMean + 1.0364 * totalStddev);
            int p95Duration = (int) Math.round(totalMean + 1.6449 * totalStddev);

            simulation.setResultP50Duration(p50Duration);
            simulation.setResultP85Duration(p85Duration);
            simulation.setResultP95Duration(p95Duration);

            // Calculate completion dates if baseline start date is set
            if (simulation.getBaselineStartDate() != null) {
                simulation.setResultP50Date(simulation.getBaselineStartDate().plusDays(p50Duration));
                simulation.setResultP85Date(simulation.getBaselineStartDate().plusDays(p85Duration));
                simulation.setResultP95Date(simulation.getBaselineStartDate().plusDays(p95Duration));
            }

            // Clear old results and generate new ones
            resultRepository.deleteBySimulationId(simulationId);

            List<MonteCarloResult> results = new ArrayList<>();
            int[] percentiles = {5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
                    55, 60, 65, 70, 75, 80, 85, 90, 95};

            for (int percentile : percentiles) {
                double zScore = getZScoreForPercentile(percentile);
                int durationDays = (int) Math.round(totalMean + zScore * totalStddev);
                if (durationDays < 1) {
                    durationDays = 1;
                }

                LocalDate completionDate = simulation.getBaselineStartDate() != null
                        ? simulation.getBaselineStartDate().plusDays(durationDays)
                        : null;

                MonteCarloResult result = MonteCarloResult.builder()
                        .simulationId(simulationId)
                        .percentile(percentile)
                        .durationDays(durationDays)
                        .completionDate(completionDate)
                        .probability(new BigDecimal(percentile).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                        .build();

                results.add(result);
            }

            resultRepository.saveAll(results);

            simulation.setStatus(SimulationStatus.COMPLETED);
            simulation.setCompletedAt(Instant.now());
            simulation = simulationRepository.save(simulation);

            auditService.logStatusChange("MonteCarloSimulation", simulation.getId(),
                    SimulationStatus.RUNNING.name(), SimulationStatus.COMPLETED.name());

            log.info("Симуляция Монте-Карло завершена: {} — P50={} дн., P85={} дн., P95={} дн. ({})",
                    simulation.getName(), p50Duration, p85Duration, p95Duration, simulation.getId());

        } catch (Exception e) {
            simulation.setStatus(SimulationStatus.FAILED);
            simulation.setCompletedAt(Instant.now());
            simulationRepository.save(simulation);

            auditService.logStatusChange("MonteCarloSimulation", simulation.getId(),
                    SimulationStatus.RUNNING.name(), SimulationStatus.FAILED.name());

            log.error("Ошибка симуляции Монте-Карло: {} ({})", simulation.getName(), simulation.getId(), e);
            throw new RuntimeException("Ошибка выполнения симуляции: " + e.getMessage(), e);
        }

        return MonteCarloSimulationResponse.fromEntity(simulation);
    }

    // ---- Results ----

    @Transactional(readOnly = true)
    public List<MonteCarloResultResponse> getResults(UUID simulationId) {
        getSimulationOrThrow(simulationId);
        return resultRepository.findBySimulationIdAndDeletedFalseOrderByPercentileAsc(simulationId).stream()
                .map(MonteCarloResultResponse::fromEntity)
                .toList();
    }

    // ---- Private helpers ----

    private double getZScoreForPercentile(int percentile) {
        // Standard normal distribution z-scores for common percentiles
        return switch (percentile) {
            case 5 -> -1.6449;
            case 10 -> -1.2816;
            case 15 -> -1.0364;
            case 20 -> -0.8416;
            case 25 -> -0.6745;
            case 30 -> -0.5244;
            case 35 -> -0.3853;
            case 40 -> -0.2533;
            case 45 -> -0.1257;
            case 50 -> 0.0;
            case 55 -> 0.1257;
            case 60 -> 0.2533;
            case 65 -> 0.3853;
            case 70 -> 0.5244;
            case 75 -> 0.6745;
            case 80 -> 0.8416;
            case 85 -> 1.0364;
            case 90 -> 1.2816;
            case 95 -> 1.6449;
            default -> 0.0;
        };
    }

    private void validateDurations(int optimistic, int mostLikely, int pessimistic) {
        if (optimistic > mostLikely) {
            throw new IllegalArgumentException(
                    "Оптимистичная длительность не может быть больше наиболее вероятной");
        }
        if (mostLikely > pessimistic) {
            throw new IllegalArgumentException(
                    "Наиболее вероятная длительность не может быть больше пессимистичной");
        }
    }

    private MonteCarloSimulation getSimulationOrThrow(UUID id) {
        return simulationRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Симуляция Монте-Карло не найдена: " + id));
    }

    private MonteCarloTask getTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Задача Монте-Карло не найдена: " + id));
    }
}
