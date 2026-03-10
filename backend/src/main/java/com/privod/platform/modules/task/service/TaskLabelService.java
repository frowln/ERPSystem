package com.privod.platform.modules.task.service;

import com.privod.platform.modules.task.domain.TaskLabel;
import com.privod.platform.modules.task.domain.TaskLabelAssignment;
import com.privod.platform.modules.task.repository.TaskLabelAssignmentRepository;
import com.privod.platform.modules.task.repository.TaskLabelRepository;
import com.privod.platform.modules.task.web.dto.TaskLabelResponse;
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
public class TaskLabelService {

    private final TaskLabelRepository labelRepository;
    private final TaskLabelAssignmentRepository assignmentRepository;

    @Transactional
    public TaskLabelResponse createLabel(String name, String color, String icon, UUID organizationId) {
        if (labelRepository.existsByNameAndOrganizationId(name, organizationId)) {
            throw new IllegalStateException("Метка с таким именем уже существует");
        }

        TaskLabel label = TaskLabel.builder()
                .name(name)
                .color(color)
                .icon(icon)
                .organizationId(organizationId)
                .build();

        label = labelRepository.save(label);
        log.info("Label created: {} ({})", name, label.getId());
        return TaskLabelResponse.fromEntity(label);
    }

    @Transactional
    public TaskLabelResponse updateLabel(UUID id, String name, String color, String icon) {
        TaskLabel label = labelRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Метка не найдена: " + id));

        if (name != null) label.setName(name);
        if (color != null) label.setColor(color);
        if (icon != null) label.setIcon(icon);

        label = labelRepository.save(label);
        return TaskLabelResponse.fromEntity(label);
    }

    @Transactional
    public void deleteLabel(UUID id) {
        assignmentRepository.findByLabelId(id).forEach(a -> assignmentRepository.delete(a));
        labelRepository.deleteById(id);
        log.info("Label deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<TaskLabelResponse> getLabels(UUID organizationId) {
        List<TaskLabel> labels = organizationId != null
                ? labelRepository.findByOrganizationIdOrderByNameAsc(organizationId)
                : labelRepository.findByOrganizationIdIsNullOrderByNameAsc();
        return labels.stream().map(TaskLabelResponse::fromEntity).toList();
    }

    @Transactional
    public void assignLabel(UUID taskId, UUID labelId) {
        if (assignmentRepository.existsByTaskIdAndLabelId(taskId, labelId)) {
            return; // already assigned
        }
        labelRepository.findById(labelId)
                .orElseThrow(() -> new EntityNotFoundException("Метка не найдена: " + labelId));

        TaskLabelAssignment assignment = TaskLabelAssignment.builder()
                .taskId(taskId)
                .labelId(labelId)
                .build();
        assignmentRepository.save(assignment);
        log.info("Label {} assigned to task {}", labelId, taskId);
    }

    @Transactional
    public void removeLabel(UUID taskId, UUID labelId) {
        assignmentRepository.deleteByTaskIdAndLabelId(taskId, labelId);
        log.info("Label {} removed from task {}", labelId, taskId);
    }

    @Transactional(readOnly = true)
    public List<TaskLabelResponse> getTaskLabels(UUID taskId) {
        return assignmentRepository.findByTaskId(taskId).stream()
                .map(assignment -> labelRepository.findById(assignment.getLabelId()).orElse(null))
                .filter(label -> label != null)
                .map(TaskLabelResponse::fromEntity)
                .toList();
    }
}
