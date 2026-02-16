package com.privod.platform.modules.punchlist.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.punchlist.domain.PunchItem;
import com.privod.platform.modules.punchlist.domain.PunchItemComment;
import com.privod.platform.modules.punchlist.domain.PunchItemStatus;
import com.privod.platform.modules.punchlist.domain.PunchList;
import com.privod.platform.modules.punchlist.domain.PunchListStatus;
import com.privod.platform.modules.punchlist.repository.PunchItemCommentRepository;
import com.privod.platform.modules.punchlist.repository.PunchItemRepository;
import com.privod.platform.modules.punchlist.repository.PunchListRepository;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemCommentRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchListRequest;
import com.privod.platform.modules.punchlist.web.dto.PunchItemCommentResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchItemResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchListResponse;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
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
public class PunchListService {

    private final PunchListRepository punchListRepository;
    private final PunchItemRepository punchItemRepository;
    private final PunchItemCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    // ---- Punch List CRUD ----

    @Transactional(readOnly = true)
    public Page<PunchListResponse> listPunchLists(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return punchListRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(PunchListResponse::fromEntity);
        }
        List<UUID> projectIds = getOrganizationProjectIds(organizationId);
        if (projectIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return punchListRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable)
                .map(PunchListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PunchListResponse getPunchList(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchList punchList = getPunchListOrThrow(id, organizationId);
        return PunchListResponse.fromEntity(punchList);
    }

    @Transactional
    public PunchListResponse createPunchList(CreatePunchListRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (request.projectId() == null) {
            throw new IllegalArgumentException("Проект обязателен для списка замечаний");
        }
        validateProjectTenant(request.projectId(), organizationId);

        String code = generatePunchListCode();

        PunchList punchList = PunchList.builder()
                .code(code)
                .projectId(request.projectId())
                .name(request.name())
                .createdById(currentUserId)
                .dueDate(request.dueDate())
                .status(PunchListStatus.OPEN)
                .completionPercent(0)
                .areaOrZone(request.areaOrZone())
                .build();

        punchList = punchListRepository.save(punchList);
        auditService.logCreate("PunchList", punchList.getId());

        log.info("Punch list created: {} - {} ({})", punchList.getCode(),
                punchList.getName(), punchList.getId());
        return PunchListResponse.fromEntity(punchList);
    }

    @Transactional
    public PunchListResponse updatePunchList(UUID id, CreatePunchListRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchList punchList = getPunchListOrThrow(id, organizationId);

        if (request.name() != null) punchList.setName(request.name());
        if (request.dueDate() != null) punchList.setDueDate(request.dueDate());
        if (request.areaOrZone() != null) punchList.setAreaOrZone(request.areaOrZone());

        punchList = punchListRepository.save(punchList);
        auditService.logUpdate("PunchList", punchList.getId(), "multiple", null, null);

        log.info("Punch list updated: {} ({})", punchList.getCode(), punchList.getId());
        return PunchListResponse.fromEntity(punchList);
    }

    @Transactional
    public void deletePunchList(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchList punchList = getPunchListOrThrow(id, organizationId);
        punchList.softDelete();
        punchListRepository.save(punchList);
        auditService.logDelete("PunchList", id);
        log.info("Punch list deleted: {} ({})", punchList.getCode(), id);
    }

    @Transactional
    public PunchListResponse completePunchList(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchList punchList = getPunchListOrThrow(id, organizationId);

        if (punchList.getStatus() == PunchListStatus.COMPLETED) {
            throw new IllegalStateException("Список замечаний уже завершён");
        }

        PunchListStatus oldStatus = punchList.getStatus();
        punchList.setStatus(PunchListStatus.COMPLETED);
        punchList.setCompletionPercent(100);

        punchList = punchListRepository.save(punchList);
        auditService.logStatusChange("PunchList", punchList.getId(),
                oldStatus.name(), PunchListStatus.COMPLETED.name());

        log.info("Punch list completed: {} ({})", punchList.getCode(), punchList.getId());
        return PunchListResponse.fromEntity(punchList);
    }

    // ---- Punch Items ----

    @Transactional(readOnly = true)
    public List<PunchItemResponse> getPunchListItems(UUID punchListId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getPunchListOrThrow(punchListId, organizationId);
        return punchItemRepository.findByPunchListIdAndDeletedFalse(punchListId)
                .stream()
                .map(PunchItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PunchItemResponse addItem(UUID punchListId, CreatePunchItemRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchList punchList = getPunchListOrThrow(punchListId, organizationId);
        validateUserTenant(request.assignedToId(), organizationId);

        int nextNumber = punchItemRepository.getMaxNumberForList(punchListId) + 1;

        PunchItem item = PunchItem.builder()
                .punchListId(punchListId)
                .number(nextNumber)
                .description(request.description())
                .location(request.location())
                .category(request.category())
                .priority(request.priority() != null ? request.priority() : com.privod.platform.modules.punchlist.domain.PunchItemPriority.MEDIUM)
                .status(PunchItemStatus.OPEN)
                .assignedToId(request.assignedToId())
                .photoUrls(request.photoUrls())
                .fixDeadline(request.fixDeadline())
                .build();

        item = punchItemRepository.save(item);
        auditService.logCreate("PunchItem", item.getId());

        // Update punch list status
        if (punchList.getStatus() == PunchListStatus.OPEN) {
            punchList.setStatus(PunchListStatus.IN_PROGRESS);
            punchListRepository.save(punchList);
        }
        recalculateCompletion(punchListId, organizationId);

        log.info("Punch item #{} added to list {} ({})", nextNumber, punchListId, item.getId());
        return PunchItemResponse.fromEntity(item);
    }

    @Transactional
    public PunchItemResponse fixItem(UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchItem item = getItemOrThrow(itemId, organizationId);

        if (item.getStatus() != PunchItemStatus.OPEN && item.getStatus() != PunchItemStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    String.format("Невозможно отметить исправленным из статуса %s",
                            item.getStatus().getDisplayName()));
        }

        PunchItemStatus oldStatus = item.getStatus();
        item.setStatus(PunchItemStatus.FIXED);
        item.setFixedAt(Instant.now());

        item = punchItemRepository.save(item);
        auditService.logStatusChange("PunchItem", item.getId(),
                oldStatus.name(), PunchItemStatus.FIXED.name());
        recalculateCompletion(item.getPunchListId(), organizationId);

        log.info("Punch item fixed: #{} ({})", item.getNumber(), item.getId());
        return PunchItemResponse.fromEntity(item);
    }

    @Transactional
    public PunchItemResponse verifyItem(UUID itemId, UUID verifiedById) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        PunchItem item = getItemOrThrow(itemId, organizationId);

        if (item.getStatus() != PunchItemStatus.FIXED) {
            throw new IllegalStateException(
                    String.format("Проверить можно только исправленное замечание, текущий статус: %s",
                            item.getStatus().getDisplayName()));
        }

        PunchItemStatus oldStatus = item.getStatus();
        item.setStatus(PunchItemStatus.VERIFIED);
        item.setVerifiedById(currentUserId);
        item.setVerifiedAt(Instant.now());

        item = punchItemRepository.save(item);
        auditService.logStatusChange("PunchItem", item.getId(),
                oldStatus.name(), PunchItemStatus.VERIFIED.name());
        recalculateCompletion(item.getPunchListId(), organizationId);

        log.info("Punch item verified: #{} ({})", item.getNumber(), item.getId());
        return PunchItemResponse.fromEntity(item);
    }

    @Transactional
    public PunchItemResponse closeItem(UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchItem item = getItemOrThrow(itemId, organizationId);

        if (item.getStatus() != PunchItemStatus.VERIFIED) {
            throw new IllegalStateException(
                    String.format("Закрыть можно только проверенное замечание, текущий статус: %s",
                            item.getStatus().getDisplayName()));
        }

        PunchItemStatus oldStatus = item.getStatus();
        item.setStatus(PunchItemStatus.CLOSED);

        item = punchItemRepository.save(item);
        auditService.logStatusChange("PunchItem", item.getId(),
                oldStatus.name(), PunchItemStatus.CLOSED.name());
        recalculateCompletion(item.getPunchListId(), organizationId);

        log.info("Punch item closed: #{} ({})", item.getNumber(), item.getId());
        return PunchItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PunchItem item = getItemOrThrow(itemId, organizationId);
        item.softDelete();
        punchItemRepository.save(item);
        auditService.logDelete("PunchItem", itemId);
        recalculateCompletion(item.getPunchListId(), organizationId);
        log.info("Punch item deleted: #{} ({})", item.getNumber(), itemId);
    }

    // ---- Comments ----

    @Transactional(readOnly = true)
    public List<PunchItemCommentResponse> getItemComments(UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getItemOrThrow(itemId, organizationId);
        return commentRepository.findByPunchItemIdAndDeletedFalseOrderByCreatedAtDesc(itemId)
                .stream()
                .map(PunchItemCommentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PunchItemCommentResponse addComment(UUID itemId, CreatePunchItemCommentRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        getItemOrThrow(itemId, organizationId);

        PunchItemComment comment = PunchItemComment.builder()
                .punchItemId(itemId)
                .authorId(currentUserId)
                .content(request.content())
                .attachmentUrl(request.attachmentUrl())
                .build();

        comment = commentRepository.save(comment);
        auditService.logCreate("PunchItemComment", comment.getId());

        log.info("Comment added to punch item {}: ({})", itemId, comment.getId());
        return PunchItemCommentResponse.fromEntity(comment);
    }

    // ---- Helpers ----

    private void recalculateCompletion(UUID punchListId, UUID organizationId) {
        long total = punchItemRepository.countByPunchListId(punchListId);
        if (total == 0) return;

        long completed = punchItemRepository.countCompletedByPunchListId(punchListId);
        int percent = (int) ((completed * 100) / total);

        PunchList punchList = getPunchListOrThrow(punchListId, organizationId);
        punchList.setCompletionPercent(percent);
        punchListRepository.save(punchList);
    }

    private PunchList getPunchListOrThrow(UUID id, UUID organizationId) {
        PunchList punchList = punchListRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Список замечаний не найден: " + id));
        validateProjectTenant(punchList.getProjectId(), organizationId);
        return punchList;
    }

    private PunchItem getItemOrThrow(UUID id, UUID organizationId) {
        PunchItem item = punchItemRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Замечание не найдено: " + id));
        getPunchListOrThrow(item.getPunchListId(), organizationId);
        return item;
    }

    private List<UUID> getOrganizationProjectIds(UUID organizationId) {
        return projectRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            throw new EntityNotFoundException("Проект не найден: null");
        }
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        if (userId == null) {
            return;
        }
        User user = userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }
    }

    private String generatePunchListCode() {
        long seq = punchListRepository.getNextNumberSequence();
        return String.format("PL-%05d", seq);
    }
}
