package com.privod.platform.modules.finance;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.finance.service.BudgetService;
import com.privod.platform.modules.finance.service.InvoiceService;
import com.privod.platform.modules.finance.service.PaymentService;
import com.privod.platform.modules.finance.web.dto.BudgetItemResponse;
import com.privod.platform.modules.finance.web.dto.BudgetResponse;
import com.privod.platform.modules.finance.web.dto.BudgetSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.CreateBudgetRequest;
import com.privod.platform.modules.finance.web.dto.CreatePaymentRequest;
import com.privod.platform.modules.finance.web.dto.InvoiceResponse;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceRequest;
import com.privod.platform.modules.finance.web.dto.PaymentResponse;
import com.privod.platform.modules.finance.web.dto.PaymentSummaryResponse;
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
import java.time.LocalDate;
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
class FinanceServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private BudgetItemRepository budgetItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceLineRepository invoiceLineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BudgetService budgetService;

    @InjectMocks
    private PaymentService paymentService;

    @InjectMocks
    private InvoiceService invoiceService;

    private UUID projectId;
    private UUID budgetId;
    private UUID paymentId;
    private UUID invoiceId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        budgetId = UUID.randomUUID();
        paymentId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
    }

    // =========================================================================
    // Budget Tests
    // =========================================================================

    @Nested
    @DisplayName("Budget Service")
    class BudgetTests {

        @Test
        @DisplayName("Should create budget with DRAFT status and calculated margin")
        void createBudget_SetsDefaultDraftStatusAndCalculatesMargin() {
            CreateBudgetRequest request = new CreateBudgetRequest(
                    "Бюджет строительства", projectId, null,
                    new BigDecimal("10000000.00"), new BigDecimal("7000000.00"),
                    null, "Основной бюджет проекта");

            when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
                Budget b = invocation.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            BudgetResponse response = budgetService.createBudget(request);

            assertThat(response.status()).isEqualTo(BudgetStatus.DRAFT);
            assertThat(response.plannedRevenue()).isEqualByComparingTo(new BigDecimal("10000000.00"));
            assertThat(response.plannedCost()).isEqualByComparingTo(new BigDecimal("7000000.00"));
            assertThat(response.plannedMargin()).isEqualByComparingTo(new BigDecimal("3000000.00"));
            verify(auditService).logCreate(eq("Budget"), any(UUID.class));
        }

        @Test
        @DisplayName("Should approve a DRAFT budget")
        void approveBudget_FromDraft() {
            Budget budget = Budget.builder()
                    .name("Тестовый бюджет")
                    .projectId(projectId)
                    .status(BudgetStatus.DRAFT)
                    .plannedRevenue(new BigDecimal("5000000.00"))
                    .plannedCost(new BigDecimal("3000000.00"))
                    .plannedMargin(new BigDecimal("2000000.00"))
                    .build();
            budget.setId(budgetId);
            budget.setCreatedAt(Instant.now());

            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(budgetRepository.save(any(Budget.class))).thenAnswer(inv -> inv.getArgument(0));

            BudgetResponse response = budgetService.approveBudget(budgetId);

            assertThat(response.status()).isEqualTo(BudgetStatus.APPROVED);
            verify(auditService).logStatusChange("Budget", budgetId, "DRAFT", "APPROVED");
        }

        @Test
        @DisplayName("Should reject closing a DRAFT budget")
        void closeBudget_InvalidTransitionFromDraft() {
            Budget budget = Budget.builder()
                    .name("Тестовый бюджет")
                    .status(BudgetStatus.DRAFT)
                    .build();
            budget.setId(budgetId);

            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));

            assertThatThrownBy(() -> budgetService.closeBudget(budgetId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно закрыть бюджет");
        }

        @Test
        @DisplayName("Should add budget item and calculate remaining amount")
        void addBudgetItem_CalculatesRemaining() {
            Budget budget = Budget.builder()
                    .name("Бюджет")
                    .status(BudgetStatus.DRAFT)
                    .build();
            budget.setId(budgetId);

            when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
            when(budgetItemRepository.save(any(BudgetItem.class))).thenAnswer(invocation -> {
                BudgetItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            CreateBudgetItemRequest request = new CreateBudgetItemRequest(
                    1, BudgetCategory.MATERIALS, "Бетон М300",
                    new BigDecimal("500000.00"), null);

            BudgetItemResponse response = budgetService.addBudgetItem(budgetId, request);

            assertThat(response.category()).isEqualTo(BudgetCategory.MATERIALS);
            assertThat(response.plannedAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            assertThat(response.remainingAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            verify(auditService).logCreate(eq("BudgetItem"), any(UUID.class));
        }

        @Test
        @DisplayName("Should return project budget summary")
        void getProjectBudgetSummary() {
            when(budgetRepository.countByProjectIdAndDeletedFalse(projectId)).thenReturn(3L);
            when(budgetRepository.sumPlannedRevenueByProjectId(projectId))
                    .thenReturn(new BigDecimal("30000000.00"));
            when(budgetRepository.sumPlannedCostByProjectId(projectId))
                    .thenReturn(new BigDecimal("20000000.00"));
            when(budgetRepository.sumActualRevenueByProjectId(projectId))
                    .thenReturn(new BigDecimal("15000000.00"));
            when(budgetRepository.sumActualCostByProjectId(projectId))
                    .thenReturn(new BigDecimal("10000000.00"));

            BudgetSummaryResponse summary = budgetService.getProjectBudgetSummary(projectId);

            assertThat(summary.totalBudgets()).isEqualTo(3L);
            assertThat(summary.totalPlannedRevenue()).isEqualByComparingTo(new BigDecimal("30000000.00"));
            assertThat(summary.totalPlannedCost()).isEqualByComparingTo(new BigDecimal("20000000.00"));
            assertThat(summary.totalActualRevenue()).isEqualByComparingTo(new BigDecimal("15000000.00"));
            assertThat(summary.totalActualCost()).isEqualByComparingTo(new BigDecimal("10000000.00"));
        }
    }

    // =========================================================================
    // Payment Tests
    // =========================================================================

    @Nested
    @DisplayName("Payment Service")
    class PaymentTests {

        @Test
        @DisplayName("Should create payment with auto-generated number and calculated total")
        void createPayment_AutoNumberAndTotal() {
            CreatePaymentRequest request = new CreatePaymentRequest(
                    LocalDate.of(2025, 6, 15), projectId, null,
                    UUID.randomUUID(), "ООО СтройМатериал",
                    PaymentType.OUTGOING,
                    new BigDecimal("1000000.00"), new BigDecimal("200000.00"),
                    "Оплата за материалы", "40702810000000001234",
                    null, null);

            when(paymentRepository.getNextNumberSequence()).thenReturn(1L);
            when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
                Payment p = invocation.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            PaymentResponse response = paymentService.createPayment(request);

            assertThat(response.number()).isEqualTo("PAY-00001");
            assertThat(response.status()).isEqualTo(PaymentStatus.DRAFT);
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("1000000.00"));
            assertThat(response.vatAmount()).isEqualByComparingTo(new BigDecimal("200000.00"));
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("1200000.00"));
            verify(auditService).logCreate(eq("Payment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should approve payment and set approvedAt timestamp")
        void approvePayment_SetsTimestamp() {
            Payment payment = Payment.builder()
                    .number("PAY-00001")
                    .paymentDate(LocalDate.of(2025, 6, 15))
                    .paymentType(PaymentType.OUTGOING)
                    .status(PaymentStatus.PENDING)
                    .amount(new BigDecimal("500000.00"))
                    .vatAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("500000.00"))
                    .build();
            payment.setId(paymentId);
            payment.setCreatedAt(Instant.now());

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

            PaymentResponse response = paymentService.approvePayment(paymentId);

            assertThat(response.status()).isEqualTo(PaymentStatus.APPROVED);
            assertThat(response.approvedAt()).isNotNull();
            verify(auditService).logStatusChange("Payment", paymentId, "PENDING", "APPROVED");
        }

        @Test
        @DisplayName("Should reject marking DRAFT payment as paid")
        void markPaid_InvalidTransitionFromDraft() {
            Payment payment = Payment.builder()
                    .number("PAY-00002")
                    .paymentDate(LocalDate.now())
                    .paymentType(PaymentType.INCOMING)
                    .status(PaymentStatus.DRAFT)
                    .amount(new BigDecimal("100000.00"))
                    .totalAmount(new BigDecimal("100000.00"))
                    .build();
            payment.setId(paymentId);

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> paymentService.markPaid(paymentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отметить платёж как оплаченный");
        }

        @Test
        @DisplayName("Should return project payment summary with net cash flow")
        void getProjectPaymentSummary() {
            when(paymentRepository.countByProjectIdAndDeletedFalse(projectId)).thenReturn(10L);
            when(paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING))
                    .thenReturn(new BigDecimal("8000000.00"));
            when(paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING))
                    .thenReturn(new BigDecimal("5000000.00"));

            PaymentSummaryResponse summary = paymentService.getProjectPaymentSummary(projectId);

            assertThat(summary.totalPayments()).isEqualTo(10L);
            assertThat(summary.totalIncoming()).isEqualByComparingTo(new BigDecimal("8000000.00"));
            assertThat(summary.totalOutgoing()).isEqualByComparingTo(new BigDecimal("5000000.00"));
            assertThat(summary.netCashFlow()).isEqualByComparingTo(new BigDecimal("3000000.00"));
        }
    }

    // =========================================================================
    // Invoice Tests
    // =========================================================================

    @Nested
    @DisplayName("Invoice Service")
    class InvoiceTests {

        @Test
        @DisplayName("Should create invoice with auto-generated number and remaining amount")
        void createInvoice_AutoNumberAndRemaining() {
            CreateInvoiceRequest request = new CreateInvoiceRequest(
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 8, 1),
                    projectId, null, UUID.randomUUID(), "ООО Заказчик",
                    InvoiceType.ISSUED,
                    new BigDecimal("2000000.00"), new BigDecimal("20.00"),
                    new BigDecimal("2400000.00"),
                    null, null, null);

            when(invoiceRepository.getNextNumberSequence()).thenReturn(1L);
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
                Invoice inv = invocation.getArgument(0);
                inv.setId(UUID.randomUUID());
                inv.setCreatedAt(Instant.now());
                return inv;
            });

            InvoiceResponse response = invoiceService.createInvoice(request);

            assertThat(response.number()).isEqualTo("INV-00001");
            assertThat(response.status()).isEqualTo(InvoiceStatus.DRAFT);
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("2400000.00"));
            assertThat(response.remainingAmount()).isEqualByComparingTo(new BigDecimal("2400000.00"));
            assertThat(response.paidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("Invoice"), any(UUID.class));
        }

        @Test
        @DisplayName("Should register partial payment and transition to PARTIALLY_PAID")
        void registerPayment_PartialPayment() {
            Invoice invoice = Invoice.builder()
                    .number("INV-00001")
                    .invoiceDate(LocalDate.of(2025, 7, 1))
                    .invoiceType(InvoiceType.ISSUED)
                    .status(InvoiceStatus.SENT)
                    .totalAmount(new BigDecimal("1000000.00"))
                    .paidAmount(BigDecimal.ZERO)
                    .remainingAmount(new BigDecimal("1000000.00"))
                    .build();
            invoice.setId(invoiceId);
            invoice.setCreatedAt(Instant.now());

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            InvoiceResponse response = invoiceService.registerPayment(invoiceId, new BigDecimal("400000.00"));

            assertThat(response.status()).isEqualTo(InvoiceStatus.PARTIALLY_PAID);
            assertThat(response.paidAmount()).isEqualByComparingTo(new BigDecimal("400000.00"));
            assertThat(response.remainingAmount()).isEqualByComparingTo(new BigDecimal("600000.00"));
        }

        @Test
        @DisplayName("Should register full payment and transition to PAID")
        void registerPayment_FullPayment() {
            Invoice invoice = Invoice.builder()
                    .number("INV-00002")
                    .invoiceDate(LocalDate.of(2025, 7, 1))
                    .invoiceType(InvoiceType.ISSUED)
                    .status(InvoiceStatus.SENT)
                    .totalAmount(new BigDecimal("500000.00"))
                    .paidAmount(BigDecimal.ZERO)
                    .remainingAmount(new BigDecimal("500000.00"))
                    .build();
            invoice.setId(invoiceId);
            invoice.setCreatedAt(Instant.now());

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            InvoiceResponse response = invoiceService.registerPayment(invoiceId, new BigDecimal("500000.00"));

            assertThat(response.status()).isEqualTo(InvoiceStatus.PAID);
            assertThat(response.paidAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            assertThat(response.remainingAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should reject payment exceeding remaining amount")
        void registerPayment_ExceedsRemaining() {
            Invoice invoice = Invoice.builder()
                    .number("INV-00003")
                    .invoiceDate(LocalDate.of(2025, 7, 1))
                    .invoiceType(InvoiceType.ISSUED)
                    .status(InvoiceStatus.SENT)
                    .totalAmount(new BigDecimal("100000.00"))
                    .paidAmount(BigDecimal.ZERO)
                    .remainingAmount(new BigDecimal("100000.00"))
                    .build();
            invoice.setId(invoiceId);
            invoice.setCreatedAt(Instant.now());

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

            assertThatThrownBy(() -> invoiceService.registerPayment(invoiceId, new BigDecimal("200000.00")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Сумма оплаты");
        }

        @Test
        @DisplayName("Should throw when invoice not found")
        void getInvoice_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(invoiceRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> invoiceService.getInvoice(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Счёт не найден");
        }
    }
}
