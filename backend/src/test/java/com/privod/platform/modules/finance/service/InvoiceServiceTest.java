package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceLine;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceLineRequest;
import com.privod.platform.modules.finance.web.dto.CreateInvoiceRequest;
import com.privod.platform.modules.finance.web.dto.InvoiceLineResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceResponse;
import com.privod.platform.modules.finance.web.dto.InvoiceSummaryResponse;
import com.privod.platform.modules.finance.web.dto.UpdateInvoiceRequest;
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
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceLineRepository invoiceLineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private InvoiceService invoiceService;

    private UUID invoiceId;
    private UUID projectId;
    private Invoice testInvoice;

    @BeforeEach
    void setUp() {
        invoiceId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testInvoice = Invoice.builder()
                .number("INV-00001")
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .projectId(projectId)
                .partnerName("Supplier LLC")
                .invoiceType(InvoiceType.RECEIVED)
                .status(InvoiceStatus.DRAFT)
                .subtotal(new BigDecimal("100000.00"))
                .vatRate(new BigDecimal("20.00"))
                .vatAmount(new BigDecimal("20000.00"))
                .totalAmount(new BigDecimal("120000.00"))
                .remainingAmount(new BigDecimal("120000.00"))
                .build();
        testInvoice.setId(invoiceId);
        testInvoice.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Invoice")
    class CreateTests {

        @Test
        @DisplayName("Should create invoice with DRAFT status and calculated VAT")
        void shouldCreate_withCalculatedVat() {
            CreateInvoiceRequest request = new CreateInvoiceRequest(
                    LocalDate.now(), LocalDate.now().plusDays(30),
                    projectId, null, null, "Partner",
                    InvoiceType.ISSUED, new BigDecimal("200000.00"),
                    null, new BigDecimal("240000.00"),
                    null, null, null);

            when(invoiceRepository.getNextNumberSequence()).thenReturn(2L);
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> {
                Invoice i = inv.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });

            InvoiceResponse response = invoiceService.createInvoice(request);

            assertThat(response.status()).isEqualTo(InvoiceStatus.DRAFT);
            assertThat(response.vatRate()).isEqualByComparingTo(new BigDecimal("20.00"));
            verify(auditService).logCreate(eq("Invoice"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Update Invoice")
    class UpdateTests {

        @Test
        @DisplayName("Should update invoice in DRAFT status")
        void shouldUpdate_whenDraft() {
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateInvoiceRequest request = new UpdateInvoiceRequest(
                    null, null, null, null, null, "Updated Partner",
                    new BigDecimal("150000.00"), null, null,
                    null, null, "Updated notes");

            InvoiceResponse response = invoiceService.updateInvoice(invoiceId, request);

            assertThat(response.partnerName()).isEqualTo("Updated Partner");
            verify(auditService).logUpdate(eq("Invoice"), eq(invoiceId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when not in DRAFT status")
        void shouldThrowException_whenNotDraft() {
            testInvoice.setStatus(InvoiceStatus.SENT);
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));

            UpdateInvoiceRequest request = new UpdateInvoiceRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null);

            assertThatThrownBy(() -> invoiceService.updateInvoice(invoiceId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Invoice Status Transitions")
    class StatusTests {

        @Test
        @DisplayName("Should send invoice from DRAFT")
        void shouldSend_whenDraft() {
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            InvoiceResponse response = invoiceService.sendInvoice(invoiceId);

            assertThat(response.status()).isEqualTo(InvoiceStatus.SENT);
            verify(auditService).logStatusChange("Invoice", invoiceId, "DRAFT", "SENT");
        }

        @Test
        @DisplayName("Should cancel invoice")
        void shouldCancel_whenDraft() {
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            InvoiceResponse response = invoiceService.cancelInvoice(invoiceId);

            assertThat(response.status()).isEqualTo(InvoiceStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("Register Payment")
    class PaymentTests {

        @Test
        @DisplayName("Should register partial payment")
        void shouldRegisterPartialPayment() {
            testInvoice.setStatus(InvoiceStatus.SENT);
            testInvoice.setPaidAmount(BigDecimal.ZERO);
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));
            when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

            InvoiceResponse response = invoiceService.registerPayment(invoiceId, new BigDecimal("50000.00"));

            assertThat(response.status()).isEqualTo(InvoiceStatus.PARTIALLY_PAID);
        }

        @Test
        @DisplayName("Should reject payment exceeding remaining amount")
        void shouldThrowException_whenPaymentExceedsRemaining() {
            testInvoice.setStatus(InvoiceStatus.SENT);
            testInvoice.setPaidAmount(BigDecimal.ZERO);
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));

            assertThatThrownBy(() -> invoiceService.registerPayment(invoiceId, new BigDecimal("999999999.00")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("превышает остаток");
        }

        @Test
        @DisplayName("Should reject payment for DRAFT invoice")
        void shouldThrowException_whenPaymentForDraftInvoice() {
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(testInvoice));

            assertThatThrownBy(() -> invoiceService.registerPayment(invoiceId, new BigDecimal("10000.00")))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    @DisplayName("Should throw when invoice not found")
    void shouldThrowException_whenInvoiceNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(invoiceRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getInvoice(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Счёт не найден");
    }

    @Test
    @DisplayName("Should return project invoice summary")
    void shouldReturnSummary() {
        when(invoiceRepository.countByProjectIdAndDeletedFalse(projectId)).thenReturn(10L);
        when(invoiceRepository.sumTotalByProjectIdAndType(projectId, InvoiceType.ISSUED)).thenReturn(new BigDecimal("500000"));
        when(invoiceRepository.sumTotalByProjectIdAndType(projectId, InvoiceType.RECEIVED)).thenReturn(new BigDecimal("300000"));
        when(invoiceRepository.countOverdueByProjectId(projectId)).thenReturn(2L);
        when(invoiceRepository.sumOverdueAmountByProjectId(projectId)).thenReturn(new BigDecimal("50000"));

        InvoiceSummaryResponse summary = invoiceService.getProjectInvoiceSummary(projectId);

        assertThat(summary.totalInvoices()).isEqualTo(10L);
        assertThat(summary.totalIssued()).isEqualByComparingTo(new BigDecimal("500000"));
        assertThat(summary.overdueCount()).isEqualTo(2L);
    }
}
