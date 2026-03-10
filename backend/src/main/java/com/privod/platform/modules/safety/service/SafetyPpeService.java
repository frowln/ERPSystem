package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.PpeIssue;
import com.privod.platform.modules.safety.domain.PpeItem;
import com.privod.platform.modules.safety.repository.PpeIssueRepository;
import com.privod.platform.modules.safety.repository.PpeItemRepository;
import com.privod.platform.modules.safety.web.dto.CreatePpeIssueRequest;
import com.privod.platform.modules.safety.web.dto.PpeIssueResponse;
import com.privod.platform.modules.safety.web.dto.PpeItemResponse;
import com.privod.platform.modules.safety.web.dto.ReturnPpeRequest;
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
public class SafetyPpeService {

    private final PpeItemRepository ppeItemRepository;
    private final PpeIssueRepository ppeIssueRepository;
    private final AuditService auditService;

    // ---- Inventory ----

    @Transactional(readOnly = true)
    public Page<PpeItemResponse> listInventory(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return ppeItemRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(PpeItemResponse::fromEntity);
    }

    // ---- Issues ----

    @Transactional(readOnly = true)
    public Page<PpeIssueResponse> listIssues(UUID employeeId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (employeeId != null) {
            return ppeIssueRepository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(
                    organizationId, employeeId, pageable)
                    .map(PpeIssueResponse::fromEntity);
        }
        return ppeIssueRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(PpeIssueResponse::fromEntity);
    }

    @Transactional
    public PpeIssueResponse issuePpe(CreatePpeIssueRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        PpeItem item = ppeItemRepository.findByIdAndOrganizationIdAndDeletedFalse(
                request.itemId(), organizationId)
                .orElseThrow(() -> new EntityNotFoundException("СИЗ не найден: " + request.itemId()));

        if (item.getAvailableQuantity() < request.quantity()) {
            throw new IllegalStateException(
                    String.format("Недостаточно СИЗ на складе. Доступно: %d, запрошено: %d",
                            item.getAvailableQuantity(), request.quantity()));
        }

        // Decrease available quantity
        item.setAvailableQuantity(item.getAvailableQuantity() - request.quantity());
        ppeItemRepository.save(item);

        PpeIssue issue = PpeIssue.builder()
                .organizationId(organizationId)
                .itemId(request.itemId())
                .itemName(item.getName())
                .employeeId(request.employeeId())
                .employeeName(request.employeeName())
                .quantity(request.quantity())
                .issuedDate(request.issuedDate())
                .notes(request.notes())
                .build();

        issue = ppeIssueRepository.save(issue);
        auditService.logCreate("PpeIssue", issue.getId());

        log.info("PPE issued: {} x{} to employee {} ({})",
                item.getName(), request.quantity(), request.employeeId(), issue.getId());
        return PpeIssueResponse.fromEntity(issue);
    }

    @Transactional
    public PpeIssueResponse returnPpe(UUID issueId, ReturnPpeRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        PpeIssue issue = ppeIssueRepository.findByIdAndOrganizationIdAndDeletedFalse(issueId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Запись о выдаче СИЗ не найдена: " + issueId));

        if (issue.isReturned()) {
            throw new IllegalStateException("СИЗ уже возвращены");
        }

        issue.setReturned(true);
        issue.setReturnDate(request.returnDate());
        issue.setReturnCondition(request.condition());

        UUID itemId = issue.getItemId();
        Integer returnedQuantity = issue.getQuantity();
        issue = ppeIssueRepository.save(issue);

        // Increase available quantity back on the item
        ppeItemRepository.findByIdAndOrganizationIdAndDeletedFalse(itemId, organizationId)
                .ifPresent(item -> {
                    item.setAvailableQuantity(item.getAvailableQuantity() + returnedQuantity);
                    ppeItemRepository.save(item);
                });

        auditService.logUpdate("PpeIssue", issue.getId(), "returned", "false", "true");

        log.info("PPE returned: {} by employee {} condition={} ({})",
                issue.getItemName(), issue.getEmployeeId(), request.condition(), issueId);
        return PpeIssueResponse.fromEntity(issue);
    }
}
