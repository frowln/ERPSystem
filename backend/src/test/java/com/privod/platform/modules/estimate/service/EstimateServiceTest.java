package com.privod.platform.modules.estimate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.domain.EstimateStatus;
import com.privod.platform.modules.estimate.domain.EstimateVersion;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.estimate.repository.EstimateVersionRepository;
import com.privod.platform.modules.estimate.web.dto.ChangeEstimateStatusRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.EstimateFinancialSummaryResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateItemResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateResponse;
import com.privod.platform.modules.estimate.web.dto.UpdateEstimateRequest;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
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
    private Estimate testEstimate;

    @BeforeEach
    void setUp() {
        estimateId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testEstimate = Estimate.builder()
                .name("Смета-001")
                .projectId(projectId)
                .status(EstimateStatus.DRAFT)
                .totalAmount(new BigDecimal("1000000"))
                .orderedAmount(new BigDecimal("500000"))
                .invoicedAmount(new BigDecimal("300000"))
                .totalSpent(new BigDecimal("500000"))
                .build();
        testEstimate.setId(estimateId);
        testEstimate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Estimate")
    class CreateEstimateTests {

        @Test
        @DisplayName("Should create estimate with DRAFT status and zero amounts")
        void shouldCreateEstimate_whenValidInput() {
            CreateEstimateRequest request = new CreateEstimateRequest(
                    "Новая смета", projectId, UUID.randomUUID(), null, "Заметки");

            when(estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(any())).thenReturn(Optional.empty());
            when(estimateVersionRepository.countByEstimateId(any())).thenReturn(0L);
            when(estimateVersionRepository.save(any(EstimateVersion.class))).thenAnswer(inv -> {
                EstimateVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });
            when(estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(any()))
                    .thenReturn(Collections.emptyList());
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> {
                Estimate e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            EstimateResponse response = estimateService.createEstimate(request);

            assertThat(response.status()).isEqualTo(EstimateStatus.DRAFT);
            assertThat(response.totalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(auditService).logCreate(eq("Estimate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Estimate")
    class GetEstimateTests {

        @Test
        @DisplayName("Should find estimate by ID")
        void shouldReturnEstimate_whenExists() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId))
                    .thenReturn(Collections.emptyList());

            EstimateResponse response = estimateService.getEstimate(estimateId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Смета-001");
        }

        @Test
        @DisplayName("Should throw when estimate not found")
        void shouldThrowException_whenEstimateNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(estimateRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> estimateService.getEstimate(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Смета не найдена");
        }
    }

    @Nested
    @DisplayName("Update Estimate")
    class UpdateEstimateTests {

        @Test
        @DisplayName("Should update estimate name and notes")
        void shouldUpdateEstimate_whenValidInput() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateEstimateRequest request = new UpdateEstimateRequest(
                    "Обновлённая смета", null, "Новые заметки");

            EstimateResponse response = estimateService.updateEstimate(estimateId, request);

            assertThat(testEstimate.getName()).isEqualTo("Обновлённая смета");
            assertThat(testEstimate.getNotes()).isEqualTo("Новые заметки");
            verify(auditService).logUpdate("Estimate", estimateId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            ChangeEstimateStatusRequest request = new ChangeEstimateStatusRequest(EstimateStatus.ACTIVE);

            assertThatThrownBy(() -> estimateService.changeStatus(estimateId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести смету");
        }

        @Test
        @DisplayName("Should reject approve when not in proper status")
        void shouldThrowException_whenApproveNotAllowed() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            assertThatThrownBy(() -> estimateService.approveEstimate(estimateId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Смета не может быть утверждена");
        }

        @Test
        @DisplayName("Should reject activate when not in proper status")
        void shouldThrowException_whenActivateNotAllowed() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            assertThatThrownBy(() -> estimateService.activateEstimate(estimateId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Смета не может быть активирована");
        }
    }

    @Nested
    @DisplayName("Estimate Item Management")
    class EstimateItemTests {

        @Test
        @DisplayName("Should add item and recalculate totals")
        void shouldAddItemAndRecalculate_whenValidInput() {
            CreateEstimateItemRequest request = new CreateEstimateItemRequest(
                    null, null, "Бетон М300", new BigDecimal("50"),
                    "м3", new BigDecimal("5000"), null, "Заметки");

            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateItemRepository.countByEstimateIdAndDeletedFalse(estimateId)).thenReturn(0L);
            when(estimateItemRepository.save(any(EstimateItem.class))).thenAnswer(inv -> {
                EstimateItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(estimateItemRepository.sumAmountByEstimateId(estimateId)).thenReturn(new BigDecimal("250000"));
            when(estimateItemRepository.sumOrderedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateItemRepository.sumInvoicedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> inv.getArgument(0));

            EstimateItemResponse response = estimateService.addItem(estimateId, request);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Бетон М300");
            verify(auditService).logCreate(eq("EstimateItem"), any(UUID.class));
        }

        @Test
        @DisplayName("Should remove item and recalculate totals")
        void shouldRemoveItemAndRecalculate_whenExists() {
            UUID itemId = UUID.randomUUID();
            EstimateItem item = EstimateItem.builder()
                    .estimateId(estimateId)
                    .name("Позиция")
                    .build();
            item.setId(itemId);
            item.setCreatedAt(Instant.now());

            when(estimateItemRepository.findById(itemId)).thenReturn(Optional.of(item));
            when(estimateItemRepository.save(any(EstimateItem.class))).thenAnswer(inv -> inv.getArgument(0));
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));
            when(estimateItemRepository.sumAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateItemRepository.sumOrderedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateItemRepository.sumInvoicedAmountByEstimateId(estimateId)).thenReturn(BigDecimal.ZERO);
            when(estimateRepository.save(any(Estimate.class))).thenAnswer(inv -> inv.getArgument(0));

            estimateService.removeItem(itemId);

            assertThat(item.isDeleted()).isTrue();
            verify(auditService).logDelete("EstimateItem", itemId);
        }
    }

    @Nested
    @DisplayName("Financial Summary")
    class FinancialSummaryTests {

        @Test
        @DisplayName("Should return financial summary for estimate")
        void shouldReturnFinancialSummary_whenEstimateExists() {
            when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(testEstimate));

            EstimateFinancialSummaryResponse summary = estimateService.getFinancialSummary(estimateId);

            assertThat(summary.totalAmount()).isEqualByComparingTo(new BigDecimal("1000000"));
            assertThat(summary.orderedAmount()).isEqualByComparingTo(new BigDecimal("500000"));
            assertThat(summary.invoicedAmount()).isEqualByComparingTo(new BigDecimal("300000"));
        }

        @Test
        @DisplayName("Should return aggregated project estimate summary")
        void shouldReturnProjectSummary_whenEstimatesExist() {
            Estimate e1 = Estimate.builder()
                    .totalAmount(new BigDecimal("1000000"))
                    .orderedAmount(new BigDecimal("500000"))
                    .invoicedAmount(new BigDecimal("300000"))
                    .totalSpent(new BigDecimal("500000"))
                    .build();
            Estimate e2 = Estimate.builder()
                    .totalAmount(new BigDecimal("2000000"))
                    .orderedAmount(new BigDecimal("1000000"))
                    .invoicedAmount(new BigDecimal("600000"))
                    .totalSpent(new BigDecimal("1000000"))
                    .build();

            when(estimateRepository.findByProjectIdAndDeletedFalse(projectId))
                    .thenReturn(List.of(e1, e2));

            EstimateFinancialSummaryResponse summary = estimateService.getProjectEstimateSummary(projectId);

            assertThat(summary.totalAmount()).isEqualByComparingTo(new BigDecimal("3000000"));
            assertThat(summary.orderedAmount()).isEqualByComparingTo(new BigDecimal("1500000"));
            assertThat(summary.balance()).isEqualByComparingTo(new BigDecimal("1500000"));
        }
    }
}
