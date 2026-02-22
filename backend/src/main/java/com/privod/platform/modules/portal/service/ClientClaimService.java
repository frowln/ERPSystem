package com.privod.platform.modules.portal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.portal.domain.ClaimActivityType;
import com.privod.platform.modules.portal.domain.ClaimAuthorType;
import com.privod.platform.modules.portal.domain.ClaimPriority;
import com.privod.platform.modules.portal.domain.ClaimStatus;
import com.privod.platform.modules.portal.domain.ClientClaim;
import com.privod.platform.modules.portal.domain.ClientClaimActivity;
import com.privod.platform.modules.portal.repository.ClientClaimActivityRepository;
import com.privod.platform.modules.portal.repository.ClientClaimRepository;
import com.privod.platform.modules.portal.web.dto.AddClaimCommentRequest;
import com.privod.platform.modules.portal.web.dto.AssignClaimRequest;
import com.privod.platform.modules.portal.web.dto.ClaimFeedbackRequest;
import com.privod.platform.modules.portal.web.dto.ClaimsDashboardResponse;
import com.privod.platform.modules.portal.web.dto.ClientClaimDetailResponse;
import com.privod.platform.modules.portal.web.dto.ClientClaimResponse;
import com.privod.platform.modules.portal.web.dto.CreateClientClaimRequest;
import com.privod.platform.modules.portal.web.dto.ResolveClaimRequest;
import com.privod.platform.modules.portal.web.dto.TriageClaimRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientClaimService {

    private final ClientClaimRepository claimRepository;
    private final ClientClaimActivityRepository activityRepository;
    private final AuditService auditService;

    @Transactional
    public ClientClaimResponse createClaim(CreateClientClaimRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Long seq = claimRepository.getNextClaimNumber();
        String claimNumber = "CLM-" + seq;

        ClaimPriority priority = request.priority() != null ? request.priority() : ClaimPriority.MEDIUM;
        Instant now = Instant.now();
        Instant slaDeadline = now.plus(priority.getSlaDays(), ChronoUnit.DAYS);

        ClientClaim claim = ClientClaim.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .claimNumber(claimNumber)
                .unitNumber(request.unitNumber())
                .category(request.category())
                .priority(priority)
                .title(request.title())
                .description(request.description())
                .locationDescription(request.locationDescription())
                .status(ClaimStatus.SUBMITTED)
                .reportedByName(request.reportedByName())
                .reportedByPhone(request.reportedByPhone())
                .reportedByEmail(request.reportedByEmail())
                .slaDeadline(slaDeadline)
                .slaBreached(false)
                .build();

        claim = claimRepository.save(claim);
        auditService.logCreate("ClientClaim", claim.getId());

        createActivity(claim.getId(), ClaimActivityType.STATUS_CHANGE, ClaimAuthorType.SYSTEM,
                "Заявка создана", null, ClaimStatus.SUBMITTED.name());

        log.info("Клиентская заявка создана: {} ({})", claimNumber, claim.getId());
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional(readOnly = true)
    public ClientClaimDetailResponse getClaim(UUID id) {
        ClientClaim claim = getOrThrow(id);
        List<ClientClaimActivity> activities = activityRepository
                .findByClaimIdAndDeletedFalseOrderByCreatedAtDesc(id);
        return ClientClaimDetailResponse.fromEntity(claim, activities);
    }

    @Transactional(readOnly = true)
    public Page<ClientClaimResponse> listClaims(UUID projectId, ClaimStatus status,
                                                 ClaimPriority priority, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Specification<ClientClaim> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            predicates.add(cb.equal(root.get("organizationId"), orgId));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return claimRepository.findAll(spec, pageable).map(ClientClaimResponse::fromEntity);
    }

    @Transactional
    public ClientClaimResponse triageClaim(UUID id, TriageClaimRequest request) {
        ClientClaim claim = getOrThrow(id);
        validateTransition(claim, ClaimStatus.TRIAGED);

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(ClaimStatus.TRIAGED);
        claim.setTriagedAt(Instant.now());
        claim.setTriagedBy(SecurityUtils.requireCurrentUserId());

        if (request.priority() != null) {
            claim.setPriority(request.priority());
            // Recalculate SLA based on new priority
            claim.setSlaDeadline(claim.getCreatedAt().plus(request.priority().getSlaDays(), ChronoUnit.DAYS));
        }
        if (request.internalNotes() != null) {
            claim.setInternalNotes(request.internalNotes());
        }

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), ClaimStatus.TRIAGED.name());

        createActivity(id, ClaimActivityType.STATUS_CHANGE, ClaimAuthorType.INTERNAL,
                "Заявка рассмотрена", oldStatus.name(), ClaimStatus.TRIAGED.name());

        log.info("Клиентская заявка рассмотрена: {} ({})", claim.getClaimNumber(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClientClaimResponse assignClaim(UUID id, AssignClaimRequest request) {
        ClientClaim claim = getOrThrow(id);
        validateTransition(claim, ClaimStatus.ASSIGNED);

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(ClaimStatus.ASSIGNED);
        claim.setAssignedContractorId(request.contractorId());
        claim.setAssignedContractorName(request.contractorName());
        claim.setAssignedAt(Instant.now());

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), ClaimStatus.ASSIGNED.name());

        createActivity(id, ClaimActivityType.ASSIGNMENT, ClaimAuthorType.INTERNAL,
                "Назначен подрядчик: " + request.contractorName(),
                null, request.contractorId().toString());

        createActivity(id, ClaimActivityType.STATUS_CHANGE, ClaimAuthorType.INTERNAL,
                "Заявка назначена", oldStatus.name(), ClaimStatus.ASSIGNED.name());

        log.info("Клиентская заявка назначена: {} -> {} ({})",
                claim.getClaimNumber(), request.contractorName(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClientClaimResponse startWork(UUID id) {
        ClientClaim claim = getOrThrow(id);
        validateTransition(claim, ClaimStatus.IN_PROGRESS);

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(ClaimStatus.IN_PROGRESS);

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), ClaimStatus.IN_PROGRESS.name());

        createActivity(id, ClaimActivityType.STATUS_CHANGE, ClaimAuthorType.INTERNAL,
                "Работа начата", oldStatus.name(), ClaimStatus.IN_PROGRESS.name());

        log.info("Работа по заявке начата: {} ({})", claim.getClaimNumber(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClientClaimResponse submitResolution(UUID id, ResolveClaimRequest request) {
        ClientClaim claim = getOrThrow(id);
        validateTransition(claim, ClaimStatus.VERIFICATION);

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(ClaimStatus.VERIFICATION);
        claim.setResolution(request.resolution());
        claim.setResolutionDate(Instant.now());

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), ClaimStatus.VERIFICATION.name());

        createActivity(id, ClaimActivityType.RESOLUTION, ClaimAuthorType.INTERNAL,
                "Решение предложено: " + request.resolution(), oldStatus.name(), ClaimStatus.VERIFICATION.name());

        log.info("Решение по заявке предложено: {} ({})", claim.getClaimNumber(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClientClaimResponse acceptResolution(UUID id, ClaimFeedbackRequest request) {
        ClientClaim claim = getOrThrow(id);

        if (claim.getStatus() != ClaimStatus.VERIFICATION) {
            throw new IllegalStateException(
                    "Заявка должна быть в статусе 'На проверке' для принятия/отклонения решения. Текущий статус: "
                            + claim.getStatus().getDisplayName());
        }

        ClaimStatus oldStatus = claim.getStatus();
        claim.setResolutionAccepted(request.accepted());
        claim.setResolutionFeedback(request.feedback());
        claim.setResolutionRating(request.rating());

        if (Boolean.TRUE.equals(request.accepted())) {
            claim.setStatus(ClaimStatus.CLOSED);
            createActivity(id, ClaimActivityType.FEEDBACK, ClaimAuthorType.PORTAL_USER,
                    "Решение принято. Оценка: " + request.rating() +
                            (request.feedback() != null ? ". Отзыв: " + request.feedback() : ""),
                    oldStatus.name(), ClaimStatus.CLOSED.name());
        } else {
            claim.setStatus(ClaimStatus.IN_PROGRESS);
            claim.setResolution(null);
            claim.setResolutionDate(null);
            createActivity(id, ClaimActivityType.FEEDBACK, ClaimAuthorType.PORTAL_USER,
                    "Решение отклонено" +
                            (request.feedback() != null ? ". Причина: " + request.feedback() : ""),
                    oldStatus.name(), ClaimStatus.IN_PROGRESS.name());
        }

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), claim.getStatus().name());

        log.info("Обратная связь по заявке: {} accepted={} ({})",
                claim.getClaimNumber(), request.accepted(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public ClientClaimResponse rejectClaim(UUID id, String reason) {
        ClientClaim claim = getOrThrow(id);

        if (claim.getStatus() == ClaimStatus.CLOSED || claim.getStatus() == ClaimStatus.REJECTED) {
            throw new IllegalStateException(
                    "Невозможно отклонить заявку в статусе: " + claim.getStatus().getDisplayName());
        }

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setResolution(reason);
        claim.setResolutionDate(Instant.now());

        claim = claimRepository.save(claim);
        auditService.logStatusChange("ClientClaim", id, oldStatus.name(), ClaimStatus.REJECTED.name());

        createActivity(id, ClaimActivityType.STATUS_CHANGE, ClaimAuthorType.INTERNAL,
                "Заявка отклонена" + (reason != null ? ": " + reason : ""),
                oldStatus.name(), ClaimStatus.REJECTED.name());

        log.info("Клиентская заявка отклонена: {} ({})", claim.getClaimNumber(), id);
        return ClientClaimResponse.fromEntity(claim);
    }

    @Transactional
    public void addComment(UUID id, AddClaimCommentRequest request) {
        ClientClaim claim = getOrThrow(id);

        ClaimAuthorType authorType = request.authorType() != null ? request.authorType() : ClaimAuthorType.INTERNAL;
        String authorName = SecurityUtils.getCurrentUserDetails()
                .map(details -> details.getUsername())
                .orElse("Система");

        createActivity(id, ClaimActivityType.COMMENT, authorType,
                request.content(), null, null);

        log.info("Комментарий добавлен к заявке: {} ({})", claim.getClaimNumber(), id);
    }

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkSlaBreaches() {
        List<ClientClaim> candidates = claimRepository.findSlaBreachedCandidates();
        int breachedCount = 0;

        for (ClientClaim claim : candidates) {
            claim.setSlaBreached(true);
            claimRepository.save(claim);

            createActivity(claim.getId(), ClaimActivityType.SLA_BREACH, ClaimAuthorType.SYSTEM,
                    "SLA нарушен. Срок: " + claim.getSlaDeadline(), null, null);

            auditService.logUpdate("ClientClaim", claim.getId(), "slaBreached", "false", "true");
            breachedCount++;
        }

        if (breachedCount > 0) {
            log.warn("SLA нарушен для {} клиентских заявок", breachedCount);
        } else {
            log.info("Проверка SLA завершена: нарушений не обнаружено");
        }
    }

    @Transactional(readOnly = true)
    public ClaimsDashboardResponse getDashboard(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalClaims;
        long openClaims;
        long assignedClaims;

        if (projectId != null) {
            totalClaims = claimRepository.countByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId);
            openClaims = claimRepository.countByOrganizationIdAndProjectIdAndStatusAndDeletedFalse(
                    orgId, projectId, ClaimStatus.SUBMITTED);
            assignedClaims = claimRepository.countByOrganizationIdAndProjectIdAndStatusAndDeletedFalse(
                    orgId, projectId, ClaimStatus.ASSIGNED);
        } else {
            totalClaims = claimRepository.countByOrganizationIdAndDeletedFalse(orgId);
            openClaims = claimRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, ClaimStatus.SUBMITTED);
            assignedClaims = claimRepository.countByOrganizationIdAndStatusAndDeletedFalse(orgId, ClaimStatus.ASSIGNED);
        }

        long overdueCount = claimRepository.findOverdue(orgId, projectId).size();
        Double avgResolutionDays = claimRepository.avgResolutionDays(orgId, projectId);

        Map<String, Long> byCategoryMap = new LinkedHashMap<>();
        for (Object[] row : claimRepository.countByCategory(orgId, projectId)) {
            byCategoryMap.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> byStatusMap = new LinkedHashMap<>();
        for (Object[] row : claimRepository.countByStatus(orgId, projectId)) {
            byStatusMap.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> byPriorityMap = new LinkedHashMap<>();
        for (Object[] row : claimRepository.countByPriority(orgId, projectId)) {
            byPriorityMap.put(row[0].toString(), (Long) row[1]);
        }

        return new ClaimsDashboardResponse(
                totalClaims, openClaims, assignedClaims, overdueCount,
                avgResolutionDays, byCategoryMap, byStatusMap, byPriorityMap
        );
    }

    @Transactional(readOnly = true)
    public List<ClientClaimResponse> getClaimsForPortalUser(UUID portalUserId) {
        return claimRepository.findByReportedByPortalUserIdAndDeletedFalse(portalUserId).stream()
                .map(ClientClaimResponse::fromEntity)
                .toList();
    }

    // ---- Internal helpers ----

    private ClientClaim getOrThrow(UUID id) {
        return claimRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Клиентская заявка не найдена: " + id));
    }

    private void validateTransition(ClientClaim claim, ClaimStatus targetStatus) {
        if (!claim.getStatus().canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести заявку из статуса '%s' в '%s'",
                            claim.getStatus().getDisplayName(), targetStatus.getDisplayName()));
        }
    }

    private void createActivity(UUID claimId, ClaimActivityType type, ClaimAuthorType authorType,
                                 String content, String oldValue, String newValue) {
        String authorName = null;
        if (authorType == ClaimAuthorType.SYSTEM) {
            authorName = "Система";
        } else {
            authorName = SecurityUtils.getCurrentUserDetails()
                    .map(details -> details.getUsername())
                    .orElse(null);
        }

        ClientClaimActivity activity = ClientClaimActivity.builder()
                .claimId(claimId)
                .activityType(type)
                .authorName(authorName)
                .authorType(authorType)
                .content(content)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();

        activityRepository.save(activity);
    }
}
