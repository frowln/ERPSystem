package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.SafetyTraining;
import com.privod.platform.modules.safety.domain.TrainingStatus;
import com.privod.platform.modules.safety.domain.TrainingType;
import com.privod.platform.modules.safety.repository.SafetyTrainingRepository;
import com.privod.platform.modules.safety.web.dto.CreateSafetyTrainingRequest;
import com.privod.platform.modules.safety.web.dto.SafetyTrainingResponse;
import com.privod.platform.modules.safety.web.dto.UpdateSafetyTrainingRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyTrainingService {

    private static final int PERIODIC_INTERVAL_MONTHS = 6;

    private final SafetyTrainingRepository trainingRepository;

    @Transactional(readOnly = true)
    public Page<SafetyTrainingResponse> listTrainings(UUID projectId, String trainingType, String status,
                                                       String search, Pageable pageable) {
        Specification<SafetyTraining> spec = (root, query, cb) -> cb.isFalse(root.get("deleted"));

        if (projectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("projectId"), projectId));
        }
        if (trainingType != null && !trainingType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("trainingType").as(String.class), trainingType));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status").as(String.class), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("instructorName")), pattern),
                    cb.like(cb.lower(root.get("topics")), pattern)
            ));
        }

        return trainingRepository.findAll(spec, pageable).map(SafetyTrainingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SafetyTrainingResponse getTraining(UUID id) {
        SafetyTraining training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Инструктаж не найден: " + id));
        return SafetyTrainingResponse.fromEntity(training);
    }

    @Transactional
    public SafetyTrainingResponse createTraining(CreateSafetyTrainingRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        int participantCount = 0;
        if (request.participants() != null && !request.participants().isBlank()) {
            try {
                participantCount = com.fasterxml.jackson.databind.ObjectMapper
                        .class.getDeclaredConstructor().newInstance()
                        .readTree(request.participants()).size();
            } catch (Exception ignored) {
                // fallback: count will remain 0
            }
        }

        SafetyTraining training = SafetyTraining.builder()
                .organizationId(organizationId)
                .title(request.title())
                .trainingType(request.trainingType())
                .projectId(request.projectId())
                .date(request.date())
                .instructorId(request.instructorId())
                .instructorName(request.instructorName())
                .participants(request.participants())
                .participantCount(participantCount)
                .topics(request.topics())
                .duration(request.duration())
                .notes(request.notes())
                .build();

        training = trainingRepository.save(training);
        return SafetyTrainingResponse.fromEntity(training);
    }

    @Transactional
    public SafetyTrainingResponse updateTraining(UUID id, UpdateSafetyTrainingRequest request) {
        SafetyTraining training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Инструктаж не найден: " + id));

        if (request.title() != null) training.setTitle(request.title());
        if (request.trainingType() != null) training.setTrainingType(request.trainingType());
        if (request.projectId() != null) training.setProjectId(request.projectId());
        if (request.date() != null) training.setDate(request.date());
        if (request.instructorId() != null) training.setInstructorId(request.instructorId());
        if (request.instructorName() != null) training.setInstructorName(request.instructorName());
        if (request.participants() != null) training.setParticipants(request.participants());
        if (request.topics() != null) training.setTopics(request.topics());
        if (request.duration() != null) training.setDuration(request.duration());
        if (request.notes() != null) training.setNotes(request.notes());

        training = trainingRepository.save(training);
        return SafetyTrainingResponse.fromEntity(training);
    }

    @Transactional
    public SafetyTrainingResponse completeTraining(UUID id, String signatureData) {
        SafetyTraining training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Инструктаж не найден: " + id));

        if (training.getStatus() != TrainingStatus.PLANNED && training.getStatus() != TrainingStatus.IN_PROGRESS) {
            throw new IllegalStateException("Можно завершить только запланированный/проводимый инструктаж");
        }

        training.setStatus(TrainingStatus.COMPLETED);
        training.setCompletedAt(Instant.now());
        if (signatureData != null) {
            training.setSignatureData(signatureData);
        }

        // Auto-schedule next periodic training (6 months from completion)
        if (training.getTrainingType().isAutoScheduled()) {
            LocalDate nextDate = training.getDate().plusMonths(PERIODIC_INTERVAL_MONTHS);
            training.setNextScheduledDate(nextDate);
            log.info("Auto-scheduled next periodic training for {} on {}", training.getTitle(), nextDate);
        }

        training = trainingRepository.save(training);
        return SafetyTrainingResponse.fromEntity(training);
    }

    @Transactional
    public SafetyTrainingResponse cancelTraining(UUID id) {
        SafetyTraining training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Инструктаж не найден: " + id));

        if (training.getStatus() == TrainingStatus.COMPLETED) {
            throw new IllegalStateException("Нельзя отменить завершённый инструктаж");
        }

        training.setStatus(TrainingStatus.CANCELLED);
        training = trainingRepository.save(training);
        return SafetyTrainingResponse.fromEntity(training);
    }

    @Transactional
    public void deleteTraining(UUID id) {
        SafetyTraining training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Инструктаж не найден: " + id));
        training.softDelete();
        trainingRepository.save(training);
    }

    /**
     * Auto-create new PERIODIC trainings for completed ones with nextScheduledDate in the past.
     * Called by scheduler.
     */
    @Transactional
    public int autoSchedulePeriodicTrainings() {
        List<SafetyTraining> due = trainingRepository.findPeriodicDueForReschedule(LocalDate.now());
        int created = 0;

        for (SafetyTraining completed : due) {
            SafetyTraining next = SafetyTraining.builder()
                    .organizationId(completed.getOrganizationId())
                    .title(completed.getTitle())
                    .trainingType(TrainingType.PERIODIC)
                    .projectId(completed.getProjectId())
                    .date(completed.getNextScheduledDate())
                    .instructorId(completed.getInstructorId())
                    .instructorName(completed.getInstructorName())
                    .topics(completed.getTopics())
                    .duration(completed.getDuration())
                    .notes("Автоматически запланирован (повторный)")
                    .build();

            trainingRepository.save(next);
            // Clear the trigger so it doesn't fire again
            completed.setNextScheduledDate(null);
            trainingRepository.save(completed);
            created++;
        }

        if (created > 0) {
            log.info("Auto-scheduled {} periodic trainings", created);
        }
        return created;
    }
}
