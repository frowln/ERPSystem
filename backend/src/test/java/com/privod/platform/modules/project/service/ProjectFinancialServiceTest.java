package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.costManagement.repository.CommitmentRepository;
import com.privod.platform.modules.costManagement.repository.CostCodeRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.project.web.dto.ProjectFinancialSummary;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectFinancialServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ChangeOrderRepository changeOrderRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private CostCodeRepository costCodeRepository;
    @Mock
    private CommitmentRepository commitmentRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private EstimateRepository estimateRepository;

    @InjectMocks
    private ProjectFinancialService projectFinancialService;

    private UUID organizationId;

    @BeforeEach
    void setUp() {
        organizationId = UUID.randomUUID();
        authenticate(organizationId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getFinancialsIncludesApprovedAndExecutedChangeOrders() {
        UUID projectId = UUID.randomUUID();
        Project project = Project.builder()
                .code("PRJ-TST-1")
                .name("Demo")
                .organizationId(organizationId)
                .build();
        project.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        when(contractRepository.sumAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("GENERAL")), eq(organizationId)))
                .thenReturn(new BigDecimal("100"));
        when(contractRepository.sumAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SUBCONTRACT")), eq(organizationId)))
                .thenReturn(new BigDecimal("40"));
        when(contractRepository.sumAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SUPPLY")), eq(organizationId)))
                .thenReturn(new BigDecimal("30"));
        when(contractRepository.sumAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SERVICE")), eq(organizationId)))
                .thenReturn(new BigDecimal("20"));

        when(changeOrderRepository.sumApprovedAndExecutedAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("GENERAL")), eq(organizationId)))
                .thenReturn(new BigDecimal("15"));
        when(changeOrderRepository.sumApprovedAndExecutedAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SUBCONTRACT")), eq(organizationId)))
                .thenReturn(new BigDecimal("5"));
        when(changeOrderRepository.sumApprovedAndExecutedAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SUPPLY")), eq(organizationId)))
                .thenReturn(new BigDecimal("3"));
        when(changeOrderRepository.sumApprovedAndExecutedAmountByProjectIdAndTypeCodesAndOrganizationId(
                eq(projectId), eq(List.of("SERVICE")), eq(organizationId)))
                .thenReturn(new BigDecimal("2"));

        when(invoiceRepository.sumNetByProjectIdAndType(projectId, InvoiceType.ISSUED))
                .thenReturn(new BigDecimal("70"));
        when(invoiceRepository.sumNetByProjectIdAndType(projectId, InvoiceType.RECEIVED))
                .thenReturn(new BigDecimal("35"));
        when(paymentRepository.sumNetByProjectIdAndType(projectId, PaymentType.INCOMING))
                .thenReturn(new BigDecimal("50"));
        when(paymentRepository.sumNetByProjectIdAndType(projectId, PaymentType.OUTGOING))
                .thenReturn(new BigDecimal("20"));

        when(costCodeRepository.sumBudgetAmountByProjectId(projectId)).thenReturn(new BigDecimal("200"));
        when(budgetRepository.sumPlannedCostByProjectId(projectId)).thenReturn(new BigDecimal("180"));
        when(estimateRepository.sumTotalAmountByProjectId(projectId)).thenReturn(new BigDecimal("150"));
        when(commitmentRepository.sumRevisedAmountByProjectId(projectId)).thenReturn(new BigDecimal("60"));

        ProjectFinancialSummary summary = projectFinancialService.getFinancials(projectId);

        assertThat(summary.contractAmount()).isEqualByComparingTo("115");
        assertThat(summary.subcontractAmount()).isEqualByComparingTo("45");
        assertThat(summary.supplyAmount()).isEqualByComparingTo("33");
        assertThat(summary.serviceAmount()).isEqualByComparingTo("22");
        assertThat(summary.margin()).isEqualByComparingTo("95");
        assertThat(summary.accountsReceivable()).isEqualByComparingTo("20");
        assertThat(summary.accountsPayable()).isEqualByComparingTo("15");
        assertThat(summary.cashFlow()).isEqualByComparingTo("30");
    }

    @Test
    void dashboardTotalsIncludeRevenueChangeOrders() {
        UUID project1 = UUID.randomUUID();
        UUID project2 = UUID.randomUUID();
        List<UUID> projectIds = List.of(project1, project2);

        // Batch queries used by refactored getDashboardTotals
        when(contractRepository.sumAmountByProjectIdsAndTypeCodesAndOrganizationId(
                eq(projectIds), anyList(), eq(organizationId)))
                .thenReturn(new BigDecimal("300"));

        when(changeOrderRepository.sumApprovedAndExecutedAmountByProjectIdsAndTypeCodesAndOrganizationId(
                eq(projectIds), anyList(), eq(organizationId)))
                .thenReturn(new BigDecimal("35"));

        when(costCodeRepository.sumBudgetAmountByProjectIds(projectIds)).thenReturn(new BigDecimal("50"));
        when(budgetRepository.sumPlannedCostByProjectIds(projectIds)).thenReturn(new BigDecimal("160"));

        when(paymentRepository.sumNetByProjectIdsAndType(projectIds, PaymentType.INCOMING))
                .thenReturn(new BigDecimal("230"));
        when(paymentRepository.sumNetByProjectIdsAndType(projectIds, PaymentType.OUTGOING))
                .thenReturn(new BigDecimal("100"));

        ProjectFinancialService.DashboardFinancialTotals totals = projectFinancialService
                .getDashboardTotals(projectIds);

        assertThat(totals.totalContractAmount()).isEqualByComparingTo("335");
        assertThat(totals.totalPlannedBudget()).isEqualByComparingTo("50");
        assertThat(totals.totalReceivedPayments()).isEqualByComparingTo("230");
        assertThat(totals.totalPaidToSuppliers()).isEqualByComparingTo("100");
        assertThat(totals.totalCashFlow()).isEqualByComparingTo("130");
    }

    private void authenticate(UUID orgId) {
        Role adminRole = Role.builder()
                .code("ADMIN")
                .name("Admin")
                .description("Admin role")
                .systemRole(true)
                .build();

        User user = User.builder()
                .email("test@privod.local")
                .passwordHash("test")
                .firstName("Test")
                .lastName("User")
                .enabled(true)
                .organizationId(orgId)
                .roles(Set.of(adminRole))
                .build();
        user.setId(UUID.randomUUID());

        CustomUserDetails principal = new CustomUserDetails(user);
        var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
