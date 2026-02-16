package com.privod.platform.modules.accounting;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.accounting.domain.AccountEntry;
import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.AccountPlan;
import com.privod.platform.modules.accounting.domain.AccountType;
import com.privod.platform.modules.accounting.domain.PeriodStatus;
import com.privod.platform.modules.accounting.repository.AccountEntryRepository;
import com.privod.platform.modules.accounting.repository.AccountPeriodRepository;
import com.privod.platform.modules.accounting.repository.AccountPlanRepository;
import com.privod.platform.modules.accounting.service.AccountingService;
import com.privod.platform.modules.accounting.web.dto.AccountEntryResponse;
import com.privod.platform.modules.accounting.web.dto.CreateAccountEntryRequest;
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
class AccountingServiceTest {

    @Mock
    private AccountPlanRepository accountPlanRepository;

    @Mock
    private AccountPeriodRepository accountPeriodRepository;

    @Mock
    private AccountEntryRepository accountEntryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AccountingService accountingService;

    private UUID periodId;
    private UUID debitAccountId;
    private UUID creditAccountId;
    private UUID journalId;

    @BeforeEach
    void setUp() {
        periodId = UUID.randomUUID();
        debitAccountId = UUID.randomUUID();
        creditAccountId = UUID.randomUUID();
        journalId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("Account Periods")
    class PeriodTests {

        @Test
        @DisplayName("Should open a new accounting period")
        void openPeriod_Success() {
            when(accountPeriodRepository.findByYearAndMonthAndDeletedFalse(2025, 6))
                    .thenReturn(Optional.empty());
            when(accountPeriodRepository.save(any(AccountPeriod.class))).thenAnswer(inv -> {
                AccountPeriod p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            AccountPeriod result = accountingService.openPeriod(2025, 6);

            assertThat(result.getYear()).isEqualTo(2025);
            assertThat(result.getMonth()).isEqualTo(6);
            assertThat(result.getStatus()).isEqualTo(PeriodStatus.OPEN);
            verify(auditService).logCreate(eq("AccountPeriod"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject opening duplicate period")
        void openPeriod_DuplicateRejected() {
            AccountPeriod existing = AccountPeriod.builder()
                    .year(2025).month(6).status(PeriodStatus.OPEN).build();
            existing.setId(periodId);

            when(accountPeriodRepository.findByYearAndMonthAndDeletedFalse(2025, 6))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> accountingService.openPeriod(2025, 6))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }

        @Test
        @DisplayName("Should close an open period")
        void closePeriod_Success() {
            AccountPeriod period = AccountPeriod.builder()
                    .year(2025).month(5).status(PeriodStatus.OPEN).build();
            period.setId(periodId);

            when(accountPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(accountPeriodRepository.save(any(AccountPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            AccountPeriod result = accountingService.closePeriod(periodId);

            assertThat(result.getStatus()).isEqualTo(PeriodStatus.CLOSED);
            assertThat(result.getClosedAt()).isNotNull();
            verify(auditService).logStatusChange("AccountPeriod", periodId, "OPEN", "CLOSED");
        }

        @Test
        @DisplayName("Should reject closing already closed period")
        void closePeriod_AlreadyClosed() {
            AccountPeriod period = AccountPeriod.builder()
                    .year(2025).month(4).status(PeriodStatus.CLOSED).build();
            period.setId(periodId);

            when(accountPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));

            assertThatThrownBy(() -> accountingService.closePeriod(periodId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("только открытый период");
        }
    }

    @Nested
    @DisplayName("Account Entries")
    class EntryTests {

        @Test
        @DisplayName("Should create account entry in open period")
        void createEntry_InOpenPeriod() {
            AccountPeriod period = AccountPeriod.builder()
                    .year(2025).month(6).status(PeriodStatus.OPEN).build();
            period.setId(periodId);

            AccountPlan debitAccount = AccountPlan.builder()
                    .code("51").name("Расчётные счета").accountType(AccountType.ACTIVE).build();
            debitAccount.setId(debitAccountId);

            AccountPlan creditAccount = AccountPlan.builder()
                    .code("62").name("Покупатели").accountType(AccountType.ACTIVE_PASSIVE).build();
            creditAccount.setId(creditAccountId);

            when(accountPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(accountPlanRepository.findById(debitAccountId)).thenReturn(Optional.of(debitAccount));
            when(accountPlanRepository.findById(creditAccountId)).thenReturn(Optional.of(creditAccount));
            when(accountEntryRepository.save(any(AccountEntry.class))).thenAnswer(inv -> {
                AccountEntry e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            CreateAccountEntryRequest request = new CreateAccountEntryRequest(
                    journalId, debitAccountId, creditAccountId,
                    new BigDecimal("500000.00"), LocalDate.of(2025, 6, 15),
                    "Оплата от покупателя", "INVOICE", UUID.randomUUID(), periodId
            );

            AccountEntryResponse response = accountingService.createEntry(request);

            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            assertThat(response.debitAccountId()).isEqualTo(debitAccountId);
            assertThat(response.creditAccountId()).isEqualTo(creditAccountId);
            verify(auditService).logCreate(eq("AccountEntry"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject entry in closed period")
        void createEntry_ClosedPeriodRejected() {
            AccountPeriod period = AccountPeriod.builder()
                    .year(2025).month(3).status(PeriodStatus.CLOSED).build();
            period.setId(periodId);

            when(accountPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));

            CreateAccountEntryRequest request = new CreateAccountEntryRequest(
                    journalId, debitAccountId, creditAccountId,
                    new BigDecimal("100000.00"), LocalDate.of(2025, 3, 10),
                    "Проводка", null, null, periodId
            );

            assertThatThrownBy(() -> accountingService.createEntry(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("закрытом периоде");
        }

        @Test
        @DisplayName("Should throw when account not found")
        void createEntry_AccountNotFound() {
            AccountPeriod period = AccountPeriod.builder()
                    .year(2025).month(6).status(PeriodStatus.OPEN).build();
            period.setId(periodId);

            when(accountPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(accountPlanRepository.findById(debitAccountId)).thenReturn(Optional.empty());

            CreateAccountEntryRequest request = new CreateAccountEntryRequest(
                    journalId, debitAccountId, creditAccountId,
                    new BigDecimal("100000.00"), LocalDate.of(2025, 6, 10),
                    "Проводка", null, null, periodId
            );

            assertThatThrownBy(() -> accountingService.createEntry(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Счёт не найден");
        }
    }
}
