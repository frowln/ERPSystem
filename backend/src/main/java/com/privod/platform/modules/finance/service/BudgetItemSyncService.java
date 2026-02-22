package com.privod.platform.modules.finance.service;

import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.repository.ContractBudgetItemRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItemDocStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.BiConsumer;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetItemSyncService {

    private static final List<ContractStatus> FINALIZED_CONTRACT_STATUSES = List.of(
            ContractStatus.SIGNED,
            ContractStatus.ACTIVE,
            ContractStatus.CLOSED
    );

    private final BudgetItemRepository budgetItemRepository;
    private final ContractRepository contractRepository;
    private final ContractBudgetItemRepository contractBudgetItemRepository;

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
        distributeAmountToLinkedItems(contractId, amount, this::incrementInvoicedAmount);
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
        distributeAmountToLinkedItems(contractId, amount, this::incrementPaidAmount);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void distributeAmountToLinkedItems(UUID contractId,
                                               BigDecimal amount,
                                               BiConsumer<BudgetItem, BigDecimal> incrementFn) {
        if (contractId == null || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        List<ContractBudgetItem> links = contractBudgetItemRepository.findByContractId(contractId);
        if (links.isEmpty()) {
            // Backward compatibility for legacy contracts with only contracts.budget_item_id
            contractRepository.findByIdAndDeletedFalse(contractId).ifPresent(contract -> {
                UUID legacyBudgetItemId = contract.getBudgetItemId();
                if (legacyBudgetItemId == null) {
                    return;
                }
                budgetItemRepository.findById(legacyBudgetItemId).ifPresent(item -> {
                    if (item.isDeleted()) {
                        return;
                    }
                    incrementFn.accept(item, amount);
                    budgetItemRepository.save(item);
                });
            });
            return;
        }

        Map<UUID, BigDecimal> allocations = splitAmountByLinks(links, amount);
        for (Map.Entry<UUID, BigDecimal> allocation : allocations.entrySet()) {
            UUID budgetItemId = allocation.getKey();
            BigDecimal allocated = allocation.getValue();
            if (allocated.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            budgetItemRepository.findById(budgetItemId).ifPresent(item -> {
                if (item.isDeleted()) {
                    return;
                }
                incrementFn.accept(item, allocated);
                budgetItemRepository.save(item);
            });
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

    private void incrementInvoicedAmount(BudgetItem item, BigDecimal amount) {
        BigDecimal current = nonNull(item.getInvoicedAmount());
        item.setInvoicedAmount(current.add(nonNull(amount)));

        if (item.getDocStatus() == BudgetItemDocStatus.CONTRACTED
                || item.getDocStatus() == BudgetItemDocStatus.ACT_SIGNED) {
            item.setDocStatus(BudgetItemDocStatus.INVOICED);
        }

        log.info("Incremented invoicedAmount by {} for budgetItem={}", amount, item.getId());
    }

    private void incrementPaidAmount(BudgetItem item, BigDecimal amount) {
        BigDecimal current = nonNull(item.getPaidAmount());
        item.setPaidAmount(current.add(nonNull(amount)));

        if (item.getDocStatus() == BudgetItemDocStatus.INVOICED) {
            item.setDocStatus(BudgetItemDocStatus.PAID);
        }

        log.info("Incremented paidAmount by {} for budgetItem={}", amount, item.getId());
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
