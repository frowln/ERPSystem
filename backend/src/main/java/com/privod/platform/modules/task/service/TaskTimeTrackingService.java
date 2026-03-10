package com.privod.platform.modules.task.service;

import com.privod.platform.modules.task.domain.TaskTimeEntry;
import com.privod.platform.modules.task.repository.TaskTimeEntryRepository;
import com.privod.platform.modules.task.web.dto.TaskTimeEntryResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskTimeTrackingService {

    private final TaskTimeEntryRepository timeEntryRepository;

    @Transactional
    public TaskTimeEntryResponse startTimer(UUID taskId, UUID userId, String userName) {
        // Stop any existing running timer for this user on this task
        timeEntryRepository.findByTaskIdAndUserIdAndIsRunningTrue(taskId, userId)
                .ifPresent(existing -> {
                    existing.setIsRunning(false);
                    existing.setStoppedAt(Instant.now());
                    existing.setDurationSeconds((int) Duration.between(existing.getStartedAt(), Instant.now()).getSeconds());
                    existing.setUpdatedAt(Instant.now());
                    timeEntryRepository.save(existing);
                });

        TaskTimeEntry entry = TaskTimeEntry.builder()
                .taskId(taskId)
                .userId(userId)
                .userName(userName)
                .startedAt(Instant.now())
                .isRunning(true)
                .durationSeconds(0)
                .build();

        entry = timeEntryRepository.save(entry);
        log.info("Timer started for task {} by user {}", taskId, userName);
        return TaskTimeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public TaskTimeEntryResponse stopTimer(UUID taskId, UUID userId) {
        TaskTimeEntry entry = timeEntryRepository.findByTaskIdAndUserIdAndIsRunningTrue(taskId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Активный таймер не найден"));

        entry.setIsRunning(false);
        entry.setStoppedAt(Instant.now());
        entry.setDurationSeconds((int) Duration.between(entry.getStartedAt(), Instant.now()).getSeconds());
        entry.setUpdatedAt(Instant.now());

        entry = timeEntryRepository.save(entry);
        log.info("Timer stopped for task {} by user {}, duration: {}s", taskId, userId, entry.getDurationSeconds());
        return TaskTimeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public TaskTimeEntryResponse addManualEntry(UUID taskId, UUID userId, String userName,
                                                  Instant startedAt, Instant stoppedAt, String description) {
        int duration = (int) Duration.between(startedAt, stoppedAt).getSeconds();
        if (duration < 0) {
            throw new IllegalArgumentException("Время окончания должно быть позже времени начала");
        }

        TaskTimeEntry entry = TaskTimeEntry.builder()
                .taskId(taskId)
                .userId(userId)
                .userName(userName)
                .startedAt(startedAt)
                .stoppedAt(stoppedAt)
                .durationSeconds(duration)
                .description(description)
                .isRunning(false)
                .build();

        entry = timeEntryRepository.save(entry);
        log.info("Manual time entry added for task {}: {}s", taskId, duration);
        return TaskTimeEntryResponse.fromEntity(entry);
    }

    @Transactional(readOnly = true)
    public List<TaskTimeEntryResponse> getTaskTimeEntries(UUID taskId) {
        return timeEntryRepository.findByTaskIdOrderByStartedAtDesc(taskId)
                .stream()
                .map(TaskTimeEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskTimeEntryResponse> getUserTimeEntries(UUID userId) {
        return timeEntryRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(TaskTimeEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getTotalDuration(UUID taskId) {
        return timeEntryRepository.sumDurationByTaskId(taskId);
    }

    @Transactional
    public void deleteEntry(UUID entryId) {
        timeEntryRepository.deleteById(entryId);
        log.info("Time entry deleted: {}", entryId);
    }
}
