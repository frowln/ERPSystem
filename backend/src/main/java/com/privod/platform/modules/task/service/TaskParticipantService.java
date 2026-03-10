package com.privod.platform.modules.task.service;

import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.task.domain.ParticipantRole;
import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskParticipant;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import com.privod.platform.modules.task.repository.TaskParticipantRepository;
import com.privod.platform.modules.task.web.dto.AddParticipantRequest;
import com.privod.platform.modules.task.web.dto.TaskParticipantResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskParticipantService {

    private final TaskParticipantRepository participantRepository;
    private final ProjectTaskRepository taskRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TaskParticipantResponse> getParticipants(UUID taskId) {
        return participantRepository.findByTaskId(taskId).stream()
                .map(TaskParticipantResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskParticipantResponse addParticipant(UUID taskId, AddParticipantRequest request,
                                                   UUID addedById, String addedByName) {
        ProjectTask task = taskRepository.findById(taskId)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + taskId));

        if (participantRepository.existsByTaskIdAndUserIdAndRole(taskId, request.userId(), request.role())) {
            throw new IllegalStateException("Участник уже добавлен в этой роли");
        }

        // If adding as RESPONSIBLE, update the task's assignee fields too
        if (request.role() == ParticipantRole.RESPONSIBLE) {
            task.setAssigneeId(request.userId());
            task.setAssigneeName(request.userName());
            taskRepository.save(task);
        }

        TaskParticipant participant = TaskParticipant.builder()
                .taskId(taskId)
                .userId(request.userId())
                .userName(request.userName())
                .role(request.role())
                .addedAt(Instant.now())
                .addedById(addedById)
                .addedByName(addedByName)
                .build();

        participant = participantRepository.save(participant);

        // Notify the added user
        String roleLabel = request.role().getDisplayName();
        notificationService.send(
                request.userId(),
                "Вы добавлены в задачу: " + task.getTitle(),
                "Вы добавлены как " + roleLabel + " в задачу " + task.getCode() + " — " + task.getTitle(),
                NotificationType.TASK,
                "ProjectTask",
                task.getId(),
                "/tasks/" + task.getId()
        );

        log.info("Participant added: {} as {} to task {} ({})",
                request.userName(), request.role(), task.getCode(), taskId);

        return TaskParticipantResponse.fromEntity(participant);
    }

    @Transactional
    public void removeParticipant(UUID taskId, UUID userId, ParticipantRole role) {
        ProjectTask task = taskRepository.findById(taskId)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + taskId));

        participantRepository.deleteByTaskIdAndUserIdAndRole(taskId, userId, role);

        // If removing RESPONSIBLE, clear assignee on the task
        if (role == ParticipantRole.RESPONSIBLE && userId.equals(task.getAssigneeId())) {
            // Check if there's another RESPONSIBLE participant
            List<TaskParticipant> remaining = participantRepository.findByTaskIdAndRole(taskId, ParticipantRole.RESPONSIBLE);
            if (remaining.isEmpty()) {
                task.setAssigneeId(null);
                task.setAssigneeName(null);
            } else {
                TaskParticipant next = remaining.get(0);
                task.setAssigneeId(next.getUserId());
                task.setAssigneeName(next.getUserName());
            }
            taskRepository.save(task);
        }

        log.info("Participant removed: userId={} role={} from task {}", userId, role, taskId);
    }

    @Transactional
    public void delegateTask(UUID taskId, UUID fromUserId, UUID toUserId, String toUserName, String comment) {
        ProjectTask task = taskRepository.findById(taskId)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + taskId));

        // Remove old RESPONSIBLE
        participantRepository.deleteByTaskIdAndUserIdAndRole(taskId, fromUserId, ParticipantRole.RESPONSIBLE);

        // Add old responsible as OBSERVER so they can track
        if (!participantRepository.existsByTaskIdAndUserIdAndRole(taskId, fromUserId, ParticipantRole.OBSERVER)) {
            participantRepository.save(TaskParticipant.builder()
                    .taskId(taskId)
                    .userId(fromUserId)
                    .userName(task.getAssigneeName() != null ? task.getAssigneeName() : "")
                    .role(ParticipantRole.OBSERVER)
                    .addedAt(Instant.now())
                    .build());
        }

        // Add new RESPONSIBLE
        if (!participantRepository.existsByTaskIdAndUserIdAndRole(taskId, toUserId, ParticipantRole.RESPONSIBLE)) {
            participantRepository.save(TaskParticipant.builder()
                    .taskId(taskId)
                    .userId(toUserId)
                    .userName(toUserName)
                    .role(ParticipantRole.RESPONSIBLE)
                    .addedAt(Instant.now())
                    .addedById(fromUserId)
                    .build());
        }

        // Update task assignee
        task.setDelegatedToId(toUserId);
        task.setDelegatedToName(toUserName);
        task.setAssigneeId(toUserId);
        task.setAssigneeName(toUserName);
        taskRepository.save(task);

        // Notify new responsible
        notificationService.send(
                toUserId,
                "Задача делегирована вам: " + task.getTitle(),
                "Задача " + task.getCode() + " делегирована вам" + (comment != null ? ". Комментарий: " + comment : ""),
                NotificationType.TASK,
                "ProjectTask",
                task.getId(),
                "/tasks/" + task.getId()
        );

        log.info("Task delegated: {} from {} to {}", task.getCode(), fromUserId, toUserId);
    }

    /**
     * Check if a user has access to a task based on visibility and participation.
     */
    @Transactional(readOnly = true)
    public boolean hasAccess(UUID taskId, UUID userId, ProjectTask task) {
        switch (task.getVisibility()) {
            case ORGANIZATION:
                return true;
            case PROJECT:
                // Would need project membership check — for now allow
                return true;
            case PARTICIPANTS_ONLY:
                // Creator always has access
                if (userId.equals(task.getReporterId())) {
                    return true;
                }
                return participantRepository.existsByTaskIdAndUserId(taskId, userId);
            default:
                return false;
        }
    }

    /**
     * Get all task IDs that a user participates in (for filtering).
     */
    @Transactional(readOnly = true)
    public Set<UUID> getAccessibleTaskIds(UUID userId) {
        return participantRepository.findTaskIdsByUserId(userId);
    }

    /**
     * Auto-create participants when a task is created.
     */
    @Transactional
    public void initializeParticipants(ProjectTask task, UUID creatorId, String creatorName) {
        // Add creator as OBSERVER (Постановщик)
        participantRepository.save(TaskParticipant.builder()
                .taskId(task.getId())
                .userId(creatorId)
                .userName(creatorName)
                .role(ParticipantRole.OBSERVER)
                .addedAt(Instant.now())
                .build());

        // If assignee is specified and different from creator, add as RESPONSIBLE
        if (task.getAssigneeId() != null && !task.getAssigneeId().equals(creatorId)) {
            participantRepository.save(TaskParticipant.builder()
                    .taskId(task.getId())
                    .userId(task.getAssigneeId())
                    .userName(task.getAssigneeName() != null ? task.getAssigneeName() : "")
                    .role(ParticipantRole.RESPONSIBLE)
                    .addedAt(Instant.now())
                    .addedById(creatorId)
                    .addedByName(creatorName)
                    .build());
        } else if (task.getAssigneeId() != null) {
            // Creator is also the assignee — add RESPONSIBLE role too
            participantRepository.save(TaskParticipant.builder()
                    .taskId(task.getId())
                    .userId(task.getAssigneeId())
                    .userName(task.getAssigneeName() != null ? task.getAssigneeName() : creatorName)
                    .role(ParticipantRole.RESPONSIBLE)
                    .addedAt(Instant.now())
                    .build());
        }
    }
}
