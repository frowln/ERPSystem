package com.privod.platform.modules.legal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.CaseType;
import com.privod.platform.modules.legal.domain.DecisionType;
import com.privod.platform.modules.legal.domain.LegalCase;
import com.privod.platform.modules.legal.domain.LegalDecision;
import com.privod.platform.modules.legal.domain.LegalRemark;
import com.privod.platform.modules.legal.domain.RemarkType;
import com.privod.platform.modules.legal.repository.ContractLegalTemplateRepository;
import com.privod.platform.modules.legal.repository.LegalCaseRepository;
import com.privod.platform.modules.legal.repository.LegalDecisionRepository;
import com.privod.platform.modules.legal.repository.LegalRemarkRepository;
import com.privod.platform.modules.legal.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalDecisionRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalRemarkRequest;
import com.privod.platform.modules.legal.web.dto.LegalCaseResponse;
import com.privod.platform.modules.legal.web.dto.LegalDashboardResponse;
import com.privod.platform.modules.legal.web.dto.LegalDecisionResponse;
import com.privod.platform.modules.legal.web.dto.LegalRemarkResponse;
import com.privod.platform.modules.legal.web.dto.UpdateLegalCaseRequest;
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
class LegalServiceTest {

    @Mock
    private LegalCaseRepository caseRepository;

    @Mock
    private LegalDecisionRepository decisionRepository;

    @Mock
    private LegalRemarkRepository remarkRepository;

    @Mock
    private ContractLegalTemplateRepository templateRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private LegalService legalService;

    private UUID caseId;
    private UUID projectId;
    private UUID lawyerId;
    private LegalCase testCase;

    @BeforeEach
    void setUp() {
        caseId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        lawyerId = UUID.randomUUID();

        testCase = LegalCase.builder()
                .caseNumber("LC-001")
                .projectId(projectId)
                .title("Претензия по срокам")
                .description("Нарушение сроков выполнения работ")
                .caseType(CaseType.CLAIM)
                .status(CaseStatus.OPEN)
                .amount(new BigDecimal("5000000.00"))
                .currency("RUB")
                .lawyerId(lawyerId)
                .courtName("Арбитражный суд г. Москвы")
                .filingDate(LocalDate.of(2025, 3, 1))
                .hearingDate(LocalDate.now().plusDays(14))
                .build();
        testCase.setId(caseId);
        testCase.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Case")
    class CreateCaseTests {

        @Test
        @DisplayName("Should create legal case with OPEN status")
        void shouldCreateCase_whenValidInput() {
            CreateLegalCaseRequest request = new CreateLegalCaseRequest(
                    "LC-002", projectId, null, "Новое дело", "Описание",
                    CaseType.DISPUTE, new BigDecimal("1000000.00"), null,
                    UUID.randomUUID(), lawyerId, "Арбитражный суд",
                    LocalDate.now(), LocalDate.now().plusDays(30));

            when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> {
                LegalCase c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            LegalCaseResponse response = legalService.createCase(request);

            assertThat(response.status()).isEqualTo(CaseStatus.OPEN);
            assertThat(response.caseType()).isEqualTo(CaseType.DISPUTE);
            assertThat(response.title()).isEqualTo("Новое дело");
            assertThat(response.currency()).isEqualTo("RUB");
            verify(auditService).logCreate(eq("LegalCase"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default currency to RUB when null")
        void shouldDefaultCurrency_whenNull() {
            CreateLegalCaseRequest request = new CreateLegalCaseRequest(
                    "LC-003", projectId, null, "Дело без валюты", null,
                    CaseType.ARBITRATION, null, null,
                    null, null, null, null, null);

            when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> {
                LegalCase c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            LegalCaseResponse response = legalService.createCase(request);

            assertThat(response.currency()).isEqualTo("RUB");
        }
    }

    @Nested
    @DisplayName("Update Case Status")
    class UpdateCaseStatusTests {

        @Test
        @DisplayName("Should update case status and log change")
        void shouldUpdateStatus_whenValid() {
            when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
            when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateLegalCaseRequest request = new UpdateLegalCaseRequest(
                    null, null, null, null, null, null,
                    CaseStatus.IN_PROGRESS, null, null, null, null,
                    null, null, null, null, null);

            LegalCaseResponse response = legalService.updateCase(caseId, request);

            assertThat(response.status()).isEqualTo(CaseStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("LegalCase", caseId, "OPEN", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should throw when case not found")
        void shouldThrowException_whenCaseNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(caseRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> legalService.getCase(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Юридическое дело не найдено");
        }

        @Test
        @DisplayName("Should update multiple fields at once")
        void shouldUpdateMultipleFields_whenProvided() {
            when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
            when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateLegalCaseRequest request = new UpdateLegalCaseRequest(
                    null, null, null, "Обновлённый заголовок", null, null,
                    null, new BigDecimal("7500000.00"), "USD", null, null,
                    null, null, null, null, null);

            LegalCaseResponse response = legalService.updateCase(caseId, request);

            assertThat(response.title()).isEqualTo("Обновлённый заголовок");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("7500000.00"));
            assertThat(response.currency()).isEqualTo("USD");
        }
    }

    @Nested
    @DisplayName("Add Decision")
    class AddDecisionTests {

        @Test
        @DisplayName("Should create decision for existing case")
        void shouldCreateDecision_whenCaseExists() {
            CreateLegalDecisionRequest request = new CreateLegalDecisionRequest(
                    caseId, LocalDate.now(), DecisionType.RULING,
                    "Требования удовлетворены полностью",
                    new BigDecimal("5000000.00"), true,
                    LocalDate.now().plusMonths(3), null);

            when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
            when(decisionRepository.save(any(LegalDecision.class))).thenAnswer(inv -> {
                LegalDecision d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            LegalDecisionResponse response = legalService.createDecision(request);

            assertThat(response.decisionType()).isEqualTo(DecisionType.RULING);
            assertThat(response.enforceable()).isTrue();
            assertThat(response.caseId()).isEqualTo(caseId);
            verify(auditService).logCreate(eq("LegalDecision"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when creating decision for non-existent case")
        void shouldThrowException_whenCaseDoesNotExist() {
            UUID nonExistentCaseId = UUID.randomUUID();
            CreateLegalDecisionRequest request = new CreateLegalDecisionRequest(
                    nonExistentCaseId, LocalDate.now(), DecisionType.SETTLEMENT,
                    "summary", null, null, null, null);

            when(caseRepository.findById(nonExistentCaseId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> legalService.createDecision(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Юридическое дело не найдено");
        }
    }

    @Nested
    @DisplayName("Add Remark")
    class AddRemarkTests {

        @Test
        @DisplayName("Should create remark with default date and non-confidential")
        void shouldCreateRemark_whenValidInput() {
            UUID authorId = UUID.randomUUID();
            CreateLegalRemarkRequest request = new CreateLegalRemarkRequest(
                    caseId, authorId, null, "Важное замечание по делу",
                    RemarkType.LAWYER_OPINION, null);

            when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
            when(remarkRepository.save(any(LegalRemark.class))).thenAnswer(inv -> {
                LegalRemark r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            LegalRemarkResponse response = legalService.createRemark(request);

            assertThat(response.remarkType()).isEqualTo(RemarkType.LAWYER_OPINION);
            assertThat(response.confidential()).isFalse();
            assertThat(response.remarkDate()).isEqualTo(LocalDate.now());
            verify(auditService).logCreate(eq("LegalRemark"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Dashboard and Hearings")
    class DashboardTests {

        @Test
        @DisplayName("Should compute dashboard stats with correct open/closed counts")
        void shouldReturnDashboard_whenDataPresent() {
            List<Object[]> statusData = List.of(
                    new Object[]{CaseStatus.OPEN, 5L},
                    new Object[]{CaseStatus.IN_PROGRESS, 3L},
                    new Object[]{CaseStatus.CLOSED, 2L},
                    new Object[]{CaseStatus.WON, 1L}
            );

            when(caseRepository.countByStatus()).thenReturn(statusData);
            when(caseRepository.sumActiveClaimsAmount()).thenReturn(new BigDecimal("10000000.00"));

            LegalDashboardResponse dashboard = legalService.getDashboard();

            assertThat(dashboard.totalCases()).isEqualTo(11);
            assertThat(dashboard.openCases()).isEqualTo(8);
            assertThat(dashboard.closedCases()).isEqualTo(3);
            assertThat(dashboard.totalActiveClaimsAmount()).isEqualByComparingTo(new BigDecimal("10000000.00"));
        }

        @Test
        @DisplayName("Should return zero active amount when null from repository")
        void shouldReturnZeroAmount_whenNullFromRepository() {
            when(caseRepository.countByStatus()).thenReturn(List.of());
            when(caseRepository.sumActiveClaimsAmount()).thenReturn(null);

            LegalDashboardResponse dashboard = legalService.getDashboard();

            assertThat(dashboard.totalActiveClaimsAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(dashboard.totalCases()).isZero();
        }

        @Test
        @DisplayName("Should return upcoming hearings within given days")
        void shouldReturnUpcomingHearings_whenWithinRange() {
            LegalCase hearingCase = LegalCase.builder()
                    .caseNumber("LC-010")
                    .title("Дело со слушанием")
                    .caseType(CaseType.LAWSUIT)
                    .status(CaseStatus.HEARING)
                    .hearingDate(LocalDate.now().plusDays(5))
                    .build();
            hearingCase.setId(UUID.randomUUID());
            hearingCase.setCreatedAt(Instant.now());

            when(caseRepository.findUpcomingHearings(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(hearingCase));

            List<LegalCaseResponse> result = legalService.getUpcomingHearings(7);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).caseNumber()).isEqualTo("LC-010");
        }
    }
}
