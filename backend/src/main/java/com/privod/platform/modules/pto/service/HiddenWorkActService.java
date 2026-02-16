package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.HiddenWorkAct;
import com.privod.platform.modules.pto.domain.HiddenWorkActStatus;
import com.privod.platform.modules.pto.repository.HiddenWorkActRepository;
import com.privod.platform.modules.pto.web.dto.CreateHiddenWorkActRequest;
import com.privod.platform.modules.pto.web.dto.HiddenWorkActResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HiddenWorkActService {

    private final HiddenWorkActRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<HiddenWorkActResponse> findAll(UUID projectId, HiddenWorkActStatus status, Pageable pageable) {
        Specification<HiddenWorkAct> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return repository.findAll(spec, pageable).map(HiddenWorkActResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public HiddenWorkActResponse findById(UUID id) {
        HiddenWorkAct act = getOrThrow(id);
        return HiddenWorkActResponse.fromEntity(act);
    }

    @Transactional
    public HiddenWorkActResponse create(CreateHiddenWorkActRequest request) {
        HiddenWorkAct act = HiddenWorkAct.builder()
                .projectId(request.projectId())
                .date(request.date())
                .workDescription(request.workDescription())
                .location(request.location())
                .inspectorId(request.inspectorId())
                .contractorId(request.contractorId())
                .status(HiddenWorkActStatus.DRAFT)
                .photoIds(request.photoIds())
                .notes(request.notes())
                .build();

        act = repository.save(act);
        auditService.logCreate("HiddenWorkAct", act.getId());

        log.info("Акт скрытых работ создан для проекта: {} ({})", request.projectId(), act.getId());
        return HiddenWorkActResponse.fromEntity(act);
    }

    @Transactional
    public HiddenWorkActResponse updateStatus(UUID id, HiddenWorkActStatus newStatus) {
        HiddenWorkAct act = getOrThrow(id);
        HiddenWorkActStatus oldStatus = act.getStatus();
        act.setStatus(newStatus);
        act = repository.save(act);
        auditService.logStatusChange("HiddenWorkAct", id, oldStatus.name(), newStatus.name());
        return HiddenWorkActResponse.fromEntity(act);
    }

    @Transactional
    public void delete(UUID id) {
        HiddenWorkAct act = getOrThrow(id);
        act.softDelete();
        repository.save(act);
        auditService.logDelete("HiddenWorkAct", id);
        log.info("Акт скрытых работ удалён: {}", id);
    }

    private HiddenWorkAct getOrThrow(UUID id) {
        return repository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт скрытых работ не найден: " + id));
    }
}
