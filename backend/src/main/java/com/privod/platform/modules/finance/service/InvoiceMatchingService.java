package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.web.dto.InvoiceLineResponse;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceMatchingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final ProjectRepository projectRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final BudgetRepository budgetRepository;
    private static final Set<InvoiceStatus> ALLOWED_INVOICE_STATUSES = Set.of(
            InvoiceStatus.ON_APPROVAL,
            InvoiceStatus.APPROVED,
            InvoiceStatus.PARTIALLY_PAID,
            InvoiceStatus.PAID,
            InvoiceStatus.OVERDUE,
            InvoiceStatus.CLOSED
    );

    /**
     * Find invoice lines from RECEIVED invoices for a given project that could match
     * a budget item. Returns lines ranked by relevance (exact link/name/unit), then by price.
     *
     * @param budgetItemId the budget item to find matching invoice lines for
     * @param projectId    optional project filter; if null, uses budget item project
     * @param cpItemId     optional CP item id to include already selected line for the same CP item
     * @return list of matching invoice lines ranked by relevance
     */
    @Transactional(readOnly = true)
    public List<InvoiceLineResponse> findMatchingInvoiceLines(UUID budgetItemId, UUID projectId, UUID cpItemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        BudgetItem budgetItem = budgetItemRepository.findById(budgetItemId)
                .filter(item -> !item.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + budgetItemId));

        UUID budgetProjectId = budgetRepository
                .findByIdAndOrganizationIdAndDeletedFalse(budgetItem.getBudgetId(), organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + budgetItemId))
                .getProjectId();

        if (projectId != null) {
            projectRepository.findById(projectId)
                    .filter(p -> !p.isDeleted())
                    .filter(p -> organizationId.equals(p.getOrganizationId()))
                    .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));

            if (budgetProjectId != null && !budgetProjectId.equals(projectId)) {
                throw new IllegalArgumentException("Позиция ФМ относится к другому проекту");
            }
        }

        UUID effectiveProjectId = projectId != null ? projectId : budgetProjectId;

        // Find all RECEIVED invoices for the project
        Specification<Invoice> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            predicates.add(cb.equal(root.get("invoiceType"), InvoiceType.RECEIVED));
            if (effectiveProjectId != null) {
                predicates.add(cb.equal(root.get("projectId"), effectiveProjectId));
            }
            predicates.add(root.get("status").in(ALLOWED_INVOICE_STATUSES));
            predicates.add(cb.equal(root.get("organizationId"), organizationId));
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        List<Invoice> receivedInvoices = invoiceRepository.findAll(spec);

        if (receivedInvoices.isEmpty()) {
            log.debug("No RECEIVED invoices found for project {} in organization {}", projectId, organizationId);
            return List.of();
        }

        // Collect all lines from those invoices
        List<InvoiceLine> allLines = new ArrayList<>();
        for (Invoice invoice : receivedInvoices) {
            List<InvoiceLine> lines = invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoice.getId());
            allLines.addAll(lines);
        }

        if (allLines.isEmpty()) {
            return List.of();
        }

        BigDecimal budgetQuantity = budgetItem.getQuantity() != null
                ? budgetItem.getQuantity()
                : java.math.BigDecimal.ZERO;

        // Score each line by relevance to budget position:
        // exact link > name token overlap > unit match. Then cheapest first.
        Set<String> budgetNameTokens = tokenize(budgetItem.getName());
        String budgetUnit = normalizeUnit(budgetItem.getUnit());

        List<InvoiceLine> selectableLines = allLines.stream()
                .filter(line -> isSelectableForCpItem(line, cpItemId))
                .toList();

        List<ScoredLine> scored = selectableLines.stream()
                .map(line -> new ScoredLine(line, scoreLine(
                        line,
                        budgetItemId,
                        cpItemId,
                        budgetNameTokens,
                        budgetUnit,
                        budgetQuantity)))
                .toList();

        List<ScoredLine> relevant = scored.stream()
                .filter(s -> s.score() > 0)
                .sorted(Comparator
                        .comparingInt(ScoredLine::score).reversed()
                        .thenComparing(s -> s.line().getUnitPrice() != null
                                ? s.line().getUnitPrice()
                                : java.math.BigDecimal.ZERO))
                .toList();

        List<ScoredLine> ordered = relevant.isEmpty()
                ? scored.stream()
                .sorted(Comparator.comparing(s -> s.line().getUnitPrice() != null
                        ? s.line().getUnitPrice()
                        : java.math.BigDecimal.ZERO))
                .toList()
                : relevant;

        log.debug("Found {} matching invoice lines for budgetItem {} in project {}",
                ordered.size(), budgetItemId, effectiveProjectId);

        return ordered.stream()
                .map(ScoredLine::line)
                .map(InvoiceLineResponse::fromEntity)
                .toList();
    }

    private int scoreLine(InvoiceLine line,
                          UUID budgetItemId,
                          UUID cpItemId,
                          Set<String> budgetNameTokens,
                          String budgetUnit,
                          java.math.BigDecimal budgetQuantity) {
        int score = 0;

        if (budgetItemId.equals(line.getBudgetItemId())) {
            score += 1000;
        }
        if (cpItemId != null && cpItemId.equals(line.getCpItemId())) {
            score += 900;
        }

        Set<String> lineTokens = tokenize(line.getName());
        if (!budgetNameTokens.isEmpty() && !lineTokens.isEmpty()) {
            int overlap = 0;
            for (String token : lineTokens) {
                if (budgetNameTokens.contains(token)) {
                    overlap++;
                }
            }
            score += overlap * 60;
        }

        String lineUnit = normalizeUnit(line.getUnitOfMeasure());
        if (!budgetUnit.isBlank() && !lineUnit.isBlank() && budgetUnit.equals(lineUnit)) {
            score += 40;
        }

        score += quantityClosenessBonus(budgetQuantity, line.getQuantity());
        score += availabilityBonus(budgetQuantity, line.getQuantity());

        return score;
    }

    private boolean isSelectableForCpItem(InvoiceLine line, UUID cpItemId) {
        if (!line.isSelectedForCp()) {
            return true;
        }
        if (cpItemId == null) {
            return false;
        }
        return cpItemId.equals(line.getCpItemId());
    }

    private int quantityClosenessBonus(java.math.BigDecimal budgetQty, java.math.BigDecimal lineQty) {
        if (budgetQty == null || lineQty == null || budgetQty.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return 0;
        }
        java.math.BigDecimal diff = budgetQty.subtract(lineQty).abs();
        java.math.BigDecimal ratio = diff.divide(budgetQty, 4, java.math.RoundingMode.HALF_UP);
        if (ratio.compareTo(new java.math.BigDecimal("0.05")) <= 0) {
            return 40;
        }
        if (ratio.compareTo(new java.math.BigDecimal("0.20")) <= 0) {
            return 25;
        }
        if (ratio.compareTo(new java.math.BigDecimal("0.50")) <= 0) {
            return 10;
        }
        return 0;
    }

    private int availabilityBonus(java.math.BigDecimal budgetQty, java.math.BigDecimal lineQty) {
        if (budgetQty == null || lineQty == null || budgetQty.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return 0;
        }
        if (lineQty.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return -100;
        }
        if (lineQty.compareTo(budgetQty) >= 0) {
            return 30;
        }
        java.math.BigDecimal coverage = lineQty
                .divide(budgetQty, 4, java.math.RoundingMode.HALF_UP);
        if (coverage.compareTo(new java.math.BigDecimal("0.75")) >= 0) {
            return 18;
        }
        if (coverage.compareTo(new java.math.BigDecimal("0.50")) >= 0) {
            return 8;
        }
        return 0;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        String normalized = text
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}]+", " ")
                .trim();
        if (normalized.isBlank()) {
            return Set.of();
        }
        Set<String> tokens = new HashSet<>();
        for (String token : normalized.split("\\s+")) {
            if (token.length() >= 2) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String normalizeUnit(String unit) {
        if (unit == null) {
            return "";
        }
        return unit.toLowerCase(Locale.ROOT).trim();
    }

    private record ScoredLine(InvoiceLine line, int score) {
    }
}
