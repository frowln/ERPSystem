package com.privod.platform.modules.contract.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.repository.ContractBudgetItemRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contract.web.dto.BudgetItemCoverageResponse;
import com.privod.platform.modules.contract.web.dto.ContractBudgetItemResponse;
import com.privod.platform.modules.contract.web.dto.LinkBudgetItemsRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractBudgetItemRequest;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractBudgetItemService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final List<ContractStatus> CONTRACTED_STATUSES = List.of(
            ContractStatus.SIGNED,
            ContractStatus.ACTIVE,
            ContractStatus.CLOSED
    );

    private final ContractBudgetItemRepository cbiRepository;
    private final ContractRepository contractRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final BudgetRepository budgetRepository;

    @Transactional
    public List<ContractBudgetItemResponse> linkBudgetItems(UUID contractId, LinkBudgetItemsRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = loadContract(contractId, orgId);

        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Список позиций для привязки пуст");
        }

        Set<UUID> requestBudgetItemIds = new HashSet<>();

        for (LinkBudgetItemsRequest.BudgetItemLink link : request.items()) {
            if (link == null || link.budgetItemId() == null) {
                throw new IllegalArgumentException("В запросе обнаружена некорректная позиция для привязки");
            }
            if (!requestBudgetItemIds.add(link.budgetItemId())) {
                throw new IllegalArgumentException("Позиция ФМ дублируется в запросе: " + link.budgetItemId());
            }

            validateLinkValues(link);

            BudgetItemContext budgetItemContext = loadBudgetItemContext(link.budgetItemId(), orgId);
            BudgetItem bi = budgetItemContext.item();
            validateBudgetItemLinkable(bi);
            validateProjectMatch(contract, budgetItemContext.budget(), bi.getId());

            if (cbiRepository.existsByContractIdAndBudgetItemId(contractId, link.budgetItemId())) {
                throw new IllegalArgumentException("Позиция ФМ уже привязана к данному договору: " + link.budgetItemId());
            }

            BigDecimal qty = nonNull(link.allocatedQuantity());
            BigDecimal amount = nonNull(link.allocatedAmount());
            BigDecimal currentAllocated = cbiRepository.sumAllocatedQuantityByBudgetItemId(bi.getId());
            BigDecimal totalAllocated = currentAllocated.add(qty);
            BigDecimal totalQty = nonNull(bi.getQuantity());
            if (totalQty.compareTo(BigDecimal.ZERO) > 0 && totalAllocated.compareTo(totalQty) > 0) {
                throw new IllegalArgumentException("Превышено доступное количество по позиции ФМ: " + bi.getId());
            }

            BigDecimal coverageBaseAmount = resolveCoverageBaseAmount(bi);
            BigDecimal currentAllocatedAmount = cbiRepository.sumAllocatedAmountByBudgetItemId(bi.getId());
            if (coverageBaseAmount.compareTo(BigDecimal.ZERO) == 0 && amount.compareTo(BigDecimal.ZERO) > 0) {
                throw new IllegalArgumentException("Нельзя распределить сумму по позиции ФМ с нулевой базовой суммой");
            }
            if (coverageBaseAmount.compareTo(BigDecimal.ZERO) > 0
                    && currentAllocatedAmount.add(amount).compareTo(coverageBaseAmount) > 0) {
                throw new IllegalArgumentException("Превышена доступная сумма по позиции ФМ: " + bi.getId());
            }

            BigDecimal covPct = totalQty.compareTo(BigDecimal.ZERO) > 0
                    ? qty.multiply(HUNDRED).divide(totalQty, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            ContractBudgetItem cbi = ContractBudgetItem.builder()
                    .contractId(contractId)
                    .budgetItemId(link.budgetItemId())
                    .allocatedQuantity(qty)
                    .allocatedAmount(amount)
                    .notes(link.notes())
                    .budgetItemName(bi.getName())
                    .totalQuantity(totalQty)
                    .coveragePercent(covPct)
                    .build();
            cbiRepository.save(cbi);

            // Update contracted amount on budget item
            recalculateContractedAmount(bi.getId());
        }

        log.info("Привязаны позиции ФМ к договору {}: {} шт", contractId, request.items().size());
        return getLinkedItems(contractId);
    }

    @Transactional(readOnly = true)
    public List<ContractBudgetItemResponse> getLinkedItems(UUID contractId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        loadContract(contractId, orgId);
        return toResponses(cbiRepository.findByContractId(contractId));
    }

    @Transactional
    public ContractBudgetItemResponse updateLinkedItem(UUID contractId,
                                                       UUID linkId,
                                                       UpdateContractBudgetItemRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = loadContract(contractId, orgId);

        ContractBudgetItem link = cbiRepository.findById(linkId)
                .orElseThrow(() -> new EntityNotFoundException("Привязка не найдена: " + linkId));
        if (!link.getContractId().equals(contractId)) {
            throw new IllegalArgumentException("Привязка не принадлежит указанному договору");
        }

        BudgetItemContext budgetItemContext = loadBudgetItemContext(link.getBudgetItemId(), orgId);
        BudgetItem budgetItem = budgetItemContext.item();
        validateBudgetItemLinkable(budgetItem);
        validateProjectMatch(contract, budgetItemContext.budget(), budgetItem.getId());

        BigDecimal nextQty = request.allocatedQuantity() != null
                ? request.allocatedQuantity()
                : nonNull(link.getAllocatedQuantity());
        BigDecimal nextAmount = request.allocatedAmount() != null
                ? request.allocatedAmount()
                : nonNull(link.getAllocatedAmount());
        validateLinkValues(nextQty, nextAmount);

        BigDecimal allocatedWithoutCurrent = cbiRepository
                .sumAllocatedQuantityByBudgetItemIdExcludingLinkId(link.getBudgetItemId(), linkId);
        BigDecimal totalQty = nonNull(budgetItem.getQuantity());
        if (totalQty.compareTo(BigDecimal.ZERO) > 0 && allocatedWithoutCurrent.add(nextQty).compareTo(totalQty) > 0) {
            throw new IllegalArgumentException("Превышено доступное количество по позиции ФМ: " + budgetItem.getId());
        }

        BigDecimal coverageBaseAmount = resolveCoverageBaseAmount(budgetItem);
        BigDecimal allocatedAmountWithoutCurrent = cbiRepository
                .sumAllocatedAmountByBudgetItemIdExcludingLinkId(link.getBudgetItemId(), linkId);
        if (coverageBaseAmount.compareTo(BigDecimal.ZERO) == 0 && nextAmount.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("Нельзя распределить сумму по позиции ФМ с нулевой базовой суммой");
        }
        if (coverageBaseAmount.compareTo(BigDecimal.ZERO) > 0
                && allocatedAmountWithoutCurrent.add(nextAmount).compareTo(coverageBaseAmount) > 0) {
            throw new IllegalArgumentException("Превышена доступная сумма по позиции ФМ: " + budgetItem.getId());
        }

        link.setAllocatedQuantity(nextQty);
        link.setAllocatedAmount(nextAmount);
        link.setNotes(request.notes());
        link.setBudgetItemName(budgetItem.getName());
        link.setTotalQuantity(totalQty);
        BigDecimal covPct = totalQty.compareTo(BigDecimal.ZERO) > 0
                ? nextQty.multiply(HUNDRED).divide(totalQty, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        link.setCoveragePercent(covPct);
        ContractBudgetItem saved = cbiRepository.save(link);

        recalculateContractedAmount(link.getBudgetItemId());
        return ContractBudgetItemResponse.fromEntity(saved, budgetItem);
    }

    @Transactional
    public void unlinkBudgetItem(UUID contractId, UUID linkId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        loadContract(contractId, orgId);

        ContractBudgetItem cbi = cbiRepository.findById(linkId)
                .orElseThrow(() -> new EntityNotFoundException("Привязка не найдена: " + linkId));
        if (!cbi.getContractId().equals(contractId)) {
            throw new IllegalArgumentException("Привязка не принадлежит указанному договору");
        }
        UUID budgetItemId = cbi.getBudgetItemId();
        cbiRepository.delete(cbi);
        recalculateContractedAmount(budgetItemId);
        log.info("Привязка удалена: {} из договора {}", linkId, contractId);
    }

    @Transactional(readOnly = true)
    public List<ContractBudgetItemResponse> getContractsForBudgetItem(UUID budgetItemId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        loadBudgetItemContext(budgetItemId, orgId);
        return toResponses(cbiRepository.findByBudgetItemId(budgetItemId));
    }

    @Transactional(readOnly = true)
    public BudgetItemCoverageResponse getCoverage(UUID budgetItemId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BudgetItem bi = loadBudgetItemContext(budgetItemId, orgId).item();

        List<ContractBudgetItem> links = cbiRepository.findByBudgetItemId(budgetItemId);
        BigDecimal totalQty = nonNull(bi.getQuantity());
        BigDecimal allocatedQty = links.stream()
                .map(ContractBudgetItem::getAllocatedQuantity)
                .map(this::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal coveragePct = totalQty.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO :
                allocatedQty.multiply(HUNDRED).divide(totalQty, 2, RoundingMode.HALF_UP);

        BigDecimal totalAmount = resolveCoverageBaseAmount(bi);
        BigDecimal allocatedAmount = links.stream()
                .map(ContractBudgetItem::getAllocatedAmount)
                .map(this::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal amountCoveragePct = totalAmount.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO :
                allocatedAmount.multiply(HUNDRED).divide(totalAmount, 2, RoundingMode.HALF_UP);

        List<BudgetItemCoverageResponse.ContractAllocation> allocations = links.stream().map(link -> {
            Contract c = contractRepository.findByIdAndOrganizationIdAndDeletedFalse(link.getContractId(), orgId).orElse(null);
            return new BudgetItemCoverageResponse.ContractAllocation(
                    link.getContractId(),
                    c != null ? c.getNumber() : null,
                    c != null ? c.getName() : null,
                    c != null ? c.getPartnerName() : null,
                    link.getAllocatedQuantity(),
                    link.getAllocatedAmount()
            );
        }).toList();

        return new BudgetItemCoverageResponse(
                budgetItemId,
                totalQty,
                allocatedQty,
                coveragePct,
                totalAmount,
                allocatedAmount,
                amountCoveragePct,
                links.size(),
                allocations
        );
    }

    private BigDecimal resolveCoverageBaseAmount(BudgetItem budgetItem) {
        BigDecimal plannedAmount = nonNull(budgetItem.getPlannedAmount());
        BigDecimal customerTotal = nonNull(budgetItem.getCustomerTotal());
        return plannedAmount.max(customerTotal);
    }

    private List<ContractBudgetItemResponse> toResponses(List<ContractBudgetItem> links) {
        if (links.isEmpty()) {
            return List.of();
        }

        List<UUID> budgetItemIds = links.stream()
                .map(ContractBudgetItem::getBudgetItemId)
                .distinct()
                .toList();

        Map<UUID, BudgetItem> budgetItemMap = budgetItemRepository.findAllById(budgetItemIds).stream()
                .filter(item -> !item.isDeleted())
                .collect(Collectors.toMap(BudgetItem::getId, item -> item));

        return links.stream()
                .map(link -> ContractBudgetItemResponse.fromEntity(link, budgetItemMap.get(link.getBudgetItemId())))
                .toList();
    }

    private Contract loadContract(UUID contractId, UUID organizationId) {
        return contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + contractId));
    }

    private BudgetItemContext loadBudgetItemContext(UUID budgetItemId, UUID organizationId) {
        BudgetItem budgetItem = budgetItemRepository.findById(budgetItemId)
                .filter(item -> !item.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + budgetItemId));

        Budget budget = budgetRepository.findByIdAndDeletedFalse(budgetItem.getBudgetId())
                .orElseThrow(() -> new EntityNotFoundException("Позиция ФМ не найдена: " + budgetItemId));

        return new BudgetItemContext(budgetItem, budget);
    }

    private void validateProjectMatch(Contract contract, Budget budget, UUID budgetItemId) {
        UUID contractProjectId = contract.getProjectId();
        UUID budgetProjectId = budget.getProjectId();
        if (contractProjectId != null && budgetProjectId != null && !contractProjectId.equals(budgetProjectId)) {
            throw new IllegalArgumentException("Позиция ФМ относится к другому проекту: " + budgetItemId);
        }
    }

    private void validateBudgetItemLinkable(BudgetItem budgetItem) {
        if (budgetItem.isSection()) {
            throw new IllegalArgumentException("Раздел ФМ нельзя привязать к договору, выберите позицию");
        }
    }

    private void validateLinkValues(LinkBudgetItemsRequest.BudgetItemLink link) {
        BigDecimal qty = nonNull(link.allocatedQuantity());
        BigDecimal amount = nonNull(link.allocatedAmount());

        validateLinkValues(qty, amount);
    }

    private void validateLinkValues(BigDecimal qty, BigDecimal amount) {

        if (qty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Распределенное количество не может быть отрицательным");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Распределенная сумма не может быть отрицательной");
        }
        if (qty.compareTo(BigDecimal.ZERO) == 0 && amount.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Укажите количество или сумму для привязки позиции");
        }
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void recalculateContractedAmount(UUID budgetItemId) {
        BigDecimal totalAmount = cbiRepository
                .sumAllocatedAmountByBudgetItemIdAndContractStatusIn(budgetItemId, CONTRACTED_STATUSES);
        BudgetItem bi = budgetItemRepository.findById(budgetItemId)
                .filter(item -> !item.isDeleted())
                .orElse(null);
        if (bi != null) {
            bi.setContractedAmount(totalAmount);
            budgetItemRepository.save(bi);
        }
    }

    private record BudgetItemContext(BudgetItem item, Budget budget) {
    }
}
