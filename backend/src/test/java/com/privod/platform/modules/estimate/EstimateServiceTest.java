package com.privod.platform.modules.estimate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.domain.EstimateStatus;
import com.privod.platform.modules.estimate.domain.EstimateVersion;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.estimate.repository.EstimateVersionRepository;
import com.privod.platform.modules.estimate.service.EstimateService;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.CreateFromSpecRequest;
import com.privod.platform.modules.estimate.web.dto.CreateVersionRequest;
import com.privod.platform.modules.estimate.web.dto.EstimateFinancialSummaryResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateItemResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateResponse;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EstimateServiceTest {

    @Mock
    private EstimateRepository estimateRepository;

    @Mock
    private EstimateItemRepository estimateItemRepository;

    @Mock
    private EstimateVersionRepository estimateVersionRepository;

    @Mock
    private SpecificationRepository specificationRepository;

    @Mock
    private SpecItemRepository specItemRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EstimateService estimateService;

    private UUID estimateId;
    private UUID projectId;
    private UUID specId;
    private Estimate testEstimate;

    @BeforeEach
    void setUp() {
        estimateId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        specId = UUID.randomUUID();
        testEstimate = Estimate.builder()
                .name("Смета на фундамент")
                .projectId(projectId)
                .specificationId(specId)
                .status(EstimateStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .orderedAmount(BigDecimal.ZERO)
                .invoicedAmount(BigDecimal.ZERO)
                .totalSpent(BigDecimal.ZERO)
                .build();
        testEstimate.setId(estimateId);
        testEstimate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Estimate")
    class CreateEstimateTests {

        @Test
        @DisplayName("Should create estimate with DRAFT status")
        void createEstimate_Success() {
            CreateEstimateRequest request = new CreateEstimateRequest(
                    "Смета на фундамент", projectId, null, specId, "Notes");

            when(estimateRepository.save(any(Estimate.class))).thenAnswer(invocation -> {
                Estimate e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });
            when(estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(any())).thenReturn(Optional.empty());
            when(estimateVersionRepository.countByEstimateId(any())).thenReturn(0L);
            when(estimateVersionRepository.save(any(EstimateVersion.class))).thenAnswer(inv -> {
                EstimateVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });

            EstimateResponse response = estimateService.createEstimate(request);

            assertThat(response.status()).isEqualTo(EstimateStatus.DRAFT);
            assertThat(response.name()).isEqualTo("Смета на фундамент");
            assertThat(response.totalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("Estimate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Add Item and Recalculate")
    class AddItemTests {

        @Test
        @DisplayName("Should add item and recalculate totals")
        void addItem_RecalculatesTotals() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateItemRepository.countByEstimateIdAndDeletedFalse(estimateId)).thenReturn(0L);
            when(estimateItemRepository.save(any(EstimateItem.class))).thenAnswer(invocation -> {
                EstimateItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(estimateItemRepository.sumAmountByEstimateId(estimateId)).thenReturn(new BigDecimal("500000.00"));
            when(estimateItemRepository.sumOrderedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateItemRepository.sumInvoicedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> inv.getArgument(0));

            CreateEstimateItemRequest request = new CreateEstimateItemRequest(
                    null, "Бетон М300", new BigDecimal("100.000"), "м3",
                    new BigDecimal("5000.00"), null, null, null);

            EstimateItemResponse response = estimateService.addItem(estimateId, request);

            assertThat(response.name()).isEqualTo("Бетон М300");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("500000.00"));
            verify(auditService).logCreate(eq("EstimateItem"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Create From Specification")
    class CreateFromSpecTests {

        @Test
        @DisplayName("Should create estimate from specification with items")
        void createFromSpecification_Success() {
            Specification specification = Specification.builder()
                    .name("SPEC-00001")
                    .projectId(projectId)
                    .status(SpecificationStatus.APPROVED)
                    .build();
            specification.setId(specId);

            SpecItem specItem = SpecItem.builder()
                    .specificationId(specId)
                    .sequence(1)
                    .itemType(SpecItemType.MATERIAL)
                    .name("Бетон М300")
                    .quantity(new BigDecimal("100.000"))
                    .unitOfMeasure("м3")
                    .plannedAmount(new BigDecimal("500000.00"))
                    .build();
            specItem.setId(UUID.randomUUID());

            when(specificationRepository.findById(specId)).thenReturn(Optional.of(specification));
            when(specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId))
                    .thenReturn(List.of(specItem));
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(invocation -> {
                Estimate e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });
            when(estimateItemRepository.save(any(EstimateItem.class))).thenAnswer(invocation -> {
                EstimateItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(any()))
                    .thenReturn(List.of());
            when(estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(any())).thenReturn(Optional.empty());
            when(estimateVersionRepository.countByEstimateId(any())).thenReturn(0L);
            when(estimateVersionRepository.save(any(EstimateVersion.class))).thenAnswer(inv -> {
                EstimateVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });

            CreateFromSpecRequest request = new CreateFromSpecRequest(specId, "Смета из спецификации", null, null);
            EstimateResponse response = estimateService.createFromSpecification(request);

            assertThat(response.status()).isEqualTo(EstimateStatus.DRAFT);
            assertThat(response.projectId()).isEqualTo(projectId);
            assertThat(response.specificationId()).isEqualTo(specId);
            verify(auditService).logCreate(eq("Estimate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Approve Estimate")
    class ApproveEstimateTests {

        @Test
        @DisplayName("Should approve estimate from IN_WORK status")
        void approveEstimate_Success() {
            testEstimate.setStatus(EstimateStatus.IN_WORK);
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> inv.getArgument(0));
            when(estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(estimateId)).thenReturn(Optional.empty());
            when(estimateVersionRepository.countByEstimateId(estimateId)).thenReturn(1L);
            when(estimateVersionRepository.save(any(EstimateVersion.class))).thenAnswer(inv -> {
                EstimateVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });
            when(estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId))
                    .thenReturn(List.of());

            EstimateResponse response = estimateService.approveEstimate(estimateId);

            assertThat(response.status()).isEqualTo(EstimateStatus.APPROVED);
            verify(auditService).logStatusChange("Estimate", estimateId, "IN_WORK", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approval from DRAFT status")
        void approveEstimate_InvalidTransition() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            assertThatThrownBy(() -> estimateService.approveEstimate(estimateId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не может быть утверждена");
        }
    }

    @Nested
    @DisplayName("Financial Summary")
    class FinancialSummaryTests {

        @Test
        @DisplayName("Should return correct financial summary")
        void getFinancialSummary_Success() {
            testEstimate.setTotalAmount(new BigDecimal("1000000.00"));
            testEstimate.setOrderedAmount(new BigDecimal("600000.00"));
            testEstimate.setInvoicedAmount(new BigDecimal("400000.00"));
            testEstimate.setTotalSpent(new BigDecimal("600000.00"));

            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            EstimateFinancialSummaryResponse summary = estimateService.getFinancialSummary(estimateId);

            assertThat(summary.totalAmount()).isEqualByComparingTo(new BigDecimal("1000000.00"));
            assertThat(summary.orderedAmount()).isEqualByComparingTo(new BigDecimal("600000.00"));
            assertThat(summary.invoicedAmount()).isEqualByComparingTo(new BigDecimal("400000.00"));
            assertThat(summary.totalSpent()).isEqualByComparingTo(new BigDecimal("600000.00"));
            assertThat(summary.balance()).isEqualByComparingTo(new BigDecimal("400000.00"));
            assertThat(summary.varianceAmount()).isEqualByComparingTo(new BigDecimal("400000.00"));
            assertThat(summary.variancePercent()).isEqualByComparingTo(new BigDecimal("40.00"));
        }
    }

    @Nested
    @DisplayName("Create Version")
    class CreateVersionTests {

        @Test
        @DisplayName("Should create version snapshot")
        void createVersion_Success() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(estimateId)).thenReturn(Optional.empty());
            when(estimateVersionRepository.countByEstimateId(estimateId)).thenReturn(0L);
            when(estimateVersionRepository.save(any(EstimateVersion.class))).thenAnswer(inv -> {
                EstimateVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });
            when(estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId))
                    .thenReturn(List.of());

            CreateVersionRequest request = new CreateVersionRequest("update", "Обновление цен");

            estimateService.createVersion(estimateId, request);

            verify(estimateVersionRepository).save(any(EstimateVersion.class));
        }
    }
}
