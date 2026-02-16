package com.privod.platform.modules.chatter.service;

import com.privod.platform.modules.chatter.domain.Activity;
import com.privod.platform.modules.chatter.domain.ActivityStatus;
import com.privod.platform.modules.chatter.repository.ActivityRepository;
import com.privod.platform.modules.chatter.web.dto.ActivityResponse;
import com.privod.platform.modules.chatter.web.dto.CreateActivityRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityRepository activityRepository;

    @Transactional
    public ActivityResponse create(CreateActivityRequest request) {
        Activity activity = Activity.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .activityType(request.activityType())
                .summary(request.summary())
                .description(request.description())
                .assignedToId(request.assignedToId())
                .dueDate(request.dueDate())
                .status(ActivityStatus.PLANNED)
                .build();

        activity = activityRepository.save(activity);
        log.info("Activity created for {} {}: {} ({})",
                request.entityType(), request.entityId(), activity.getId(), request.activityType());
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getActivities(String entityType, UUID entityId, Pageable pageable) {
        return activityRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId, pageable)
                .map(ActivityResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getMyActivities(UUID userId, ActivityStatus status, Pageable pageable) {
        if (status != null) {
            return activityRepository
                    .findByAssignedToIdAndStatusAndDeletedFalse(userId, status, pageable)
                    .map(ActivityResponse::fromEntity);
        }
        return activityRepository
                .findByAssignedToIdAndDeletedFalse(userId, pageable)
                .map(ActivityResponse::fromEntity);
    }

    @Transactional
    public ActivityResponse markDone(UUID activityId, UUID completedById) {
        Activity activity = getActivityOrThrow(activityId);
        activity.markDone(completedById);
        activity = activityRepository.save(activity);
        log.info("Activity marked as done: {} by user {}", activityId, completedById);
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public ActivityResponse cancel(UUID activityId) {
        Activity activity = getActivityOrThrow(activityId);
        activity.cancel();
        activity = activityRepository.save(activity);
        log.info("Activity cancelled: {}", activityId);
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getOverdueActivities() {
        return activityRepository.findOverdueActivities(LocalDate.now())
                .stream()
                .map(ActivityResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getPendingCount(UUID userId) {
        return activityRepository.countByAssignedToIdAndStatusInAndDeletedFalse(
                userId, List.of(ActivityStatus.PLANNED, ActivityStatus.IN_PROGRESS));
    }

    @Transactional
    public ActivityResponse update(UUID id, CreateActivityRequest request) {
        Activity activity = getActivityOrThrow(id);

        if (request.activityType() != null) activity.setActivityType(request.activityType());
        if (request.summary() != null) activity.setSummary(request.summary());
        if (request.description() != null) activity.setDescription(request.description());
        if (request.assignedToId() != null) activity.setAssignedToId(request.assignedToId());
        if (request.dueDate() != null) activity.setDueDate(request.dueDate());

        activity = activityRepository.save(activity);
        log.info("Activity updated: {}", id);
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public void delete(UUID id) {
        Activity activity = getActivityOrThrow(id);
        activity.softDelete();
        activityRepository.save(activity);
        log.info("Activity deleted: {}", id);
    }

    private Activity getActivityOrThrow(UUID id) {
        return activityRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Активность не найдена: " + id));
    }
}
