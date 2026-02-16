package com.privod.platform.modules.quality;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.ToleranceCategory;
import com.privod.platform.modules.quality.domain.ToleranceCheck;
import com.privod.platform.modules.quality.domain.ToleranceCheckStatus;
import com.privod.platform.modules.quality.domain.ToleranceRule;
import com.privod.platform.modules.quality.repository.ToleranceCheckRepository;
import com.privod.platform.modules.quality.repository.ToleranceRuleRepository;
import com.privod.platform.modules.quality.service.ToleranceService;
import com.privod.platform.modules.quality.web.dto.CreateToleranceCheckRequest;
import com.privod.platform.modules.quality.web.dto.CreateToleranceRuleRequest;
import com.privod.platform.modules.quality.web.dto.ToleranceCheckResponse;
import com.privod.platform.modules.quality.web.dto.ToleranceRuleResponse;
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
import java.time.LocalDateTime;
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
class ToleranceServiceTest {

    @Mock
    private ToleranceRuleRepository ruleRepository;

    @Mock
    private ToleranceCheckRepository checkRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ToleranceService toleranceService;

    private UUID ruleId;
    private UUID checkId;
    private UUID projectId;
    private ToleranceRule testRule;

    @BeforeEach
    void setUp() {
        ruleId = UUID.randomUUID();
        checkId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testRule = ToleranceRule.builder()
                .name("Толщина стены")
                .code("DIM-001")
                .category(ToleranceCategory.DIMENSIONAL)
                .parameterName("Толщина несущей стены")
                .nominalValue(new BigDecimal("200.0000"))
                .minValue(new BigDecimal("195.0000"))
                .maxValue(new BigDecimal("205.0000"))
                .unit("мм")
                .standardReference("СП 70.13330.2012")
                .isActive(true)
                .build();
        testRule.setId(ruleId);
        testRule.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Rule")
    class CreateRuleTests {

        @Test
        @DisplayName("Should create tolerance rule with isActive = true")
        void createRule_SetsActiveTrue() {
            CreateToleranceRuleRequest request = new CreateToleranceRuleRequest(
                    "Высота этажа", "DIM-002", ToleranceCategory.STRUCTURAL,
                    "Высота от пола до потолка",
                    new BigDecimal("3000.0000"), new BigDecimal("2990.0000"),
                    new BigDecimal("3010.0000"), "мм", "СП 70.13330.2012"
            );

            when(ruleRepository.save(any(ToleranceRule.class))).thenAnswer(inv -> {
                ToleranceRule r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            ToleranceRuleResponse response = toleranceService.createRule(request);

            assertThat(response.isActive()).isTrue();
            assertThat(response.name()).isEqualTo("Высота этажа");
            assertThat(response.code()).isEqualTo("DIM-002");
            assertThat(response.category()).isEqualTo(ToleranceCategory.STRUCTURAL);
            assertThat(response.nominalValue()).isEqualByComparingTo(new BigDecimal("3000.0000"));
            verify(auditService).logCreate(eq("ToleranceRule"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Perform Check - Auto-calculates deviation and pass/fail")
    class PerformCheckTests {

        @Test
        @DisplayName("Should PASS when measured value is within tolerance range")
        void performCheck_WithinTolerance_Pass() {
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    ruleId, projectId, "Этаж 3, секция А",
                    new BigDecimal("201.5000"), UUID.randomUUID(), "Стандартное измерение"
            );

            when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ToleranceCheckResponse response = toleranceService.performCheck(request);

            assertThat(response.status()).isEqualTo(ToleranceCheckStatus.PASS);
            assertThat(response.isWithinTolerance()).isTrue();
            assertThat(response.deviation()).isEqualByComparingTo(new BigDecimal("1.5000"));
            verify(auditService).logCreate(eq("ToleranceCheck"), any(UUID.class));
        }

        @Test
        @DisplayName("Should FAIL when measured value is below minimum")
        void performCheck_BelowMin_Fail() {
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    ruleId, projectId, "Этаж 1, секция Б",
                    new BigDecimal("190.0000"), UUID.randomUUID(), null
            );

            when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ToleranceCheckResponse response = toleranceService.performCheck(request);

            assertThat(response.status()).isEqualTo(ToleranceCheckStatus.FAIL);
            assertThat(response.isWithinTolerance()).isFalse();
            assertThat(response.deviation()).isEqualByComparingTo(new BigDecimal("10.0000"));
        }

        @Test
        @DisplayName("Should FAIL when measured value exceeds maximum")
        void performCheck_AboveMax_Fail() {
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    ruleId, projectId, "Этаж 2, секция В",
                    new BigDecimal("210.0000"), UUID.randomUUID(), null
            );

            when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ToleranceCheckResponse response = toleranceService.performCheck(request);

            assertThat(response.status()).isEqualTo(ToleranceCheckStatus.FAIL);
            assertThat(response.isWithinTolerance()).isFalse();
            assertThat(response.deviation()).isEqualByComparingTo(new BigDecimal("10.0000"));
        }

        @Test
        @DisplayName("Should PASS at exact boundary value")
        void performCheck_AtMinBoundary_Pass() {
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    ruleId, projectId, "Этаж 1, секция А",
                    new BigDecimal("195.0000"), UUID.randomUUID(), null
            );

            when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ToleranceCheckResponse response = toleranceService.performCheck(request);

            assertThat(response.status()).isEqualTo(ToleranceCheckStatus.PASS);
            assertThat(response.isWithinTolerance()).isTrue();
        }

        @Test
        @DisplayName("Should throw when rule not found")
        void performCheck_RuleNotFound_Throws() {
            UUID nonExistentRuleId = UUID.randomUUID();
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    nonExistentRuleId, projectId, null,
                    new BigDecimal("200.0000"), null, null
            );

            when(ruleRepository.findById(nonExistentRuleId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> toleranceService.performCheck(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Правило допуска не найдено");
        }
    }

    @Nested
    @DisplayName("Get Failed Checks")
    class GetFailedChecksTests {

        @Test
        @DisplayName("Should return only failed checks for project")
        void getFailedChecks_ReturnsFailedOnly() {
            ToleranceCheck failedCheck = ToleranceCheck.builder()
                    .toleranceRuleId(ruleId)
                    .projectId(projectId)
                    .location("Этаж 5")
                    .measuredValue(new BigDecimal("188.0000"))
                    .isWithinTolerance(false)
                    .deviation(new BigDecimal("12.0000"))
                    .checkedAt(LocalDateTime.now())
                    .status(ToleranceCheckStatus.FAIL)
                    .build();
            failedCheck.setId(UUID.randomUUID());
            failedCheck.setCreatedAt(Instant.now());

            when(checkRepository.findByProjectIdAndIsWithinToleranceFalseAndDeletedFalse(projectId))
                    .thenReturn(List.of(failedCheck));

            List<ToleranceCheckResponse> result = toleranceService.getFailedChecks(projectId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).isWithinTolerance()).isFalse();
            assertThat(result.get(0).status()).isEqualTo(ToleranceCheckStatus.FAIL);
        }
    }

    @Nested
    @DisplayName("Mark For Recheck")
    class MarkForRecheckTests {

        @Test
        @DisplayName("Should mark check as NEEDS_RECHECK")
        void markForRecheck_Success() {
            ToleranceCheck check = ToleranceCheck.builder()
                    .toleranceRuleId(ruleId)
                    .projectId(projectId)
                    .measuredValue(new BigDecimal("190.0000"))
                    .isWithinTolerance(false)
                    .status(ToleranceCheckStatus.FAIL)
                    .build();
            check.setId(checkId);
            check.setCreatedAt(Instant.now());

            when(checkRepository.findById(checkId)).thenReturn(Optional.of(check));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            ToleranceCheckResponse response = toleranceService.markForRecheck(checkId);

            assertThat(response.status()).isEqualTo(ToleranceCheckStatus.NEEDS_RECHECK);
            verify(auditService).logUpdate("ToleranceCheck", checkId, "status", "FAIL", "NEEDS_RECHECK");
        }

        @Test
        @DisplayName("Should throw when check not found")
        void markForRecheck_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(checkRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> toleranceService.markForRecheck(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Проверка допуска не найдена");
        }
    }
}
