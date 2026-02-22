package com.privod.platform.modules.commercialProposal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposal;
import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.domain.ProposalItemStatus;
import com.privod.platform.modules.commercialProposal.domain.ProposalStatus;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalItemRepository;
import com.privod.platform.modules.commercialProposal.repository.CommercialProposalRepository;
import com.privod.platform.modules.commercialProposal.web.dto.ChangeProposalStatusRequest;
import com.privod.platform.modules.commercialProposal.web.dto.LinkEstimateRequest;
import com.privod.platform.modules.commercialProposal.web.dto.SelectInvoiceRequest;
import com.privod.platform.modules.commercialProposal.web.dto.UpdateCommercialProposalItemRequest;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommercialProposalServiceTest {

    @Mock
    private CommercialProposalRepository proposalRepository;
    @Mock
    private CommercialProposalItemRepository itemRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private BudgetItemRepository budgetItemRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private InvoiceLineRepository invoiceLineRepository;
    @Mock
    private EstimateItemRepository estimateItemRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private CommercialProposalService service;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    private final UUID organizationId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID proposalId = UUID.randomUUID();
    private final UUID budgetId = UUID.randomUUID();
    private final UUID cpItemId = UUID.randomUUID();
    private final UUID budgetItemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        securityUtilsMock = mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::requireCurrentOrganizationId).thenReturn(organizationId);
        securityUtilsMock.when(SecurityUtils::requireCurrentUserId).thenReturn(userId);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    @DisplayName("selectInvoice sets cost from invoice line and marks line as selected")
    void selectInvoiceSetsCostAndReservesLine() {
        UUID invoiceId = UUID.randomUUID();
        UUID invoiceLineId = UUID.randomUUID();

        CommercialProposal proposal = proposal(ProposalStatus.IN_REVIEW);
        CommercialProposalItem item = item("MATERIAL");

        Invoice invoice = Invoice.builder()
                .organizationId(organizationId)
                .invoiceDate(LocalDate.of(2026, 2, 21))
                .projectId(projectId)
                .invoiceType(InvoiceType.RECEIVED)
                .totalAmount(new BigDecimal("1000"))
                .build();
        invoice.setId(invoiceId);

        InvoiceLine line = InvoiceLine.builder()
                .invoiceId(invoiceId)
                .name("Кабель")
                .quantity(new BigDecimal("100"))
                .unitPrice(new BigDecimal("75.00"))
                .amount(new BigDecimal("7500.00"))
                .selectedForCp(false)
                .build();
        line.setId(invoiceLineId);

        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));
        when(itemRepository.findById(cpItemId)).thenReturn(Optional.of(item));
        when(invoiceLineRepository.findById(invoiceLineId)).thenReturn(Optional.of(line));
        when(invoiceRepository.findByIdAndDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceLineRepository.save(any(InvoiceLine.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.save(any(CommercialProposalItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.findByProposalId(proposalId)).thenReturn(List.of(item));
        when(proposalRepository.save(any(CommercialProposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.empty());

        var response = service.selectInvoice(proposalId, cpItemId, new SelectInvoiceRequest(invoiceLineId));

        assertThat(response.selectedInvoiceLineId()).isEqualTo(invoiceLineId);
        assertThat(response.status()).isEqualTo(ProposalItemStatus.INVOICE_SELECTED);
        assertThat(response.costPrice()).isEqualByComparingTo(new BigDecimal("75.00"));
        assertThat(response.totalCost()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(line.isSelectedForCp()).isTrue();
        assertThat(line.getCpItemId()).isEqualTo(cpItemId);
        verify(proposalRepository, atLeastOnce()).save(any(CommercialProposal.class));
    }

    @Test
    @DisplayName("approveItem rejects material without selected invoice")
    void approveRejectsMaterialWithoutInvoice() {
        CommercialProposal proposal = proposal(ProposalStatus.IN_REVIEW);
        CommercialProposalItem item = item("MATERIAL");
        item.setSelectedInvoiceLineId(null);

        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));
        when(itemRepository.findById(cpItemId)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.approveItem(proposalId, cpItemId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("сначала выберите счёт");

        verify(itemRepository, never()).save(any(CommercialProposalItem.class));
    }

    @Test
    @DisplayName("linkEstimate updates cost from estimate price and coefficient")
    void linkEstimateUpdatesCostFromEstimateAndCoefficient() {
        UUID estimateItemId = UUID.randomUUID();
        CommercialProposal proposal = proposal(ProposalStatus.IN_REVIEW);
        CommercialProposalItem item = item("WORK");

        EstimateItem estimateItem = EstimateItem.builder()
                .estimateId(UUID.randomUUID())
                .projectId(projectId)
                .sequence(1)
                .name("Монтаж")
                .quantity(new BigDecimal("5"))
                .unitOfMeasure("шт")
                .unitPrice(new BigDecimal("200.00"))
                .build();
        estimateItem.setId(estimateItemId);

        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));
        when(itemRepository.findById(cpItemId)).thenReturn(Optional.of(item));
        when(estimateItemRepository.findById(estimateItemId)).thenReturn(Optional.of(estimateItem));
        when(itemRepository.save(any(CommercialProposalItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.findByProposalId(proposalId)).thenReturn(List.of(item));
        when(proposalRepository.save(any(CommercialProposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.empty());

        var response = service.linkEstimate(
                proposalId,
                cpItemId,
                new LinkEstimateRequest(estimateItemId, new BigDecimal("0.9"))
        );

        assertThat(response.estimateItemId()).isEqualTo(estimateItemId);
        assertThat(response.costPrice()).isEqualByComparingTo(new BigDecimal("180.00"));
        assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("5"));
        assertThat(response.totalCost()).isEqualByComparingTo(new BigDecimal("900.00"));
    }

    @Test
    @DisplayName("updateItem recalculates work cost from linked estimate when coefficient changes")
    void updateItemRecalculatesWorkCostFromEstimateWhenCoefficientChanges() {
        UUID estimateItemId = UUID.randomUUID();
        CommercialProposal proposal = proposal(ProposalStatus.IN_REVIEW);
        CommercialProposalItem item = item("WORK");
        item.setEstimateItemId(estimateItemId);
        item.setQuantity(new BigDecimal("3"));
        item.setTradingCoefficient(new BigDecimal("1.00"));
        item.setCostPrice(new BigDecimal("200.00"));

        EstimateItem estimateItem = EstimateItem.builder()
                .estimateId(UUID.randomUUID())
                .projectId(projectId)
                .sequence(10)
                .name("ПНР")
                .quantity(new BigDecimal("7"))
                .unitOfMeasure("шт")
                .unitPrice(new BigDecimal("400.00"))
                .build();
        estimateItem.setId(estimateItemId);

        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));
        when(itemRepository.findById(cpItemId)).thenReturn(Optional.of(item));
        when(estimateItemRepository.findById(estimateItemId)).thenReturn(Optional.of(estimateItem));
        when(itemRepository.save(any(CommercialProposalItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.findByProposalId(proposalId)).thenReturn(List.of(item));
        when(proposalRepository.save(any(CommercialProposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.empty());

        var response = service.updateItem(
                proposalId,
                cpItemId,
                new UpdateCommercialProposalItemRequest(
                        null,
                        null,
                        new BigDecimal("0.95"),
                        null
                )
        );

        assertThat(response.tradingCoefficient()).isEqualByComparingTo(new BigDecimal("0.95"));
        assertThat(response.costPrice()).isEqualByComparingTo(new BigDecimal("380.00"));
        assertThat(response.totalCost()).isEqualByComparingTo(new BigDecimal("1140.00"));
    }

    @Test
    @DisplayName("confirmAll allowed only in IN_REVIEW status")
    void confirmAllAllowedOnlyInReview() {
        CommercialProposal proposal = proposal(ProposalStatus.DRAFT);
        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));

        assertThatThrownBy(() -> service.confirmAll(proposalId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("На рассмотрении");

        verify(itemRepository, never()).findByProposalIdAndStatus(any(UUID.class), any(ProposalItemStatus.class));
    }

    @Test
    @DisplayName("updateStatus rejects invalid transition from DRAFT to ACTIVE")
    void updateStatusRejectsInvalidTransition() {
        CommercialProposal proposal = proposal(ProposalStatus.DRAFT);
        when(proposalRepository.findByIdAndDeletedFalse(proposalId)).thenReturn(Optional.of(proposal));

        assertThatThrownBy(() -> service.updateStatus(
                proposalId,
                new ChangeProposalStatusRequest(ProposalStatus.ACTIVE)
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Недопустимый переход");

        verify(proposalRepository, never()).save(any(CommercialProposal.class));
    }

    private CommercialProposal proposal(ProposalStatus status) {
        CommercialProposal proposal = CommercialProposal.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .budgetId(budgetId)
                .name("КП-1")
                .status(status)
                .totalCostPrice(BigDecimal.ZERO)
                .build();
        proposal.setId(proposalId);
        return proposal;
    }

    private CommercialProposalItem item(String itemType) {
        CommercialProposalItem item = CommercialProposalItem.builder()
                .proposalId(proposalId)
                .budgetItemId(budgetItemId)
                .itemType(itemType)
                .costPrice(new BigDecimal("100.00"))
                .quantity(new BigDecimal("2"))
                .tradingCoefficient(BigDecimal.ONE)
                .status(ProposalItemStatus.PENDING)
                .totalCost(new BigDecimal("200.00"))
                .build();
        item.setId(cpItemId);
        return item;
    }
}
