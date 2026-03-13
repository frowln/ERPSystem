package com.privod.platform.modules.finance.service;

import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.repository.ContractBudgetItemRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItemDocStatus;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetItemSyncService {

    private static final List<ContractStatus> FINALIZED_CONTRACT_STATUSES = List.of(
            ContractStatus.SIGNED,
            ContractStatus.ACTIVE,
            ContractStatus.CLOSED
    );
    private static final List<InvoiceStatus> FINANCIAL_INVOICE_STATUSES = List.of(
            InvoiceStatus.APPROVED,
            InvoiceStatus.PARTIALLY_PAID,
            InvoiceStatus.PAID,
            InvoiceStatus.OVERDUE,
            InvoiceStatus.CLOSED
    );
    private static final List<InvoiceStatus> NON_FINANCIAL_INVOICE_STATUSES = List.of(
            InvoiceStatus.CANCELLED,
            InvoiceStatus.REJECTED
    );

    private final BudgetItemRepository budgetItemRepository;
    private final BudgetRepository budgetRepository; // P1-FIN-4: авто-пересчёт Budget.actualCost
    private final ContractRepository contractRepository;
    private final ContractBudgetItemRepository contractBudgetItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Called when a contract status changes.
     * Recalculates contractedAmount for all FM items linked to this contract.
     */
    @Transactional
    public void onContractStatusChanged(UUID contractId) {
        if (contractId == null) {
            return;
        }
        for (UUID budgetItemId : resolveLinkedBudgetItemIds(contractId)) {
            syncContractedAmount(budgetItemId);
        }
    }

    /**
     * Called when a КС-2 document is signed.
     * Recalculates actSignedAmount for all FM items linked to the contract.
     *
     * @param contractId the contractId stored on the KS-2 document
     */
    @Transactional
    public void onKs2Signed(UUID contractId) {
        if (contractId == null) {
            return;
        }
        for (UUID budgetItemId : resolveLinkedBudgetItemIds(contractId)) {
            syncActSigned(budgetItemId);
        }
    }

    /**
     * Called when an invoice is created/approved against a contract.
     * Distributes invoice amount across all linked FM items.
     *
     * @param contractId the contract the invoice belongs to
     * @param amount     invoice amount to allocate
     */
    @Transactional
    public void onInvoiceCreated(UUID contractId, BigDecimal amount) {
        onInvoiceFinancialStateChanged(contractId);
    }

    /**
     * Called when a payment is registered against a contract.
     * Distributes paid amount across all linked FM items.
     *
     * @param contractId the contract the payment belongs to
     * @param amount     payment amount to allocate
     */
    @Transactional
    public void onPaymentRegistered(UUID contractId, BigDecimal amount) {
        onPaymentFinancialStateChanged(contractId);
    }

    /**
     * Called when invoice status/amount changes in a way that affects FM accounting.
     */
    @Transactional
    public void onInvoiceFinancialStateChanged(UUID contractId) {
        syncFinancialAmountsForContract(contractId);
    }

    /**
     * Called when payment status/amount changes in a way that affects FM accounting.
     */
    @Transactional
    public void onPaymentFinancialStateChanged(UUID contractId) {
        syncFinancialAmountsForContract(contractId);
    }

    /**
     * Called when invoice contract relation changes.
     */
    @Transactional
    public void onInvoiceContractChanged(UUID oldContractId, UUID newContractId) {
        syncFinancialAmountsForContract(oldContractId);
        syncFinancialAmountsForContract(newContractId);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void syncFinancialAmountsForContract(UUID contractId) {
        if (contractId == null) {
            return;
        }
        for (UUID budgetItemId : resolveLinkedBudgetItemIds(contractId)) {
            syncFinancialAmountsForBudgetItem(budgetItemId);
        }
    }

    private void syncFinancialAmountsForBudgetItem(UUID budgetItemId) {
        if (budgetItemId == null) {
            return;
        }
        budgetItemRepository.findById(budgetItemId).ifPresent(item -> {
            if (item.isDeleted()) {
                return;
            }

            List<ContractBudgetItem> allLinks = contractBudgetItemRepository.findByBudgetItemId(budgetItemId);
            HashSet<UUID> contractIds = new HashSet<>();
            for (ContractBudgetItem link : allLinks) {
                contractIds.add(link.getContractId());
            }
            contractRepository.findByBudgetItemIdAndDeletedFalse(budgetItemId)
                    .forEach(contract -> contractIds.add(contract.getId()));

            BigDecimal totalInvoiced = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;

            for (UUID contractId : contractIds) {
                BigDecimal contractInvoiced = nonNull(
                        invoiceRepository.sumTotalByContractIdAndStatusIn(contractId, FINANCIAL_INVOICE_STATUSES)
                );
                BigDecimal contractPaidByInvoices = nonNull(
                        invoiceRepository.sumPaidAmountByContractIdAndStatusNotIn(contractId, NON_FINANCIAL_INVOICE_STATUSES)
                );
                BigDecimal contractPaidByPayments = nonNull(
                        paymentRepository.sumPaidByContractId(contractId)
                );
                // Keep paid source resilient to alternative flows:
                // - invoice registerPayment path
                // - dedicated payments path
                BigDecimal contractPaid = contractPaidByPayments.max(contractPaidByInvoices);

                List<ContractBudgetItem> contractLinks = contractBudgetItemRepository.findByContractId(contractId);
                if (contractLinks.isEmpty()) {
                    if (contractRepository.findByIdAndDeletedFalse(contractId)
                            .map(contract -> budgetItemId.equals(contract.getBudgetItemId()))
                            .orElse(false)) {
                        totalInvoiced = totalInvoiced.add(contractInvoiced);
                        totalPaid = totalPaid.add(contractPaid);
                    }
                    continue;
                }

                Map<UUID, BigDecimal> invoicedAllocation = splitAmountByLinks(contractLinks, contractInvoiced);
                Map<UUID, BigDecimal> paidAllocation = splitAmountByLinks(contractLinks, contractPaid);
                totalInvoiced = totalInvoiced.add(nonNull(invoicedAllocation.get(budgetItemId)));
                totalPaid = totalPaid.add(nonNull(paidAllocation.get(budgetItemId)));
            }

            item.setInvoicedAmount(nonNegative(totalInvoiced).setScale(2, RoundingMode.HALF_UP));
            item.setPaidAmount(nonNegative(totalPaid).setScale(2, RoundingMode.HALF_UP));
            updateFinancialDocStatus(item);
            budgetItemRepository.save(item);

            // P1-FIN-4: После обновления статьи бюджета — пересчитываем фактические затраты бюджета
            recalculateBudgetActuals(item.getBudgetId());
        });
    }

    /**
     * P1-FIN-4: Авто-пересчёт Budget.actualCost как суммы paidAmount по всем статьям.
     * Вызывается автоматически при каждом изменении финансового состояния статьи бюджета.
     */
    private void recalculateBudgetActuals(UUID budgetId) {
        if (budgetId == null) return;
        budgetRepository.findByIdAndDeletedFalse(budgetId).ifPresent(budget -> {
            List<BudgetItem> allItems = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);
            BigDecimal totalActualCost = allItems.stream()
                    .map(bi -> bi.getPaidAmount() != null ? bi.getPaidAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            budget.setActualCost(totalActualCost.setScale(2, RoundingMode.HALF_UP));
            budgetRepository.save(budget);
            log.debug("Budget.actualCost пересчитан: budgetId={}, actualCost={}", budgetId, totalActualCost);
        });
    }

    private void updateFinancialDocStatus(BudgetItem item) {
        BigDecimal invoiced = nonNull(item.getInvoicedAmount());
        BigDecimal paid = nonNull(item.getPaidAmount());
        if (paid.compareTo(BigDecimal.ZERO) > 0) {
            item.setDocStatus(BudgetItemDocStatus.PAID);
            return;
        }
        if (invoiced.compareTo(BigDecimal.ZERO) > 0) {
            if (item.getDocStatus() == BudgetItemDocStatus.CONTRACTED
                    || item.getDocStatus() == BudgetItemDocStatus.ACT_SIGNED
                    || item.getDocStatus() == BudgetItemDocStatus.INVOICED
                    || item.getDocStatus() == BudgetItemDocStatus.PAID) {
                item.setDocStatus(BudgetItemDocStatus.INVOICED);
            }
            return;
        }
        if (item.getDocStatus() == BudgetItemDocStatus.INVOICED || item.getDocStatus() == BudgetItemDocStatus.PAID) {
            if (nonNull(item.getActSignedAmount()).compareTo(BigDecimal.ZERO) > 0) {
                item.setDocStatus(BudgetItemDocStatus.ACT_SIGNED);
            } else if (nonNull(item.getContractedAmount()).compareTo(BigDecimal.ZERO) > 0) {
                item.setDocStatus(BudgetItemDocStatus.CONTRACTED);
            } else {
                item.setDocStatus(BudgetItemDocStatus.PLANNED);
            }
        }
    }

    private Map<UUID, BigDecimal> splitAmountByLinks(List<ContractBudgetItem> links, BigDecimal totalAmount) {
        Map<UUID, BigDecimal> result = new LinkedHashMap<>();
        if (links.isEmpty()) {
            return result;
        }

        BigDecimal totalAllocatedAmount = links.stream()
                .map(ContractBudgetItem::getAllocatedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean useAllocatedAmount = totalAllocatedAmount.compareTo(BigDecimal.ZERO) > 0;
        BigDecimal totalWeight = useAllocatedAmount
                ? totalAllocatedAmount
                : links.stream()
                .map(ContractBudgetItem::getAllocatedQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean useEqualSplit = totalWeight.compareTo(BigDecimal.ZERO) <= 0;
        if (useEqualSplit) {
            // Safe fallback for degenerate data: equal split.
            totalWeight = BigDecimal.valueOf(links.size());
        }

        BigDecimal allocatedSoFar = BigDecimal.ZERO;
        for (int i = 0; i < links.size(); i++) {
            ContractBudgetItem link = links.get(i);
            BigDecimal share;
            if (i == links.size() - 1) {
                share = totalAmount.subtract(allocatedSoFar);
            } else {
                BigDecimal weight;
                if (useEqualSplit) {
                    weight = BigDecimal.ONE;
                } else {
                    weight = useAllocatedAmount
                            ? nonNull(link.getAllocatedAmount())
                            : nonNull(link.getAllocatedQuantity());
                }
                share = totalAmount.multiply(weight)
                        .divide(totalWeight, 2, RoundingMode.HALF_UP);
                allocatedSoFar = allocatedSoFar.add(share);
            }

            if (share.compareTo(BigDecimal.ZERO) > 0) {
                result.merge(link.getBudgetItemId(), share, BigDecimal::add);
            }
        }

        return result;
    }

    private List<UUID> resolveLinkedBudgetItemIds(UUID contractId) {
        List<UUID> ids = contractBudgetItemRepository.findDistinctBudgetItemIdsByContractId(contractId);
        if (!ids.isEmpty()) {
            return ids;
        }
        return contractRepository.findByIdAndDeletedFalse(contractId)
                .map(contract -> contract.getBudgetItemId() != null ? List.of(contract.getBudgetItemId()) : List.<UUID>of())
                .orElse(List.of());
    }

    private void syncContractedAmount(UUID budgetItemId) {
        if (budgetItemId == null) {
            return;
        }
        budgetItemRepository.findById(budgetItemId).ifPresent(item -> {
            if (item.isDeleted()) {
                return;
            }

            BigDecimal contracted = contractBudgetItemRepository
                    .sumAllocatedAmountByBudgetItemIdAndContractStatusIn(budgetItemId, FINALIZED_CONTRACT_STATUSES);
            contracted = nonNull(contracted);

            item.setContractedAmount(contracted);

            if (contracted.compareTo(BigDecimal.ZERO) > 0
                    && item.getDocStatus() == BudgetItemDocStatus.PLANNED) {
                item.setDocStatus(BudgetItemDocStatus.CONTRACTED);
            }

            budgetItemRepository.save(item);
            log.info("Synced contractedAmount={} for budgetItem={}", contracted, budgetItemId);
        });
    }

    private void syncActSigned(UUID budgetItemId) {
        if (budgetItemId == null) {
            return;
        }
        budgetItemRepository.findById(budgetItemId).ifPresent(item -> {
            if (item.isDeleted()) {
                return;
            }

            BigDecimal actSigned = nonNull(
                    contractBudgetItemRepository.sumSignedKs2TotalWithVatByBudgetItemId(budgetItemId)
            );

            item.setActSignedAmount(actSigned);

            // Advance docStatus: CONTRACTED → ACT_SIGNED
            if (actSigned.compareTo(BigDecimal.ZERO) > 0
                    && item.getDocStatus() == BudgetItemDocStatus.CONTRACTED) {
                item.setDocStatus(BudgetItemDocStatus.ACT_SIGNED);
            }

            budgetItemRepository.save(item);
            log.info("Synced actSignedAmount={} for budgetItem={}", actSigned, budgetItemId);
        });
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal nonNegative(BigDecimal value) {
        return nonNull(value).max(BigDecimal.ZERO);
    }
}
