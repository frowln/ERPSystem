package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.finance.web.dto.CreatePaymentRequest;
import com.privod.platform.modules.finance.web.dto.PaymentResponse;
import com.privod.platform.modules.finance.web.dto.PaymentSummaryResponse;
import com.privod.platform.modules.finance.web.dto.UpdatePaymentRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PaymentService paymentService;

    private UUID paymentId;
    private UUID projectId;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        paymentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPayment = Payment.builder()
                .number("PAY-00001")
                .paymentDate(LocalDate.now())
                .projectId(projectId)
                .paymentType(PaymentType.OUTGOING)
                .status(PaymentStatus.DRAFT)
                .amount(new BigDecimal("100000.00"))
                .vatAmount(new BigDecimal("20000.00"))
                .totalAmount(new BigDecimal("120000.00"))
                .purpose("Payment for materials")
                .build();
        testPayment.setId(paymentId);
        testPayment.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Payment")
    class CreateTests {

        @Test
        @DisplayName("Should create payment with DRAFT status and calculated total")
        void shouldCreate_withDraftStatusAndCalculatedTotal() {
            CreatePaymentRequest request = new CreatePaymentRequest(
                    LocalDate.now(), projectId, null, null, "Supplier LLC",
                    PaymentType.OUTGOING, new BigDecimal("200000.00"), new BigDecimal("40000.00"),
                    "Payment", null, null, null);

            when(paymentRepository.getNextNumberSequence()).thenReturn(2L);
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
                Payment p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            PaymentResponse response = paymentService.createPayment(request);

            assertThat(response.status()).isEqualTo(PaymentStatus.DRAFT);
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("240000.00"));
            verify(auditService).logCreate(eq("Payment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default VAT amount to ZERO when null")
        void shouldDefaultVat_whenNull() {
            CreatePaymentRequest request = new CreatePaymentRequest(
                    LocalDate.now(), projectId, null, null, "Partner",
                    PaymentType.INCOMING, new BigDecimal("500000.00"), null,
                    "Revenue", null, null, null);

            when(paymentRepository.getNextNumberSequence()).thenReturn(3L);
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
                Payment p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            PaymentResponse response = paymentService.createPayment(request);

            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        }
    }

    @Nested
    @DisplayName("Update Payment")
    class UpdateTests {

        @Test
        @DisplayName("Should update payment in DRAFT status")
        void shouldUpdate_whenDraftStatus() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdatePaymentRequest request = new UpdatePaymentRequest(
                    null, null, null, null, null,
                    new BigDecimal("150000.00"), null, "Updated purpose",
                    null, null, null);

            PaymentResponse response = paymentService.updatePayment(paymentId, request);

            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("150000.00"));
            verify(auditService).logUpdate(eq("Payment"), eq(paymentId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when not in DRAFT status")
        void shouldThrowException_whenNotDraft() {
            testPayment.setStatus(PaymentStatus.APPROVED);
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));

            UpdatePaymentRequest request = new UpdatePaymentRequest(
                    null, null, null, null, null,
                    null, null, null, null, null, null);

            assertThatThrownBy(() -> paymentService.updatePayment(paymentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Payment Status Transitions")
    class StatusTests {

        @Test
        @DisplayName("Should approve payment")
        void shouldApprove_whenDraft() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

            PaymentResponse response = paymentService.approvePayment(paymentId);

            assertThat(response.status()).isEqualTo(PaymentStatus.APPROVED);
            verify(auditService).logStatusChange("Payment", paymentId, "DRAFT", "APPROVED");
        }

        @Test
        @DisplayName("Should cancel payment")
        void shouldCancel_whenDraft() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));
            when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

            PaymentResponse response = paymentService.cancelPayment(paymentId);

            assertThat(response.status()).isEqualTo(PaymentStatus.CANCELLED);
        }

        @Test
        @DisplayName("Should reject invalid status transition for markPaid")
        void shouldThrowException_whenMarkPaidFromDraft() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));

            assertThatThrownBy(() -> paymentService.markPaid(paymentId))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    @DisplayName("Should find payment by ID")
    void shouldReturnPayment_whenExists() {
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));

        PaymentResponse response = paymentService.getPayment(paymentId);

        assertThat(response).isNotNull();
        assertThat(response.number()).isEqualTo("PAY-00001");
    }

    @Test
    @DisplayName("Should throw when payment not found")
    void shouldThrowException_whenPaymentNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(paymentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPayment(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Платёж не найден");
    }

    @Test
    @DisplayName("Should return project payment summary with defaults for nulls")
    void shouldReturnSummary_withDefaults() {
        when(paymentRepository.countByProjectIdAndDeletedFalse(projectId)).thenReturn(5L);
        when(paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING)).thenReturn(null);
        when(paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING)).thenReturn(null);

        PaymentSummaryResponse summary = paymentService.getProjectPaymentSummary(projectId);

        assertThat(summary.totalPayments()).isEqualTo(5L);
        assertThat(summary.totalIncoming()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.totalOutgoing()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
