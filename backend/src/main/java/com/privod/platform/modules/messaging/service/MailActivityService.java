package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.MailActivity;
import com.privod.platform.modules.messaging.domain.MailActivityStatus;
import com.privod.platform.modules.messaging.domain.MailActivityType;
import com.privod.platform.modules.messaging.repository.MailActivityRepository;
import com.privod.platform.modules.messaging.repository.MailActivityTypeRepository;
import com.privod.platform.modules.messaging.web.dto.MailActivityResponse;
import com.privod.platform.modules.messaging.web.dto.MailActivityTypeResponse;
import com.privod.platform.modules.messaging.web.dto.ScheduleActivityRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MailActivityService {

    private final MailActivityRepository mailActivityRepository;
    private final MailActivityTypeRepository mailActivityTypeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public MailActivityResponse scheduleActivity(ScheduleActivityRequest request) {
        User current = getCurrentUserEntity();

        MailActivityType activityType = mailActivityTypeRepository.findById(request.activityTypeId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Тип активности не найден: " + request.activityTypeId()));

        MailActivity activity = MailActivity.builder()
                .modelName(request.modelName())
                .recordId(request.recordId())
                .activityTypeId(activityType.getId())
                .userId(current.getId())
                .assignedUserId(request.assignedUserId())
                .summary(request.summary())
                .note(request.note())
                .dueDate(request.dueDate())
                .status(MailActivityStatus.PLANNED)
                .build();
        activity = mailActivityRepository.save(activity);
        auditService.logCreate("MailActivity", activity.getId());
        return MailActivityResponse.fromEntity(activity);
    }

    @Transactional
    public MailActivityResponse completeActivity(UUID activityId) {
        MailActivity activity = mailActivityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Активность не найдена: " + activityId));
        if (activity.isDeleted()) {
            throw new EntityNotFoundException("Активность удалена");
        }
        activity.markDone();
        activity = mailActivityRepository.save(activity);
        auditService.logUpdate("MailActivity", activityId, "status", "PLANNED", "DONE");
        return MailActivityResponse.fromEntity(activity);
    }

    @Transactional
    public MailActivityResponse cancelActivity(UUID activityId) {
        MailActivity activity = mailActivityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Активность не найдена: " + activityId));
        if (activity.isDeleted()) {
            throw new EntityNotFoundException("Активность удалена");
        }
        String oldStatus = activity.getStatus().name();
        activity.cancel();
        activity = mailActivityRepository.save(activity);
        auditService.logUpdate("MailActivity", activityId, "status", oldStatus, "CANCELLED");
        return MailActivityResponse.fromEntity(activity);
    }

    @Transactional(readOnly = true)
    public List<MailActivityResponse> getActivitiesForRecord(String modelName, UUID recordId) {
        return mailActivityRepository.findByModelNameAndRecordId(modelName, recordId)
                .stream()
                .map(MailActivityResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MailActivityResponse> getMyActivities() {
        User current = getCurrentUserEntity();
        return mailActivityRepository.findByAssignedUserId(
                        current.getId(),
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.ASC, "dueDate"))
                )
                .map(MailActivityResponse::fromEntity)
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<MailActivityResponse> getMyPendingActivities() {
        User current = getCurrentUserEntity();
        return mailActivityRepository.findByAssignedUserIdAndStatus(
                        current.getId(),
                        MailActivityStatus.PLANNED,
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.ASC, "dueDate"))
                )
                .map(MailActivityResponse::fromEntity)
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<MailActivityResponse> findOverdueActivities() {
        return mailActivityRepository.findOverdue(LocalDate.now())
                .stream()
                .map(MailActivityResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countPendingActivities() {
        User current = getCurrentUserEntity();
        return mailActivityRepository.countPendingByAssignedUserId(current.getId());
    }

    @Transactional(readOnly = true)
    public long countOverdueActivities() {
        User current = getCurrentUserEntity();
        return mailActivityRepository.countOverdueByAssignedUserId(current.getId(), LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<MailActivityTypeResponse> getActivityTypes() {
        return mailActivityTypeRepository.findAllActive()
                .stream()
                .map(MailActivityTypeResponse::fromEntity)
                .toList();
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        String email;
        if (authentication.getPrincipal() instanceof CustomUserDetails customUserDetails) {
            email = customUserDetails.getEmail();
        } else {
            email = authentication.getName();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + email));
    }
}
