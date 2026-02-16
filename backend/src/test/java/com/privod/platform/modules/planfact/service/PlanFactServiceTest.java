package com.privod.platform.modules.planfact.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planfact.domain.PlanFactCategory;
import com.privod.platform.modules.planfact.domain.PlanFactLine;
import com.privod.platform.modules.planfact.repository.PlanFactLineRepository;
import com.privod.platform.modules.planfact.web.dto.PlanFactLineResponse;
import com.privod.platform.modules.planfact.web.dto.PlanFactSummaryResponse;
import com.privod.platform.modules.planfact.web.dto.UpdatePlanFactLineRequest;
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
import java.util.Collections;
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
class PlanFactServiceTest {

    @Mock
    private PlanFactLineRepository planFactLineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PlanFactService planFactService;

    private UUID projectId;
    private UUID lineId;
    private PlanFactLine testLine;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        lineId = UUID.randomUUID();

        testLine = PlanFactLine.builder()
                .projectId(projectId)
                .sequence(0)
                .category(PlanFactCategory.values()[0])
                .planAmount(new BigDecimal("1000000.00"))
                .factAmount(new BigDecimal("800000.00"))
                .build();
        testLine.setId(lineId);
        testLine.setCreatedAt(Instant.now());
        testLine.computeVariance();
    }

    @Nested
    @DisplayName("Get Project Plan-Fact")
    class GetProjectPlanFactTests {

        @Test
        @DisplayName("Should return plan-fact lines for project")
        void shouldReturnPlanFactLines_whenProjectExists() {
            when(planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId))
                    .thenReturn(List.of(testLine));

            List<PlanFactLineResponse> result = planFactService.getProjectPlanFact(projectId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).projectId()).isEqualTo(projectId);
        }

        @Test
        @DisplayName("Should return empty list when no lines exist")
        void shouldReturnEmptyList_whenNoLinesExist() {
            when(planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId))
                    .thenReturn(Collections.emptyList());

            List<PlanFactLineResponse> result = planFactService.getProjectPlanFact(projectId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Generate Plan-Fact Lines")
    class GeneratePlanFactLinesTests {

        @Test
        @DisplayName("Should skip generation when lines already exist")
        void shouldSkipGeneration_whenLinesExist() {
            when(planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId))
                    .thenReturn(List.of(testLine));

            List<PlanFactLineResponse> result = planFactService.generatePlanFactLines(projectId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should generate lines for all categories when none exist")
        void shouldGenerateLines_whenNoneExist() {
            when(planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId))
                    .thenReturn(Collections.emptyList())
                    .thenReturn(List.of(testLine));

            when(planFactLineRepository.save(any(PlanFactLine.class))).thenAnswer(inv -> {
                PlanFactLine line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            List<PlanFactLineResponse> result = planFactService.generatePlanFactLines(projectId);

            verify(auditService).logCreate("PlanFact", projectId);
        }
    }

    @Nested
    @DisplayName("Update Plan-Fact Line")
    class UpdatePlanFactLineTests {

        @Test
        @DisplayName("Should update plan and fact amounts")
        void shouldUpdateAmounts_whenValidInput() {
            when(planFactLineRepository.findById(lineId)).thenReturn(Optional.of(testLine));
            when(planFactLineRepository.save(any(PlanFactLine.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdatePlanFactLineRequest request = new UpdatePlanFactLineRequest(
                    new BigDecimal("1500000"), new BigDecimal("1200000"), "Обновлённые заметки");

            PlanFactLineResponse response = planFactService.updateLine(lineId, request);

            assertThat(testLine.getPlanAmount()).isEqualByComparingTo(new BigDecimal("1500000"));
            assertThat(testLine.getFactAmount()).isEqualByComparingTo(new BigDecimal("1200000"));
            verify(auditService).logUpdate("PlanFactLine", lineId, "amounts", null, null);
        }

        @Test
        @DisplayName("Should update only notes when amounts are null")
        void shouldUpdateOnlyNotes_whenAmountsAreNull() {
            when(planFactLineRepository.findById(lineId)).thenReturn(Optional.of(testLine));
            when(planFactLineRepository.save(any(PlanFactLine.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdatePlanFactLineRequest request = new UpdatePlanFactLineRequest(null, null, "Только заметки");

            planFactService.updateLine(lineId, request);

            assertThat(testLine.getNotes()).isEqualTo("Только заметки");
            assertThat(testLine.getPlanAmount()).isEqualByComparingTo(new BigDecimal("1000000.00"));
        }

        @Test
        @DisplayName("Should throw when line not found")
        void shouldThrowException_whenLineNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(planFactLineRepository.findById(nonExistent)).thenReturn(Optional.empty());

            UpdatePlanFactLineRequest request = new UpdatePlanFactLineRequest(
                    BigDecimal.ZERO, BigDecimal.ZERO, null);

            assertThatThrownBy(() -> planFactService.updateLine(nonExistent, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Строка план-факта не найдена");
        }

        @Test
        @DisplayName("Should throw when line is soft deleted")
        void shouldThrowException_whenLineIsDeleted() {
            testLine.softDelete();
            when(planFactLineRepository.findById(lineId)).thenReturn(Optional.of(testLine));

            UpdatePlanFactLineRequest request = new UpdatePlanFactLineRequest(
                    BigDecimal.ZERO, BigDecimal.ZERO, null);

            assertThatThrownBy(() -> planFactService.updateLine(lineId, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Project Summary")
    class GetProjectSummaryTests {

        @Test
        @DisplayName("Should calculate summary correctly")
        void shouldCalculateSummary_whenDataExists() {
            BigDecimal planRevenue = new BigDecimal("5000000");
            BigDecimal factRevenue = new BigDecimal("4500000");
            BigDecimal planCost = new BigDecimal("3000000");
            BigDecimal factCost = new BigDecimal("3200000");

            when(planFactLineRepository.sumPlanRevenue(projectId)).thenReturn(planRevenue);
            when(planFactLineRepository.sumFactRevenue(projectId)).thenReturn(factRevenue);
            when(planFactLineRepository.sumPlanCost(projectId)).thenReturn(planCost);
            when(planFactLineRepository.sumFactCost(projectId)).thenReturn(factCost);

            PlanFactSummaryResponse summary = planFactService.getProjectSummary(projectId);

            assertThat(summary.planRevenue()).isEqualByComparingTo(planRevenue);
            assertThat(summary.factRevenue()).isEqualByComparingTo(factRevenue);
            assertThat(summary.revenueVariance()).isEqualByComparingTo(new BigDecimal("-500000"));
            assertThat(summary.planMargin()).isEqualByComparingTo(new BigDecimal("2000000"));
            assertThat(summary.factMargin()).isEqualByComparingTo(new BigDecimal("1300000"));
        }
    }
}
