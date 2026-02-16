package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.web.dto.BudgetItemResponse;
import com.privod.platform.modules.finance.web.dto.BudgetResponse;
import com.privod.platform.modules.finance.web.dto.BudgetSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.CreateBudgetRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private BudgetItemRepository budgetItemRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BudgetService budgetService;

    private UUID budgetId;
    private UUID projectId;
    private Budget testBudget;

    @BeforeEach
    void setUp() {
        budgetId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testBudget = Budget.builder()
                .name("Main Budget")
                .projectId(projectId)
                .status(BudgetStatus.DRAFT)
                .plannedRevenue(new BigDecimal("10000000.00"))
                .plannedCost(new BigDecimal("8000000.00"))
                .plannedMargin(new BigDecimal("2000000.00"))
                .build();
        testBudget.setId(budgetId);
        testBudget.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Budget")
    class CreateTests {

        @Test
        @DisplayName("Should create budget with DRAFT status")
        void shouldCreate_withDraftStatus() {
            CreateBudgetRequest request = new CreateBudgetRequest(
                    "New Budget", projectId, null,
                    new BigDecimal("5000000"), new BigDecimal("3000000"), null, "Notes");

            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> {
                Budget b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            BudgetResponse response = budgetService.createBudget(request);

            assertThat(response.status()).isEqualTo(BudgetStatus.DRAFT);
            assertThat(response.name()).isEqualTo("New Budget");
            verify(auditService).logCreate(eq("Budget"), any(UUID.class));
        }

        @Test
        @DisplayName("Should calculate margin automatically when null")
        void shouldCalculateMargin_whenNull() {
            CreateBudgetRequest request = new CreateBudgetRequest(
                    "Auto Margin", projectId, null,
                    new BigDecimal("10000000"), new BigDecimal("7000000"), null, null);

            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> {
                Budget b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            BudgetResponse response = budgetService.createBudget(request);

            assertThat(response.plannedMargin()).isEqualByComparingTo(new BigDecimal("3000000"));
        }

        @Test
        @DisplayName("Should default revenue and cost to ZERO when null")
        void shouldDefaultToZero_whenNull() {
            CreateBudgetRequest request = new CreateBudgetRequest(
                    "Empty Budget", projectId, null,
                    null, null, null, null);

            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> {
                Budget b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            BudgetResponse response = budgetService.createBudget(request);

            assertThat(response.plannedRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.plannedCost()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Update Budget")
    class UpdateTests {

        @Test
        @DisplayName("Should update budget in DRAFT status")
        void shouldUpdate_whenDraftStatus() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(testBudget));
            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBudgetRequest request = new UpdateBudgetRequest(
                    "Updated Budget", null, null,
                    new BigDecimal("12000000"), null, null, "Updated notes");

            BudgetResponse response = budgetService.updateBudget(budgetId, request);

            assertThat(response.name()).isEqualTo("Updated Budget");
            assertThat(response.plannedRevenue()).isEqualByComparingTo(new BigDecimal("12000000"));
            verify(auditService).logUpdate(eq("Budget"), eq(budgetId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when not in DRAFT status")
        void shouldThrowException_whenNotDraft() {
            testBudget.setStatus(BudgetStatus.APPROVED);
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(testBudget));

            UpdateBudgetRequest request = new UpdateBudgetRequest(
                    "Fail", null, null, null, null, null, null);

            assertThatThrownBy(() -> budgetService.updateBudget(budgetId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Budget Status Transitions")
    class StatusTests {

        @Test
        @DisplayName("Should approve budget from DRAFT")
        void shouldApprove_whenDraft() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(testBudget));
            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> inv.getArgument(0));

            BudgetResponse response = budgetService.approveBudget(budgetId);

            assertThat(response.status()).isEqualTo(BudgetStatus.APPROVED);
            verify(auditService).logStatusChange("Budget", budgetId, "DRAFT", "APPROVED");
        }

        @Test
        @DisplayName("Should reject freeze from DRAFT")
        void shouldThrowException_whenFreezeFromDraft() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(testBudget));

            assertThatThrownBy(() -> budgetService.freezeBudget(budgetId))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Budget Items")
    class ItemTests {

        @Test
        @DisplayName("Should add budget item")
        void shouldAddBudgetItem() {
            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(testBudget));
            when(budgetItemRepository.save(any(BudgetItem.class))).thenAnswer(inv -> {
                BudgetItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            CreateBudgetItemRequest request = new CreateBudgetItemRequest(
                    1, "Materials", "Construction Materials",
                    new BigDecimal("500000"), null);

            BudgetItemResponse response = budgetService.addBudgetItem(budgetId, request);

            assertThat(response).isNotNull();
            verify(auditService).logCreate(eq("BudgetItem"), any(UUID.class));
        }
    }

    @Test
    @DisplayName("Should throw when budget not found")
    void shouldThrowException_whenBudgetNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(budgetRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.getBudget(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Бюджет не найден");
    }

    @Test
    @DisplayName("Should return project budget summary with defaults")
    void shouldReturnSummary_withDefaults() {
        when(budgetRepository.countByProjectIdAndDeletedFalse(projectId)).thenReturn(2L);
        when(budgetRepository.sumPlannedRevenueByProjectId(projectId)).thenReturn(null);
        when(budgetRepository.sumPlannedCostByProjectId(projectId)).thenReturn(null);
        when(budgetRepository.sumActualRevenueByProjectId(projectId)).thenReturn(null);
        when(budgetRepository.sumActualCostByProjectId(projectId)).thenReturn(null);

        BudgetSummaryResponse summary = budgetService.getProjectBudgetSummary(projectId);

        assertThat(summary.totalBudgets()).isEqualTo(2L);
        assertThat(summary.totalPlannedRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.totalPlannedCost()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
