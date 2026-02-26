package com.privod.platform.modules.estimate.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.estimate.domain.CalculationMethod;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import com.privod.platform.modules.estimate.repository.LocalEstimateLineRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateRepository;
import com.privod.platform.modules.estimate.repository.MinstroyIndexImportRepository;
import com.privod.platform.modules.estimate.repository.NormativeSectionRepository;
import com.privod.platform.modules.estimate.repository.RateResourceItemRepository;
import com.privod.platform.modules.estimate.web.dto.ApplyMinstroyIndicesRequest;
import com.privod.platform.modules.estimate.web.dto.ImportMinstroyIndicesRequest;
import com.privod.platform.modules.integration.pricing.domain.PriceIndex;
import com.privod.platform.modules.integration.pricing.repository.PriceIndexRepository;
import com.privod.platform.modules.integration.pricing.repository.PriceRateRepository;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalEstimateServiceTest {

    @Mock
    private LocalEstimateRepository estimateRepository;
    @Mock
    private LocalEstimateLineRepository lineRepository;
    @Mock
    private NormativeSectionRepository sectionRepository;
    @Mock
    private RateResourceItemRepository resourceItemRepository;
    @Mock
    private MinstroyIndexImportRepository importRepository;
    @Mock
    private PriceRateRepository priceRateRepository;
    @Mock
    private PriceIndexRepository priceIndexRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private LocalEstimateService localEstimateService;

    private UUID estimateId;
    private LocalEstimate estimate;
    private LocalEstimateLine line;

    @BeforeEach
    void setUp() {
        estimateId = UUID.randomUUID();
        estimate = LocalEstimate.builder()
                .organizationId(UUID.randomUUID())
                .name("ЛС-1")
                .calculationMethod(CalculationMethod.RIM)
                .region("Москва")
                .priceLevelQuarter("2026-Q1")
                .status(LocalEstimateStatus.DRAFT)
                .totalDirectCost(BigDecimal.ZERO)
                .totalOverhead(BigDecimal.ZERO)
                .totalEstimatedProfit(BigDecimal.ZERO)
                .totalWithVat(BigDecimal.ZERO)
                .vatRate(new BigDecimal("20.00"))
                .build();
        estimate.setId(estimateId);
        estimate.setCreatedAt(Instant.now());

        line = LocalEstimateLine.builder()
                .estimateId(estimateId)
                .lineNumber(1)
                .name("Монтаж")
                .quantity(new BigDecimal("10"))
                .baseLaborCost(new BigDecimal("100"))
                .baseMaterialCost(new BigDecimal("50"))
                .baseEquipmentCost(new BigDecimal("20"))
                .baseOverheadCost(new BigDecimal("30"))
                .build();
        line.setId(UUID.randomUUID());
    }

    @Nested
    @DisplayName("RIM calculation")
    class RimCalculationTests {

        @Test
        @DisplayName("Should apply fallback index from quarter when regional match is missing")
        void shouldApplyFallbackIndexFromQuarter() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(estimate));
            when(lineRepository.findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(estimateId))
                    .thenReturn(List.of(line));
            when(priceIndexRepository.findByRegionAndWorkTypeAndTargetQuarter("Москва", "СМР", "2026-Q1"))
                    .thenReturn(Optional.empty());
            when(priceIndexRepository.findByRegionAndWorkTypeAndTargetQuarter("Москва", "Материалы", "2026-Q1"))
                    .thenReturn(Optional.empty());
            when(priceIndexRepository.findByRegionAndWorkTypeAndTargetQuarter("Москва", "Машины", "2026-Q1"))
                    .thenReturn(Optional.empty());

            PriceIndex fallback = PriceIndex.builder()
                    .region("СПб")
                    .workType("СМР")
                    .baseQuarter("2026-Q1")
                    .targetQuarter("2026-Q1")
                    .indexValue(new BigDecimal("1.1500"))
                    .build();
            when(priceIndexRepository.findByTargetQuarter("2026-Q1")).thenReturn(List.of(fallback));
            when(lineRepository.save(any(LocalEstimateLine.class))).thenAnswer(inv -> inv.getArgument(0));
            when(estimateRepository.save(any(LocalEstimate.class))).thenAnswer(inv -> inv.getArgument(0));

            var response = localEstimateService.calculateEstimate(estimateId);

            assertThat(response.status()).isEqualTo(LocalEstimateStatus.CALCULATED);
            assertThat(response.lines()).hasSize(1);
            assertThat(response.lines().get(0).laborIndex()).isEqualByComparingTo(new BigDecimal("1.1500"));
            assertThat(response.lines().get(0).currentTotal()).isGreaterThan(BigDecimal.ZERO);
            verify(lineRepository, times(1)).save(any(LocalEstimateLine.class));
            verify(estimateRepository, times(1)).save(any(LocalEstimate.class));
        }

        @Test
        @DisplayName("Should throw when estimate does not exist")
        void shouldThrowWhenEstimateNotFound() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> localEstimateService.calculateEstimate(estimateId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Локальная смета не найдена");
        }
    }

    @Nested
    @DisplayName("Minstroy flow")
    class MinstroyFlowTests {

        @Test
        @DisplayName("Should skip duplicates during index import")
        void shouldSkipDuplicatesDuringImport() {
            ImportMinstroyIndicesRequest request = new ImportMinstroyIndicesRequest(
                    "2026-Q1",
                    "manual",
                    List.of(
                            new ImportMinstroyIndicesRequest.IndexEntry("Москва", "СМР", "2026-Q1", new BigDecimal("1.12")),
                            new ImportMinstroyIndicesRequest.IndexEntry("Москва", "Материалы", "2026-Q1", new BigDecimal("1.07"))
                    )
            );

            when(priceIndexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    "Москва", "СМР", "2026-Q1", "2026-Q1"
            )).thenReturn(false);
            when(priceIndexRepository.existsByRegionAndWorkTypeAndBaseQuarterAndTargetQuarterAndDeletedFalse(
                    "Москва", "Материалы", "2026-Q1", "2026-Q1"
            )).thenReturn(true);
            when(priceIndexRepository.save(any(PriceIndex.class))).thenAnswer(inv -> inv.getArgument(0));
            when(importRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            int imported = localEstimateService.importMinstroyIndices(request);
            assertThat(imported).isEqualTo(1);
            verify(priceIndexRepository, times(1)).save(any(PriceIndex.class));
        }

        @Test
        @DisplayName("Should apply selected Minstroy indices to estimate lines")
        void shouldApplySelectedIndices() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(estimate));
            when(lineRepository.findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(estimateId))
                    .thenReturn(List.of(line));
            when(lineRepository.save(any(LocalEstimateLine.class))).thenAnswer(inv -> inv.getArgument(0));
            when(estimateRepository.save(any(LocalEstimate.class))).thenAnswer(inv -> inv.getArgument(0));

            ApplyMinstroyIndicesRequest request = new ApplyMinstroyIndicesRequest(
                    List.of(new ApplyMinstroyIndicesRequest.IndexItem("Москва", 1, 2026, "construction", 1.21))
            );

            var response = localEstimateService.applyMinstroyIndices(estimateId, request);

            assertThat(response.appliedIndices()).isEqualTo(1);
            assertThat(response.items()).hasSize(1);
            assertThat(response.items().get(0).newPrice()).isGreaterThan(response.items().get(0).oldPrice());
            verify(lineRepository, times(1)).save(any(LocalEstimateLine.class));
        }
    }
}
