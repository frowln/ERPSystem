package com.privod.platform.modules.contract.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import com.privod.platform.modules.contract.domain.ContractDirection;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.repository.ContractBudgetItemRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contract.web.dto.LinkBudgetItemsRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractBudgetItemRequest;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractBudgetItemServiceTest {

    @Mock
    private ContractBudgetItemRepository cbiRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private BudgetItemRepository budgetItemRepository;
    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private ContractBudgetItemService service;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    private final UUID organizationId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID budgetId = UUID.randomUUID();
    private final UUID budgetItemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        securityUtilsMock = mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::requireCurrentOrganizationId).thenReturn(organizationId);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    @DisplayName("rejects linking section row to contract")
    void rejectsLinkingSectionRow() {
        Contract contract = contract();
        Budget budget = budget();
        BudgetItem section = budgetItem(true, new BigDecimal("10"), BigDecimal.ZERO, BigDecimal.ZERO);

        when(contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId))
                .thenReturn(Optional.of(contract));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(section));
        when(budgetRepository.findByIdAndDeletedFalse(budgetId))
                .thenReturn(Optional.of(budget));

        LinkBudgetItemsRequest request = new LinkBudgetItemsRequest(List.of(
                new LinkBudgetItemsRequest.BudgetItemLink(
                        budgetItemId,
                        BigDecimal.ONE,
                        BigDecimal.ZERO,
                        null
                )
        ));

        assertThatThrownBy(() -> service.linkBudgetItems(contractId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Раздел ФМ");

        verify(cbiRepository, never()).save(any(ContractBudgetItem.class));
    }

    @Test
    @DisplayName("rejects link amount for item with zero coverage base amount")
    void rejectsLinkAmountForZeroCoverageBase() {
        Contract contract = contract();
        Budget budget = budget();
        BudgetItem item = budgetItem(false, new BigDecimal("10"), BigDecimal.ZERO, BigDecimal.ZERO);

        when(contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId))
                .thenReturn(Optional.of(contract));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(item));
        when(budgetRepository.findByIdAndDeletedFalse(budgetId))
                .thenReturn(Optional.of(budget));
        when(cbiRepository.existsByContractIdAndBudgetItemId(contractId, budgetItemId)).thenReturn(false);
        when(cbiRepository.sumAllocatedQuantityByBudgetItemId(budgetItemId)).thenReturn(BigDecimal.ZERO);
        when(cbiRepository.sumAllocatedAmountByBudgetItemId(budgetItemId)).thenReturn(BigDecimal.ZERO);

        LinkBudgetItemsRequest request = new LinkBudgetItemsRequest(List.of(
                new LinkBudgetItemsRequest.BudgetItemLink(
                        budgetItemId,
                        BigDecimal.ONE,
                        new BigDecimal("1000"),
                        null
                )
        ));

        assertThatThrownBy(() -> service.linkBudgetItems(contractId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("нулевой базовой суммой");

        verify(cbiRepository, never()).save(any(ContractBudgetItem.class));
    }

    @Test
    @DisplayName("rejects update amount for item with zero coverage base amount")
    void rejectsUpdateAmountForZeroCoverageBase() {
        UUID linkId = UUID.randomUUID();
        Contract contract = contract();
        Budget budget = budget();
        BudgetItem item = budgetItem(false, new BigDecimal("10"), BigDecimal.ZERO, BigDecimal.ZERO);
        ContractBudgetItem link = ContractBudgetItem.builder()
                .id(linkId)
                .contractId(contractId)
                .budgetItemId(budgetItemId)
                .allocatedQuantity(new BigDecimal("1"))
                .allocatedAmount(BigDecimal.ZERO)
                .build();

        when(contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId))
                .thenReturn(Optional.of(contract));
        when(cbiRepository.findById(linkId)).thenReturn(Optional.of(link));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(item));
        when(budgetRepository.findByIdAndDeletedFalse(budgetId))
                .thenReturn(Optional.of(budget));
        when(cbiRepository.sumAllocatedQuantityByBudgetItemIdExcludingLinkId(budgetItemId, linkId))
                .thenReturn(BigDecimal.ZERO);
        when(cbiRepository.sumAllocatedAmountByBudgetItemIdExcludingLinkId(budgetItemId, linkId))
                .thenReturn(BigDecimal.ZERO);

        UpdateContractBudgetItemRequest request = new UpdateContractBudgetItemRequest(
                null,
                new BigDecimal("500"),
                null
        );

        assertThatThrownBy(() -> service.updateLinkedItem(contractId, linkId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("нулевой базовой суммой");

        verify(cbiRepository, never()).save(any(ContractBudgetItem.class));
    }

    @Test
    @DisplayName("allows linking split portion when remaining quantity and amount are sufficient")
    void allowsSplitWithinAvailableCoverage() {
        Contract contract = contract();
        Budget budget = budget();
        BudgetItem item = budgetItem(false, new BigDecimal("100"), new BigDecimal("10000"), BigDecimal.ZERO);
        ContractBudgetItem savedLink = ContractBudgetItem.builder()
                .id(UUID.randomUUID())
                .contractId(contractId)
                .budgetItemId(budgetItemId)
                .allocatedQuantity(new BigDecimal("50"))
                .allocatedAmount(new BigDecimal("5000"))
                .build();

        when(contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId))
                .thenReturn(Optional.of(contract));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(item));
        when(budgetRepository.findByIdAndDeletedFalse(budgetId))
                .thenReturn(Optional.of(budget));
        when(cbiRepository.existsByContractIdAndBudgetItemId(contractId, budgetItemId)).thenReturn(false);
        when(cbiRepository.sumAllocatedQuantityByBudgetItemId(budgetItemId)).thenReturn(new BigDecimal("50"));
        when(cbiRepository.sumAllocatedAmountByBudgetItemId(budgetItemId)).thenReturn(new BigDecimal("5000"));
        when(cbiRepository.save(any(ContractBudgetItem.class))).thenReturn(savedLink);
        when(cbiRepository.sumAllocatedAmountByBudgetItemIdAndContractStatusIn(any(), any()))
                .thenReturn(new BigDecimal("10000"));
        when(cbiRepository.findByContractId(contractId)).thenReturn(List.of(savedLink));
        when(budgetItemRepository.findAllById(any())).thenReturn(List.of(item));

        LinkBudgetItemsRequest request = new LinkBudgetItemsRequest(List.of(
                new LinkBudgetItemsRequest.BudgetItemLink(
                        budgetItemId,
                        new BigDecimal("50"),
                        new BigDecimal("5000"),
                        "Вторая половина позиции"
                )
        ));

        var response = service.linkBudgetItems(contractId, request);

        assertThat(response).hasSize(1);
        verify(cbiRepository).save(any(ContractBudgetItem.class));
    }

    @Test
    @DisplayName("rejects linking split portion when quantity exceeds remaining coverage")
    void rejectsSplitWhenQuantityExceedsRemainingCoverage() {
        Contract contract = contract();
        Budget budget = budget();
        BudgetItem item = budgetItem(false, new BigDecimal("100"), new BigDecimal("10000"), BigDecimal.ZERO);

        when(contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId))
                .thenReturn(Optional.of(contract));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(item));
        when(budgetRepository.findByIdAndDeletedFalse(budgetId))
                .thenReturn(Optional.of(budget));
        when(cbiRepository.existsByContractIdAndBudgetItemId(contractId, budgetItemId)).thenReturn(false);
        when(cbiRepository.sumAllocatedQuantityByBudgetItemId(budgetItemId)).thenReturn(new BigDecimal("50"));

        LinkBudgetItemsRequest request = new LinkBudgetItemsRequest(List.of(
                new LinkBudgetItemsRequest.BudgetItemLink(
                        budgetItemId,
                        new BigDecimal("60"),
                        new BigDecimal("4000"),
                        "Превышение остатка"
                )
        ));

        assertThatThrownBy(() -> service.linkBudgetItems(contractId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Превышено доступное количество");

        verify(cbiRepository, never()).save(any(ContractBudgetItem.class));
    }

    private Contract contract() {
        Contract contract = Contract.builder()
                .organizationId(organizationId)
                .name("Договор")
                .number("CTR-1")
                .status(ContractStatus.ACTIVE)
                .direction(ContractDirection.CONTRACTOR)
                .projectId(projectId)
                .build();
        contract.setId(contractId);
        return contract;
    }

    private Budget budget() {
        Budget budget = Budget.builder()
                .organizationId(organizationId)
                .name("Бюджет")
                .projectId(projectId)
                .status(BudgetStatus.ACTIVE)
                .build();
        budget.setId(budgetId);
        return budget;
    }

    private BudgetItem budgetItem(boolean section,
                                  BigDecimal quantity,
                                  BigDecimal plannedAmount,
                                  BigDecimal customerPrice) {
        BudgetItem item = BudgetItem.builder()
                .budgetId(budgetId)
                .name(section ? "Раздел ЭО" : "Позиция ЭО")
                .section(section)
                .quantity(quantity)
                .plannedAmount(plannedAmount)
                .customerPrice(customerPrice)
                .build();
        item.setId(budgetItemId);
        return item;
    }
}
