package com.privod.platform.modules.accounting;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.accounting.domain.EnsAccount;
import com.privod.platform.modules.accounting.domain.EnsPayment;
import com.privod.platform.modules.accounting.domain.EnsPaymentStatus;
import com.privod.platform.modules.accounting.domain.EnsReconciliation;
import com.privod.platform.modules.accounting.domain.EnsReconciliationStatus;
import com.privod.platform.modules.accounting.domain.EnsTaxType;
import com.privod.platform.modules.accounting.repository.EnsAccountRepository;
import com.privod.platform.modules.accounting.repository.EnsPaymentRepository;
import com.privod.platform.modules.accounting.repository.EnsReconciliationRepository;
import com.privod.platform.modules.accounting.service.EnsService;
import com.privod.platform.modules.accounting.web.dto.CreateEnsPaymentRequest;
import com.privod.platform.modules.accounting.web.dto.EnsAccountResponse;
import com.privod.platform.modules.accounting.web.dto.EnsPaymentResponse;
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
class EnsServiceTest {

    @Mock
    private EnsAccountRepository ensAccountRepository;

    @Mock
    private EnsPaymentRepository ensPaymentRepository;

    @Mock
    private EnsReconciliationRepository ensReconciliationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EnsService ensService;

    private UUID accountId;
    private UUID paymentId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        paymentId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("ENS Account")
    class AccountTests {

        @Test
        @DisplayName("Should create ENS account")
        void createAccount_Success() {
            when(ensAccountRepository.findByInnAndDeletedFalse("7707123456"))
                    .thenReturn(Optional.empty());
            when(ensAccountRepository.save(any(EnsAccount.class))).thenAnswer(inv -> {
                EnsAccount a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            EnsAccountResponse response = ensService.createAccount("7707123456");

            assertThat(response.inn()).isEqualTo("7707123456");
            assertThat(response.balance()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("EnsAccount"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate ENS account by INN")
        void createAccount_DuplicateInn() {
            EnsAccount existing = EnsAccount.builder().inn("7707123456").build();
            existing.setId(accountId);
            when(ensAccountRepository.findByInnAndDeletedFalse("7707123456"))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> ensService.createAccount("7707123456"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }

        @Test
        @DisplayName("Should sync balance from confirmed payments")
        void syncBalance_CalculatesFromPayments() {
            EnsAccount account = EnsAccount.builder()
                    .inn("7707123456").balance(BigDecimal.ZERO).build();
            account.setId(accountId);

            when(ensAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
            when(ensPaymentRepository.sumConfirmedPaymentsByAccount(accountId))
                    .thenReturn(new BigDecimal("1500000.00"));
            when(ensAccountRepository.save(any(EnsAccount.class))).thenAnswer(inv -> inv.getArgument(0));

            EnsAccountResponse response = ensService.syncBalance(accountId);

            assertThat(response.balance()).isEqualByComparingTo(new BigDecimal("1500000.00"));
            assertThat(response.lastSyncAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("ENS Payments")
    class PaymentTests {

        @Test
        @DisplayName("Should create ENS payment with DRAFT status")
        void createPayment_DraftStatus() {
            EnsAccount account = EnsAccount.builder().inn("7707123456").build();
            account.setId(accountId);

            when(ensAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
            when(ensPaymentRepository.save(any(EnsPayment.class))).thenAnswer(inv -> {
                EnsPayment p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            CreateEnsPaymentRequest request = new CreateEnsPaymentRequest(
                    accountId, new BigDecimal("350000.00"),
                    LocalDate.of(2025, 7, 25), EnsTaxType.VAT, null
            );

            EnsPaymentResponse response = ensService.createPayment(request);

            assertThat(response.status()).isEqualTo(EnsPaymentStatus.DRAFT);
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("350000.00"));
            assertThat(response.taxType()).isEqualTo(EnsTaxType.VAT);
            assertThat(response.taxTypeDisplayName()).isEqualTo("НДС");
            verify(auditService).logCreate(eq("EnsPayment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should confirm a DRAFT ENS payment")
        void confirmPayment_FromDraft() {
            EnsPayment payment = EnsPayment.builder()
                    .ensAccountId(accountId)
                    .amount(new BigDecimal("200000.00"))
                    .paymentDate(LocalDate.of(2025, 7, 25))
                    .taxType(EnsTaxType.PROFIT_TAX)
                    .status(EnsPaymentStatus.DRAFT)
                    .build();
            payment.setId(paymentId);
            payment.setCreatedAt(Instant.now());

            when(ensPaymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
            when(ensPaymentRepository.save(any(EnsPayment.class))).thenAnswer(inv -> inv.getArgument(0));

            EnsPaymentResponse response = ensService.confirmPayment(paymentId);

            assertThat(response.status()).isEqualTo(EnsPaymentStatus.CONFIRMED);
            verify(auditService).logStatusChange("EnsPayment", paymentId, "DRAFT", "CONFIRMED");
        }

        @Test
        @DisplayName("Should reject confirming already reconciled payment")
        void confirmPayment_ReconciledRejected() {
            EnsPayment payment = EnsPayment.builder()
                    .ensAccountId(accountId)
                    .amount(new BigDecimal("100000.00"))
                    .paymentDate(LocalDate.now())
                    .taxType(EnsTaxType.INSURANCE)
                    .status(EnsPaymentStatus.RECONCILED)
                    .build();
            payment.setId(paymentId);

            when(ensPaymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> ensService.confirmPayment(paymentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно подтвердить платёж");
        }

        @Test
        @DisplayName("Should throw when payment not found")
        void confirmPayment_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(ensPaymentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ensService.confirmPayment(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Платёж ЕНС не найден");
        }
    }

    @Nested
    @DisplayName("ENS Reconciliation")
    class ReconciliationTests {

        @Test
        @DisplayName("Should create reconciliation with calculated difference")
        void createReconciliation_CalculatesDifference() {
            EnsAccount account = EnsAccount.builder().inn("7707123456").build();
            account.setId(accountId);

            when(ensAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
            when(ensReconciliationRepository.save(any(EnsReconciliation.class))).thenAnswer(inv -> {
                EnsReconciliation r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            UUID periodId = UUID.randomUUID();
            EnsReconciliation result = ensService.createReconciliation(
                    accountId, periodId,
                    new BigDecimal("500000.00"), new BigDecimal("480000.00")
            );

            assertThat(result.getStatus()).isEqualTo(EnsReconciliationStatus.DRAFT);
            assertThat(result.getExpectedAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            assertThat(result.getActualAmount()).isEqualByComparingTo(new BigDecimal("480000.00"));
            assertThat(result.getDifference()).isEqualByComparingTo(new BigDecimal("20000.00"));
            verify(auditService).logCreate(eq("EnsReconciliation"), any(UUID.class));
        }
    }
}
