package com.privod.platform.modules.cde.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.RevisionSet;
import com.privod.platform.modules.cde.repository.RevisionSetRepository;
import com.privod.platform.modules.cde.web.dto.CreateRevisionSetRequest;
import com.privod.platform.modules.cde.web.dto.RevisionSetResponse;
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
public class RevisionSetService {

    private final RevisionSetRepository revisionSetRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RevisionSetResponse> findByProject(UUID projectId, Pageable pageable) {
        return revisionSetRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(RevisionSetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RevisionSetResponse findById(UUID id) {
        RevisionSet set = getRevisionSetOrThrow(id);
        return RevisionSetResponse.fromEntity(set);
    }

    @Transactional
    public RevisionSetResponse create(CreateRevisionSetRequest request) {
        RevisionSet set = RevisionSet.builder()
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .revisionIds(request.revisionIds())
                .issuedDate(request.issuedDate())
                .issuedById(request.issuedById())
                .build();

        set = revisionSetRepository.save(set);
        auditService.logCreate("RevisionSet", set.getId());

        log.info("RevisionSet created: {} ({})", set.getName(), set.getId());
        return RevisionSetResponse.fromEntity(set);
    }

    @Transactional
    public RevisionSetResponse update(UUID id, CreateRevisionSetRequest request) {
        RevisionSet set = getRevisionSetOrThrow(id);

        if (request.name() != null) set.setName(request.name());
        if (request.description() != null) set.setDescription(request.description());
        if (request.revisionIds() != null) set.setRevisionIds(request.revisionIds());
        if (request.issuedDate() != null) set.setIssuedDate(request.issuedDate());
        if (request.issuedById() != null) set.setIssuedById(request.issuedById());

        set = revisionSetRepository.save(set);
        auditService.logUpdate("RevisionSet", set.getId(), "multiple", null, null);

        log.info("RevisionSet updated: {} ({})", set.getName(), set.getId());
        return RevisionSetResponse.fromEntity(set);
    }

    @Transactional
    public void delete(UUID id) {
        RevisionSet set = getRevisionSetOrThrow(id);
        set.softDelete();
        revisionSetRepository.save(set);
        auditService.logDelete("RevisionSet", id);
        log.info("RevisionSet soft-deleted: {} ({})", set.getName(), id);
    }

    private RevisionSet getRevisionSetOrThrow(UUID id) {
        return revisionSetRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Набор ревизий не найден с id: " + id));
    }
}
