package com.privod.platform.modules.monthlySchedule.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.monthlySchedule.domain.MonthlySchedule;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleLine;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleStatus;
import com.privod.platform.modules.monthlySchedule.repository.MonthlyScheduleLineRepository;
import com.privod.platform.modules.monthlySchedule.repository.MonthlyScheduleRepository;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleLineRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleLineResponse;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyScheduleService {

    private final MonthlyScheduleRepository scheduleRepository;
    private final MonthlyScheduleLineRepository lineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MonthlyScheduleResponse> findAll(UUID projectId, MonthlyScheduleStatus status,
                                                  Integer year, Pageable pageable) {
        Specification<MonthlySchedule> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (year != null) {
                predicates.add(cb.equal(root.get("year"), year));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return scheduleRepository.findAll(spec, pageable).map(MonthlyScheduleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MonthlyScheduleResponse findById(UUID id) {
        MonthlySchedule schedule = getOrThrow(id);
        return MonthlyScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public MonthlyScheduleResponse create(CreateMonthlyScheduleRequest request) {
        scheduleRepository.findByProjectIdAndYearAndMonthAndDeletedFalse(
                request.projectId(), request.year(), request.month()
        ).ifPresent(existing -> {
            throw new IllegalArgumentException(
                    String.format("Месячный график на %d/%d для данного проекта уже существует", request.month(), request.year()));
        });

        MonthlySchedule schedule = MonthlySchedule.builder()
                .projectId(request.projectId())
                .year(request.year())
                .month(request.month())
                .status(MonthlyScheduleStatus.DRAFT)
                .build();

        schedule = scheduleRepository.save(schedule);
        auditService.logCreate("MonthlySchedule", schedule.getId());

        log.info("Месячный график создан: {}/{} ({})", request.month(), request.year(), schedule.getId());
        return MonthlyScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public MonthlyScheduleResponse submit(UUID id) {
        MonthlySchedule schedule = getOrThrow(id);

        if (schedule.getStatus() != MonthlyScheduleStatus.DRAFT) {
            throw new IllegalStateException("Только черновик может быть отправлен на утверждение");
        }

        MonthlyScheduleStatus oldStatus = schedule.getStatus();
        schedule.setStatus(MonthlyScheduleStatus.SUBMITTED);
        schedule = scheduleRepository.save(schedule);
        auditService.logStatusChange("MonthlySchedule", id, oldStatus.name(), MonthlyScheduleStatus.SUBMITTED.name());

        log.info("Месячный график отправлен на утверждение: {}", id);
        return MonthlyScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public MonthlyScheduleResponse approve(UUID id, UUID approvedById) {
        MonthlySchedule schedule = getOrThrow(id);

        if (schedule.getStatus() != MonthlyScheduleStatus.SUBMITTED) {
            throw new IllegalStateException("Только отправленный график может быть утверждён");
        }

        MonthlyScheduleStatus oldStatus = schedule.getStatus();
        schedule.setStatus(MonthlyScheduleStatus.APPROVED);
        schedule.setApprovedById(approvedById);
        schedule.setApprovedAt(Instant.now());
        schedule = scheduleRepository.save(schedule);
        auditService.logStatusChange("MonthlySchedule", id, oldStatus.name(), MonthlyScheduleStatus.APPROVED.name());

        log.info("Месячный график утверждён: {}", id);
        return MonthlyScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public void delete(UUID id) {
        MonthlySchedule schedule = getOrThrow(id);
        schedule.softDelete();
        scheduleRepository.save(schedule);
        auditService.logDelete("MonthlySchedule", id);
        log.info("Месячный график удалён: {}", id);
    }

    // --- Line methods ---

    @Transactional(readOnly = true)
    public Page<MonthlyScheduleLineResponse> findLines(UUID scheduleId, Pageable pageable) {
        getOrThrow(scheduleId);
        return lineRepository.findByScheduleIdAndDeletedFalse(scheduleId, pageable)
                .map(MonthlyScheduleLineResponse::fromEntity);
    }

    @Transactional
    public MonthlyScheduleLineResponse addLine(CreateMonthlyScheduleLineRequest request) {
        MonthlySchedule schedule = getOrThrow(request.scheduleId());

        if (schedule.getStatus() == MonthlyScheduleStatus.CLOSED) {
            throw new IllegalStateException("Нельзя добавить строку в закрытый график");
        }

        MonthlyScheduleLine line = MonthlyScheduleLine.builder()
                .scheduleId(request.scheduleId())
                .workName(request.workName())
                .unit(request.unit())
                .plannedVolume(request.plannedVolume())
                .actualVolume(request.actualVolume())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .responsible(request.responsible())
                .notes(request.notes())
                .build();

        line = lineRepository.save(line);
        auditService.logCreate("MonthlyScheduleLine", line.getId());

        log.info("Строка месячного графика добавлена: {} в график {}", line.getWorkName(), request.scheduleId());
        return MonthlyScheduleLineResponse.fromEntity(line);
    }

    @Transactional
    public void deleteLine(UUID lineId) {
        MonthlyScheduleLine line = lineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка графика не найдена: " + lineId));

        line.softDelete();
        lineRepository.save(line);
        auditService.logDelete("MonthlyScheduleLine", lineId);
        log.info("Строка месячного графика удалена: {}", lineId);
    }

    private MonthlySchedule getOrThrow(UUID id) {
        return scheduleRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Месячный график не найден: " + id));
    }
}
