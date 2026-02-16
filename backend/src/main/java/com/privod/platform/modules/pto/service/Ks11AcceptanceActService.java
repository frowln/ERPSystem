package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.Ks11AcceptanceAct;
import com.privod.platform.modules.pto.domain.Ks11Status;
import com.privod.platform.modules.pto.repository.Ks11AcceptanceActRepository;
import com.privod.platform.modules.pto.web.dto.CreateKs11AcceptanceActRequest;
import com.privod.platform.modules.pto.web.dto.Ks11AcceptanceActResponse;
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
public class Ks11AcceptanceActService {

    private final Ks11AcceptanceActRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<Ks11AcceptanceActResponse> findAll(UUID projectId, Ks11Status status, Pageable pageable) {
        Specification<Ks11AcceptanceAct> spec = (root, query, cb) -> {
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

        return repository.findAll(spec, pageable).map(Ks11AcceptanceActResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Ks11AcceptanceActResponse findById(UUID id) {
        Ks11AcceptanceAct act = getOrThrow(id);
        return Ks11AcceptanceActResponse.fromEntity(act);
    }

    @Transactional
    public Ks11AcceptanceActResponse create(CreateKs11AcceptanceActRequest request) {
        Ks11AcceptanceAct act = Ks11AcceptanceAct.builder()
                .projectId(request.projectId())
                .date(request.date())
                .commissionMembers(request.commissionMembers())
                .decision(request.decision())
                .defects(request.defects())
                .notes(request.notes())
                .status(Ks11Status.DRAFT)
                .build();

        act = repository.save(act);
        auditService.logCreate("Ks11AcceptanceAct", act.getId());

        log.info("Акт приёмки КС-11 создан для проекта: {} ({})", request.projectId(), act.getId());
        return Ks11AcceptanceActResponse.fromEntity(act);
    }

    @Transactional
    public Ks11AcceptanceActResponse updateStatus(UUID id, Ks11Status newStatus) {
        Ks11AcceptanceAct act = getOrThrow(id);
        Ks11Status oldStatus = act.getStatus();
        act.setStatus(newStatus);
        act = repository.save(act);
        auditService.logStatusChange("Ks11AcceptanceAct", id, oldStatus.name(), newStatus.name());
        return Ks11AcceptanceActResponse.fromEntity(act);
    }

    @Transactional
    public void delete(UUID id) {
        Ks11AcceptanceAct act = getOrThrow(id);
        act.softDelete();
        repository.save(act);
        auditService.logDelete("Ks11AcceptanceAct", id);
        log.info("Акт приёмки КС-11 удалён: {}", id);
    }

    private Ks11AcceptanceAct getOrThrow(UUID id) {
        return repository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт приёмки КС-11 не найден: " + id));
    }
}
