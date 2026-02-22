package com.privod.platform.modules.finance.service;

import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.web.dto.InvoiceMatchCandidate;
import com.privod.platform.modules.finance.web.dto.ThreeWayMatchResult;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceMatchingEngine {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final BudgetItemRepository budgetItemRepository;

    /**
     * For each InvoiceLine, find matching BudgetItems by:
     * - exact name match (100%), fuzzy match (70-90%),
     * - unit match (+10%), amount range (+10%)
     */
    @Transactional(readOnly = true)
    public List<InvoiceMatchCandidate> matchInvoiceToPositions(UUID invoiceId, UUID budgetId) {
        invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден: " + invoiceId));

        List<InvoiceLine> lines = invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId);
        List<BudgetItem> budgetItems = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);
        List<BudgetItem> nonSections = budgetItems.stream().filter(i -> !i.isSection()).toList();

        List<InvoiceMatchCandidate> candidates = new ArrayList<>();

        for (InvoiceLine line : lines) {
            for (BudgetItem item : nonSections) {
                int confidence = calculateConfidence(line, item);
                if (confidence >= 30) {
                    candidates.add(new InvoiceMatchCandidate(
                            line.getId(),
                            line.getName(),
                            item.getId(),
                            item.getName(),
                            confidence,
                            describeMatch(line, item, confidence)
                    ));
                }
            }
        }

        candidates.sort(Comparator.comparingInt(InvoiceMatchCandidate::confidence).reversed());
        return candidates;
    }

    /**
     * 3-way match: Contract/PO vs receipt vs invoice.
     */
    @Transactional(readOnly = true)
    public ThreeWayMatchResult validateThreeWayMatch(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден: " + invoiceId));

        List<InvoiceLine> lines = invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId);

        BigDecimal invoiceTotal = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal lineSum = lines.stream()
                .map(l -> l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean linesMatchTotal = invoiceTotal.compareTo(BigDecimal.ZERO) == 0
                || lineSum.subtract(invoiceTotal).abs().compareTo(new BigDecimal("0.01")) <= 0;

        boolean hasPo = invoice.getMatchedPoId() != null || invoice.getContractId() != null;
        boolean hasReceipt = invoice.getMatchedReceiptId() != null
                || invoice.getKs2Id() != null
                || invoice.getKs3Id() != null;

        BigDecimal overallConfidence;
        if (hasPo && hasReceipt && linesMatchTotal) {
            overallConfidence = new BigDecimal("100.00");
        } else if (hasPo && linesMatchTotal) {
            overallConfidence = new BigDecimal("80.00");
        } else if (linesMatchTotal) {
            overallConfidence = new BigDecimal("60.00");
        } else {
            overallConfidence = new BigDecimal("30.00");
        }

        List<ThreeWayMatchResult.Discrepancy> discrepancies = new ArrayList<>();
        if (!linesMatchTotal) {
            discrepancies.add(new ThreeWayMatchResult.Discrepancy(
                    "AMOUNT_MISMATCH",
                    "Сумма строк не совпадает с итогом счёта",
                    lineSum, invoiceTotal,
                    lineSum.subtract(invoiceTotal)
            ));
        }
        if (!hasPo) {
            discrepancies.add(new ThreeWayMatchResult.Discrepancy(
                    "NO_PO", "Не привязан заказ/договор", null, null, null));
        }
        if (!hasReceipt) {
            discrepancies.add(new ThreeWayMatchResult.Discrepancy(
                    "NO_RECEIPT", "Не привязан акт приёмки", null, null, null));
        }

        return new ThreeWayMatchResult(
                invoiceId,
                overallConfidence,
                hasPo,
                hasReceipt,
                linesMatchTotal,
                discrepancies
        );
    }

    private int calculateConfidence(InvoiceLine line, BudgetItem item) {
        int score = 0;
        String lineName = normalize(line.getName());
        String itemName = normalize(item.getName());

        if (lineName.equals(itemName)) {
            score += 70;
        } else if (lineName.contains(itemName) || itemName.contains(lineName)) {
            score += 50;
        } else {
            int distance = levenshteinDistance(lineName, itemName);
            int maxLen = Math.max(lineName.length(), itemName.length());
            if (maxLen > 0) {
                double similarity = 1.0 - (double) distance / maxLen;
                if (similarity >= 0.6) {
                    score += (int) (similarity * 60);
                }
            }
        }

        // Unit match
        if (line.getUnitOfMeasure() != null && item.getUnit() != null
                && normalize(line.getUnitOfMeasure()).equals(normalize(item.getUnit()))) {
            score += 10;
        }

        // Amount range match
        if (line.getAmount() != null && item.getPlannedAmount() != null
                && item.getPlannedAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = line.getAmount().divide(item.getPlannedAmount(), 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("0.5")) >= 0 && ratio.compareTo(new BigDecimal("2.0")) <= 0) {
                score += 10;
            }
        }

        return Math.min(score, 100);
    }

    private String describeMatch(InvoiceLine line, BudgetItem item, int confidence) {
        if (confidence >= 80) return "Высокая точность";
        if (confidence >= 50) return "Средняя точность";
        return "Низкая точность";
    }

    private String normalize(String s) {
        return s == null ? "" : s.toLowerCase().trim().replaceAll("\\s+", " ");
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }
}
