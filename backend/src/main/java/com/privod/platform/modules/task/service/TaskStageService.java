package com.privod.platform.modules.task.service;

import com.privod.platform.modules.task.domain.TaskStage;
import com.privod.platform.modules.task.repository.TaskStageRepository;
import com.privod.platform.modules.task.web.dto.TaskStageResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskStageService {

    private final TaskStageRepository stageRepository;

    @Transactional(readOnly = true)
    public List<TaskStageResponse> getStages(UUID projectId) {
        if (projectId == null) {
            return stageRepository.findByDeletedFalseOrderBySequenceAsc()
                    .stream()
                    .map(TaskStageResponse::fromEntity)
                    .toList();
        }
        return stageRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(TaskStageResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskStageResponse createStage(UUID projectId, String name, String color, String icon,
                                          String description, boolean isDefault, boolean isClosed, Integer sequence) {
        if (stageRepository.existsByProjectIdAndNameAndDeletedFalse(projectId, name)) {
            throw new IllegalStateException("Стадия с таким именем уже существует");
        }

        TaskStage stage = TaskStage.builder()
                .projectId(projectId)
                .name(name)
                .color(color != null ? color : "#3b82f6")
                .icon(icon)
                .description(description)
                .isDefault(isDefault)
                .isClosed(isClosed)
                .sequence(sequence != null ? sequence : 0)
                .build();

        stage = stageRepository.save(stage);
        log.info("Task stage created: {} for project {}", name, projectId);
        return TaskStageResponse.fromEntity(stage);
    }

    @Transactional
    public TaskStageResponse updateStage(UUID id, String name, String color, String icon,
                                          String description, Boolean isClosed, Integer sequence) {
        TaskStage stage = stageRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Стадия не найдена: " + id));

        if (name != null) stage.setName(name);
        if (color != null) stage.setColor(color);
        if (icon != null) stage.setIcon(icon);
        if (description != null) stage.setDescription(description);
        if (isClosed != null) stage.setClosed(isClosed);
        if (sequence != null) stage.setSequence(sequence);

        stage = stageRepository.save(stage);
        log.info("Task stage updated: {} ({})", stage.getName(), id);
        return TaskStageResponse.fromEntity(stage);
    }

    @Transactional
    public void deleteStage(UUID id) {
        TaskStage stage = stageRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Стадия не найдена: " + id));

        stage.setDeleted(true);
        stageRepository.save(stage);
        log.info("Task stage deleted: {} ({})", stage.getName(), id);
    }

    @Transactional
    public void reorderStages(UUID projectId, List<UUID> stageIds) {
        for (int i = 0; i < stageIds.size(); i++) {
            final int sequence = i;
            stageRepository.findById(stageIds.get(i)).ifPresent(stage -> {
                stage.setSequence(sequence);
                stageRepository.save(stage);
            });
        }
        log.info("Task stages reordered for project {}", projectId);
    }
}
