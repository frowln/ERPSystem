package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.BaselineType;
import com.privod.platform.modules.planning.domain.ScheduleBaseline;
import com.privod.platform.modules.planning.repository.ScheduleBaselineRepository;
import com.privod.platform.modules.planning.web.dto.CreateScheduleBaselineRequest;
import com.privod.platform.modules.planning.web.dto.ScheduleBaselineResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleBaselineService {

    private final ScheduleBaselineRepository baselineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ScheduleBaselineResponse> findByProject(UUID projectId, Pageable pageable) {
        if (projectId == null) {
            return baselineRepository.findByDeletedFalse(pageable)
                    .map(ScheduleBaselineResponse::fromEntity);
        }
        return baselineRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ScheduleBaselineResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ScheduleBaselineResponse findById(UUID id) {
        ScheduleBaseline baseline = getBaselineOrThrow(id);
        return ScheduleBaselineResponse.fromEntity(baseline);
    }

    @Transactional
    public ScheduleBaselineResponse create(CreateScheduleBaselineRequest request) {
        ScheduleBaseline baseline = ScheduleBaseline.builder()
                .projectId(request.projectId())
                .name(request.name())
                .baselineType(request.baselineType() != null ? request.baselineType() : BaselineType.ORIGINAL)
                .baselineDate(request.baselineDate())
                .snapshotData(request.snapshotData())
                .createdById(request.createdById())
                .notes(request.notes())
                .build();

        baseline = baselineRepository.save(baseline);
        auditService.logCreate("ScheduleBaseline", baseline.getId());

        log.info("Базовый план создан: {} ({}) для проекта {}",
                baseline.getName(), baseline.getId(), baseline.getProjectId());
        return ScheduleBaselineResponse.fromEntity(baseline);
    }

    @Transactional
    public void delete(UUID id) {
        ScheduleBaseline baseline = getBaselineOrThrow(id);
        baseline.softDelete();
        baselineRepository.save(baseline);
        auditService.logDelete("ScheduleBaseline", id);
        log.info("Базовый план удалён: {} ({})", baseline.getName(), id);
    }

    private ScheduleBaseline getBaselineOrThrow(UUID id) {
        return baselineRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Базовый план не найден: " + id));
    }
}
