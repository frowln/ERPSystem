package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.PpeIssue;
import com.privod.platform.modules.safety.domain.PpeItem;
import com.privod.platform.modules.safety.domain.PpeNorm;
import com.privod.platform.modules.safety.repository.PpeIssueRepository;
import com.privod.platform.modules.safety.repository.PpeItemRepository;
import com.privod.platform.modules.safety.repository.PpeNormRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyPpeService {

    private final PpeItemRepository ppeItemRepository;
    private final PpeIssueRepository ppeIssueRepository;
    private final PpeNormRepository ppeNormRepository;
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

        // P1-SAF-2: Check PpeNorm compliance if jobTitle provided
        String normWarning = null;
        if (request.jobTitle() != null && !request.jobTitle().isBlank()) {
            List<PpeNorm> norms = ppeNormRepository.findByOrganizationIdAndJobTitleIgnoreCaseAndDeletedFalse(
                    organizationId, request.jobTitle());
            String itemNameLower = item.getName().toLowerCase();
            for (PpeNorm norm : norms) {
                if (norm.getPpeName() != null && itemNameLower.contains(norm.getPpeName().toLowerCase())) {
                    if (norm.getAnnualQty() != null && norm.getAnnualQty() > 0) {
                        LocalDate yearStart = LocalDate.of(request.issuedDate().getYear(), 1, 1);
                        LocalDate yearEnd = LocalDate.of(request.issuedDate().getYear(), 12, 31);
                        Integer alreadyIssued = ppeIssueRepository.sumQuantityByEmployeeAndItemInPeriod(
                                organizationId, request.employeeId(), request.itemId(), yearStart, yearEnd);
                        int total = (alreadyIssued != null ? alreadyIssued : 0) + request.quantity();
                        if (total > norm.getAnnualQty()) {
                            normWarning = String.format(
                                    "Превышение нормы выдачи: %s для должности '%s' — норма %d шт./год, уже выдано %d, запрошено %d",
                                    item.getName(), request.jobTitle(), norm.getAnnualQty(),
                                    (alreadyIssued != null ? alreadyIssued : 0), request.quantity());
                            log.warn("PPE norm exceeded: {}", normWarning);
                        }
                    }
                    break;
                }
            }
        }

        String issueNotes = request.notes();
        if (normWarning != null) {
            issueNotes = (issueNotes != null ? issueNotes + " | " : "") + "[НОРМА ПРЕВЫШЕНА] " + normWarning;
        }

        PpeIssue issue = PpeIssue.builder()
                .organizationId(organizationId)
                .itemId(request.itemId())
                .itemName(item.getName())
                .employeeId(request.employeeId())
                .employeeName(request.employeeName())
                .quantity(request.quantity())
                .issuedDate(request.issuedDate())
                .notes(issueNotes)
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
