package com.privod.platform.modules.calendar.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.ConstructionSchedule;
import com.privod.platform.modules.calendar.domain.ScheduleStatus;
import com.privod.platform.modules.calendar.repository.ConstructionScheduleRepository;
import com.privod.platform.modules.calendar.web.dto.ConstructionScheduleResponse;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateScheduleRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConstructionScheduleService {

    private final ConstructionScheduleRepository scheduleRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ConstructionScheduleResponse> listSchedules(Pageable pageable) {
        return scheduleRepository.findByDeletedFalse(pageable)
                .map(ConstructionScheduleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ConstructionScheduleResponse getSchedule(UUID id) {
        ConstructionSchedule schedule = getScheduleOrThrow(id);
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public ConstructionScheduleResponse createSchedule(CreateScheduleRequest request) {
        ConstructionSchedule schedule = ConstructionSchedule.builder()
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .status(ScheduleStatus.DRAFT)
                .plannedStartDate(request.plannedStartDate())
                .plannedEndDate(request.plannedEndDate())
                .docVersion(1)
                .build();

        schedule = scheduleRepository.save(schedule);
        auditService.logCreate("ConstructionSchedule", schedule.getId());

        log.info("Construction schedule created: {} for project {} ({})",
                schedule.getName(), schedule.getProjectId(), schedule.getId());
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public ConstructionScheduleResponse updateSchedule(UUID id, UpdateScheduleRequest request) {
        ConstructionSchedule schedule = getScheduleOrThrow(id);

        if (request.name() != null) {
            schedule.setName(request.name());
        }
        if (request.description() != null) {
            schedule.setDescription(request.description());
        }
        if (request.plannedStartDate() != null) {
            schedule.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            schedule.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            schedule.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            schedule.setActualEndDate(request.actualEndDate());
        }

        schedule = scheduleRepository.save(schedule);
        auditService.logUpdate("ConstructionSchedule", schedule.getId(), "multiple", null, null);

        log.info("Construction schedule updated: {} ({})", schedule.getName(), schedule.getId());
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public void deleteSchedule(UUID id) {
        ConstructionSchedule schedule = getScheduleOrThrow(id);
        schedule.softDelete();
        scheduleRepository.save(schedule);
        auditService.logDelete("ConstructionSchedule", id);
        log.info("Construction schedule deleted: {} ({})", schedule.getName(), id);
    }

    @Transactional
    public ConstructionScheduleResponse approve(UUID id) {
        ConstructionSchedule schedule = getScheduleOrThrow(id);

        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Невозможно утвердить календарный план в статусе '%s'. Требуется статус '%s'",
                            schedule.getStatus().getDisplayName(),
                            ScheduleStatus.DRAFT.getDisplayName()));
        }

        ScheduleStatus oldStatus = schedule.getStatus();
        schedule.setStatus(ScheduleStatus.APPROVED);
        schedule = scheduleRepository.save(schedule);

        auditService.logStatusChange("ConstructionSchedule", schedule.getId(),
                oldStatus.name(), ScheduleStatus.APPROVED.name());

        log.info("Construction schedule approved: {} ({})", schedule.getName(), schedule.getId());
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public ConstructionScheduleResponse activate(UUID id) {
        ConstructionSchedule schedule = getScheduleOrThrow(id);

        if (schedule.getStatus() != ScheduleStatus.APPROVED) {
            throw new IllegalStateException(
                    String.format("Невозможно активировать календарный план в статусе '%s'. Требуется статус '%s'",
                            schedule.getStatus().getDisplayName(),
                            ScheduleStatus.APPROVED.getDisplayName()));
        }

        ScheduleStatus oldStatus = schedule.getStatus();
        schedule.setStatus(ScheduleStatus.ACTIVE);
        schedule = scheduleRepository.save(schedule);

        auditService.logStatusChange("ConstructionSchedule", schedule.getId(),
                oldStatus.name(), ScheduleStatus.ACTIVE.name());

        log.info("Construction schedule activated: {} ({})", schedule.getName(), schedule.getId());
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    @Transactional(readOnly = true)
    public List<ConstructionScheduleResponse> getProjectSchedules(UUID projectId) {
        return scheduleRepository.findByProjectIdAndDeletedFalseOrderByDocVersionDesc(projectId)
                .stream()
                .map(ConstructionScheduleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConstructionScheduleResponse getActiveSchedule(UUID projectId) {
        ConstructionSchedule schedule = scheduleRepository
                .findByProjectIdAndStatusAndDeletedFalse(projectId, ScheduleStatus.ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Активный календарный план не найден для проекта: " + projectId));
        return ConstructionScheduleResponse.fromEntity(schedule);
    }

    private ConstructionSchedule getScheduleOrThrow(UUID id) {
        return scheduleRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Календарный план не найден: " + id));
    }
}
