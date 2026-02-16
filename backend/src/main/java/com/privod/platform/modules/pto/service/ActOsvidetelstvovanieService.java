package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanie;
import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanieStatus;
import com.privod.platform.modules.pto.repository.ActOsvidetelstvovanieRepository;
import com.privod.platform.modules.pto.web.dto.ActOsvidetelstvovanieResponse;
import com.privod.platform.modules.pto.web.dto.CreateActOsvidetelstvovanieRequest;
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
public class ActOsvidetelstvovanieService {

    private final ActOsvidetelstvovanieRepository actRepository;
    private final PtoCodeGenerator codeGenerator;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ActOsvidetelstvovanieResponse> listActs(UUID projectId, Pageable pageable) {
        return actRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ActOsvidetelstvovanieResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ActOsvidetelstvovanieResponse getAct(UUID id) {
        ActOsvidetelstvovanie act = getActOrThrow(id);
        return ActOsvidetelstvovanieResponse.fromEntity(act);
    }

    @Transactional
    public ActOsvidetelstvovanieResponse createAct(CreateActOsvidetelstvovanieRequest request) {
        String code = codeGenerator.generateActCode();

        ActOsvidetelstvovanie act = ActOsvidetelstvovanie.builder()
                .projectId(request.projectId())
                .code(code)
                .workType(request.workType())
                .volume(request.volume())
                .unit(request.unit())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .responsibleId(request.responsibleId())
                .inspectorId(request.inspectorId())
                .result(request.result())
                .comments(request.comments())
                .status(ActOsvidetelstvovanieStatus.DRAFT)
                .build();

        act = actRepository.save(act);
        auditService.logCreate("ActOsvidetelstvovanie", act.getId());

        log.info("Act of osvidetelstvovanie created: {} ({}) for project {}", act.getCode(), act.getId(), request.projectId());
        return ActOsvidetelstvovanieResponse.fromEntity(act);
    }

    @Transactional
    public ActOsvidetelstvovanieResponse changeStatus(UUID id, ActOsvidetelstvovanieStatus newStatus) {
        ActOsvidetelstvovanie act = getActOrThrow(id);
        ActOsvidetelstvovanieStatus oldStatus = act.getStatus();

        if (!act.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести акт из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        act.setStatus(newStatus);
        act = actRepository.save(act);
        auditService.logStatusChange("ActOsvidetelstvovanie", act.getId(), oldStatus.name(), newStatus.name());

        log.info("Act status changed: {} from {} to {} ({})", act.getCode(), oldStatus, newStatus, act.getId());
        return ActOsvidetelstvovanieResponse.fromEntity(act);
    }

    private ActOsvidetelstvovanie getActOrThrow(UUID id) {
        return actRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт освидетельствования не найден: " + id));
    }
}
