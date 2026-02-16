package com.privod.platform.modules.contractExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.Tolerance;
import com.privod.platform.modules.contractExt.domain.ToleranceCheck;
import com.privod.platform.modules.contractExt.repository.ToleranceCheckRepository;
import com.privod.platform.modules.contractExt.repository.ToleranceRepository;
import com.privod.platform.modules.contractExt.service.ToleranceService;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceCheckRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceRequest;
import com.privod.platform.modules.contractExt.web.dto.ToleranceCheckResponse;
import com.privod.platform.modules.contractExt.web.dto.ToleranceResponse;
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
    private ToleranceRepository toleranceRepository;

    @Mock
    private ToleranceCheckRepository checkRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ToleranceService toleranceService;

    private UUID projectId;
    private UUID toleranceId;
    private Tolerance testTolerance;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        toleranceId = UUID.randomUUID();

        testTolerance = Tolerance.builder()
                .projectId(projectId)
                .workType("Бетонные работы")
                .parameter("Толщина плиты")
                .nominalValue(new BigDecimal("200.0000"))
                .unit("мм")
                .minDeviation(new BigDecimal("-5.0000"))
                .maxDeviation(new BigDecimal("10.0000"))
                .measurementMethod("Ультразвуковой контроль")
                .referenceStandard("ГОСТ 26633-2015")
                .build();
        testTolerance.setId(toleranceId);
        testTolerance.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Tolerance")
    class CreateToleranceTests {

        @Test
        @DisplayName("Should create tolerance with all parameters")
        void createTolerance_Success() {
            CreateToleranceRequest request = new CreateToleranceRequest(
                    projectId, "Кладочные работы", "Ровность стены",
                    new BigDecimal("0"), "мм/м", new BigDecimal("-3"),
                    new BigDecimal("3"), "Лазерный уровень", "СП 70.13330.2012");

            when(toleranceRepository.save(any(Tolerance.class))).thenAnswer(inv -> {
                Tolerance t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            ToleranceResponse response = toleranceService.create(request);

            assertThat(response.workType()).isEqualTo("Кладочные работы");
            assertThat(response.parameter()).isEqualTo("Ровность стены");
            assertThat(response.referenceStandard()).isEqualTo("СП 70.13330.2012");
            verify(auditService).logCreate(eq("Tolerance"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Tolerance Check")
    class ToleranceCheckTests {

        @Test
        @DisplayName("Should create check within tolerance")
        void createCheck_WithinTolerance() {
            when(toleranceRepository.findById(toleranceId)).thenReturn(Optional.of(testTolerance));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    toleranceId, new BigDecimal("203.0000"),
                    UUID.randomUUID(), "Секция А, этаж 3", "В пределах нормы", null);

            ToleranceCheckResponse response = toleranceService.createCheck(request);

            assertThat(response.isWithinTolerance()).isTrue();
            assertThat(response.measuredValue()).isEqualByComparingTo(new BigDecimal("203.0000"));
            verify(auditService).logCreate(eq("ToleranceCheck"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create check outside tolerance (below min)")
        void createCheck_OutsideTolerance_BelowMin() {
            when(toleranceRepository.findById(toleranceId)).thenReturn(Optional.of(testTolerance));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            // nominal=200, min_dev=-5, so min allowed = 195. Value 190 is below.
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    toleranceId, new BigDecimal("190.0000"),
                    UUID.randomUUID(), "Секция Б", "Ниже допуска", null);

            ToleranceCheckResponse response = toleranceService.createCheck(request);

            assertThat(response.isWithinTolerance()).isFalse();
        }

        @Test
        @DisplayName("Should create check outside tolerance (above max)")
        void createCheck_OutsideTolerance_AboveMax() {
            when(toleranceRepository.findById(toleranceId)).thenReturn(Optional.of(testTolerance));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            // nominal=200, max_dev=10, so max allowed = 210. Value 215 exceeds.
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    toleranceId, new BigDecimal("215.0000"),
                    UUID.randomUUID(), "Секция В", "Выше допуска", null);

            ToleranceCheckResponse response = toleranceService.createCheck(request);

            assertThat(response.isWithinTolerance()).isFalse();
        }

        @Test
        @DisplayName("Should create check at exact boundary (still within tolerance)")
        void createCheck_AtExactBoundary() {
            when(toleranceRepository.findById(toleranceId)).thenReturn(Optional.of(testTolerance));
            when(checkRepository.save(any(ToleranceCheck.class))).thenAnswer(inv -> {
                ToleranceCheck c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            // nominal=200, max_dev=10, so max allowed = 210. Exactly 210 should be within.
            CreateToleranceCheckRequest request = new CreateToleranceCheckRequest(
                    toleranceId, new BigDecimal("210.0000"),
                    UUID.randomUUID(), "Секция А", null, null);

            ToleranceCheckResponse response = toleranceService.createCheck(request);

            assertThat(response.isWithinTolerance()).isTrue();
        }
    }

    @Test
    @DisplayName("Should find tolerance by ID")
    void getById_Success() {
        when(toleranceRepository.findById(toleranceId)).thenReturn(Optional.of(testTolerance));

        ToleranceResponse response = toleranceService.getById(toleranceId);

        assertThat(response).isNotNull();
        assertThat(response.workType()).isEqualTo("Бетонные работы");
        assertThat(response.unit()).isEqualTo("мм");
    }

    @Test
    @DisplayName("Should throw when tolerance not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(toleranceRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> toleranceService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Допуск не найден");
    }
}
