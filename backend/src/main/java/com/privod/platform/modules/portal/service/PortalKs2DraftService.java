package com.privod.platform.modules.portal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.portal.domain.PortalKs2Draft;
import com.privod.platform.modules.portal.domain.PortalKs2DraftStatus;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.repository.PortalKs2DraftRepository;
import com.privod.platform.modules.portal.repository.PortalUserRepository;
import com.privod.platform.modules.portal.web.dto.CreatePortalKs2DraftRequest;
import com.privod.platform.modules.portal.web.dto.PortalKs2DraftResponse;
import com.privod.platform.modules.portal.web.dto.ReviewPortalKs2DraftRequest;
import com.privod.platform.modules.portal.web.dto.UpdatePortalKs2DraftRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalKs2DraftService {

    private final PortalKs2DraftRepository portalKs2DraftRepository;
    private final PortalUserRepository portalUserRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PortalKs2DraftResponse> getMyDrafts(UUID portalUserId, Pageable pageable) {
        return portalKs2DraftRepository.findByPortalUserIdAndDeletedFalse(portalUserId, pageable)
                .map(PortalKs2DraftResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PortalKs2DraftResponse> getDraftsForReview(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<PortalKs2DraftStatus> reviewStatuses = List.of(
                PortalKs2DraftStatus.SUBMITTED,
                PortalKs2DraftStatus.UNDER_REVIEW
        );
        return portalKs2DraftRepository
                .findByOrganizationIdAndStatusInAndDeletedFalse(orgId, reviewStatuses, pageable)
                .map(PortalKs2DraftResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PortalKs2DraftResponse getById(UUID id) {
        PortalKs2Draft draft = findDraftOrThrow(id);
        return PortalKs2DraftResponse.fromEntity(draft);
    }

    @Transactional
    public PortalKs2DraftResponse create(CreatePortalKs2DraftRequest request, UUID portalUserId) {
        PortalUser portalUser = portalUserRepository.findById(portalUserId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Пользователь портала не найден: " + portalUserId));

        PortalKs2Draft draft = PortalKs2Draft.builder()
                .organizationId(portalUser.getOrganizationId())
                .portalUserId(portalUserId)
                .projectId(request.projectId())
                .contractId(request.contractId())
                .draftNumber(request.draftNumber())
                .reportingPeriodStart(request.reportingPeriodStart())
                .reportingPeriodEnd(request.reportingPeriodEnd())
                .totalAmount(request.totalAmount())
                .workDescription(request.workDescription())
                .linesJson(request.linesJson())
                .status(PortalKs2DraftStatus.DRAFT)
                .build();

        draft = portalKs2DraftRepository.save(draft);
        auditService.logCreate("PortalKs2Draft", draft.getId());
        log.info("Portal KS-2 draft created: id={}, portalUser={}, project={}",
                draft.getId(), portalUserId, request.projectId());
        return PortalKs2DraftResponse.fromEntity(draft);
    }

    @Transactional
    public PortalKs2DraftResponse update(UUID id, UpdatePortalKs2DraftRequest request, UUID portalUserId) {
        PortalKs2Draft draft = findDraftOrThrow(id);

        if (!draft.getPortalUserId().equals(portalUserId)) {
            throw new IllegalStateException("Только автор может редактировать черновик");
        }
        if (draft.getStatus() != PortalKs2DraftStatus.DRAFT) {
            throw new IllegalStateException("Редактировать можно только черновик со статусом DRAFT");
        }

        if (request.projectId() != null) {
            draft.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            draft.setContractId(request.contractId());
        }
        if (request.draftNumber() != null) {
            draft.setDraftNumber(request.draftNumber());
        }
        if (request.reportingPeriodStart() != null) {
            draft.setReportingPeriodStart(request.reportingPeriodStart());
        }
        if (request.reportingPeriodEnd() != null) {
            draft.setReportingPeriodEnd(request.reportingPeriodEnd());
        }
        if (request.totalAmount() != null) {
            draft.setTotalAmount(request.totalAmount());
        }
        if (request.workDescription() != null) {
            draft.setWorkDescription(request.workDescription());
        }
        if (request.linesJson() != null) {
            draft.setLinesJson(request.linesJson());
        }

        draft = portalKs2DraftRepository.save(draft);
        auditService.logUpdate("PortalKs2Draft", draft.getId(), "fields", null, null);
        log.info("Portal KS-2 draft updated: id={}, portalUser={}", id, portalUserId);
        return PortalKs2DraftResponse.fromEntity(draft);
    }

    @Transactional
    public PortalKs2DraftResponse submit(UUID id, UUID portalUserId) {
        PortalKs2Draft draft = findDraftOrThrow(id);

        if (!draft.getPortalUserId().equals(portalUserId)) {
            throw new IllegalStateException("Только автор может отправить черновик на рассмотрение");
        }
        if (draft.getStatus() != PortalKs2DraftStatus.DRAFT) {
            throw new IllegalStateException("Отправить можно только черновик со статусом DRAFT");
        }

        String oldStatus = draft.getStatus().name();
        draft.setStatus(PortalKs2DraftStatus.SUBMITTED);
        draft.setSubmittedAt(Instant.now());

        draft = portalKs2DraftRepository.save(draft);
        auditService.logStatusChange("PortalKs2Draft", draft.getId(), oldStatus, draft.getStatus().name());
        log.info("Portal KS-2 draft submitted: id={}, portalUser={}", id, portalUserId);
        return PortalKs2DraftResponse.fromEntity(draft);
    }

    @Transactional
    public PortalKs2DraftResponse review(UUID id, ReviewPortalKs2DraftRequest request) {
        PortalKs2Draft draft = findDraftOrThrow(id);

        if (draft.getStatus() != PortalKs2DraftStatus.SUBMITTED
                && draft.getStatus() != PortalKs2DraftStatus.UNDER_REVIEW) {
            throw new IllegalStateException(
                    "Рассматривать можно только черновики со статусом SUBMITTED или UNDER_REVIEW");
        }

        UUID reviewerId = SecurityUtils.requireCurrentUserId();
        String oldStatus = draft.getStatus().name();

        if (Boolean.TRUE.equals(request.approved())) {
            draft.setStatus(PortalKs2DraftStatus.APPROVED);
        } else {
            draft.setStatus(PortalKs2DraftStatus.REJECTED);
        }

        draft.setReviewComment(request.reviewComment());
        draft.setReviewedBy(reviewerId);
        draft.setReviewedAt(Instant.now());

        draft = portalKs2DraftRepository.save(draft);
        auditService.logStatusChange("PortalKs2Draft", draft.getId(), oldStatus, draft.getStatus().name());
        log.info("Portal KS-2 draft reviewed: id={}, approved={}, reviewer={}",
                id, request.approved(), reviewerId);
        return PortalKs2DraftResponse.fromEntity(draft);
    }

    @Transactional
    public void delete(UUID id, UUID portalUserId) {
        PortalKs2Draft draft = findDraftOrThrow(id);

        if (!draft.getPortalUserId().equals(portalUserId)) {
            throw new IllegalStateException("Только автор может удалить черновик");
        }
        if (draft.getStatus() != PortalKs2DraftStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только черновик со статусом DRAFT");
        }

        draft.softDelete();
        portalKs2DraftRepository.save(draft);
        auditService.logDelete("PortalKs2Draft", draft.getId());
        log.info("Portal KS-2 draft deleted: id={}, portalUser={}", id, portalUserId);
    }

    private PortalKs2Draft findDraftOrThrow(UUID id) {
        return portalKs2DraftRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Черновик КС-2 не найден: " + id));
    }
}
