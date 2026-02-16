package com.privod.platform.modules.procurement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.repository.PurchaseRequestItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.procurement.service.ProcurementService;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestDashboardResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestItemResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestResponse;
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
class ProcurementServiceTest {

    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;

    @Mock
    private PurchaseRequestItemRepository purchaseRequestItemRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProcurementService procurementService;

    private UUID requestId;
    private UUID projectId;
    private PurchaseRequest testRequest;

    @BeforeEach
    void setUp() {
        requestId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testRequest = PurchaseRequest.builder()
                .name("ЗП-00001")
                .requestDate(LocalDate.of(2025, 7, 1))
                .projectId(projectId)
                .status(PurchaseRequestStatus.DRAFT)
                .priority(PurchaseRequestPriority.MEDIUM)
                .requestedByName("Иванов И.И.")
                .totalAmount(BigDecimal.ZERO)
                .build();
        testRequest.setId(requestId);
        testRequest.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Purchase Request")
    class CreateTests {

        @Test
        @DisplayName("Should create purchase request with auto-generated name")
        void createRequest_Success() {
            CreatePurchaseRequestRequest request = new CreatePurchaseRequestRequest(
                    LocalDate.of(2025, 7, 1), projectId, null, null,
                    PurchaseRequestPriority.HIGH, null, "Петров П.П.", "Urgent materials");

            when(purchaseRequestRepository.getNextNameSequence()).thenReturn(1L);
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(invocation -> {
                PurchaseRequest pr = invocation.getArgument(0);
                pr.setId(UUID.randomUUID());
                pr.setCreatedAt(Instant.now());
                return pr;
            });

            PurchaseRequestResponse response = procurementService.createRequest(request);

            assertThat(response.status()).isEqualTo(PurchaseRequestStatus.DRAFT);
            assertThat(response.name()).isEqualTo("ЗП-00001");
            assertThat(response.priority()).isEqualTo(PurchaseRequestPriority.HIGH);
            assertThat(response.items()).isEmpty();
            verify(auditService).logCreate(eq("PurchaseRequest"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Purchase Request Items")
    class ItemTests {

        @Test
        @DisplayName("Should add item and compute amount")
        void addItem_ComputesAmount() {
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestItemRepository.save(any(PurchaseRequestItem.class))).thenAnswer(invocation -> {
                PurchaseRequestItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(purchaseRequestItemRepository.sumAmountByRequestId(requestId))
                    .thenReturn(new BigDecimal("50000.00"));

            CreatePurchaseRequestItemRequest request = new CreatePurchaseRequestItemRequest(
                    null, 1, "Цемент М500", new BigDecimal("100.000"),
                    "тонн", new BigDecimal("500.00"), null);

            PurchaseRequestItemResponse response = procurementService.addItem(requestId, request);

            assertThat(response.name()).isEqualTo("Цемент М500");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("50000.000"));
            verify(auditService).logCreate(eq("PurchaseRequestItem"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Purchase Request Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should submit purchase request from DRAFT")
        void submitRequest_Success() {
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenReturn(testRequest);
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            PurchaseRequestResponse response = procurementService.submitRequest(requestId);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("PurchaseRequest", requestId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should approve purchase request from IN_APPROVAL")
        void approveRequest_Success() {
            testRequest.setStatus(PurchaseRequestStatus.IN_APPROVAL);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenReturn(testRequest);
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            PurchaseRequestResponse response = procurementService.approveRequest(requestId);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("PurchaseRequest", requestId, "IN_APPROVAL", "APPROVED");
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void approveRequest_InvalidTransition() {
            testRequest.setStatus(PurchaseRequestStatus.DRAFT);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            assertThatThrownBy(() -> procurementService.approveRequest(requestId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно");
        }

        @Test
        @DisplayName("Should assign purchase request to supply manager")
        void assignRequest_Success() {
            testRequest.setStatus(PurchaseRequestStatus.APPROVED);
            UUID assigneeId = UUID.randomUUID();

            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            PurchaseRequestResponse response = procurementService.assignRequest(requestId, assigneeId);

            assertThat(response).isNotNull();
            assertThat(testRequest.getAssignedToId()).isEqualTo(assigneeId);
            verify(auditService).logStatusChange("PurchaseRequest", requestId, "APPROVED", "ASSIGNED");
        }
    }

    @Nested
    @DisplayName("Dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Should return dashboard summary for project")
        void getDashboardSummary_Success() {
            when(purchaseRequestRepository.countByStatusForProject(projectId))
                    .thenReturn(List.of(
                            new Object[]{PurchaseRequestStatus.DRAFT, 3L},
                            new Object[]{PurchaseRequestStatus.APPROVED, 5L},
                            new Object[]{PurchaseRequestStatus.ORDERED, 2L}
                    ));
            when(purchaseRequestRepository.sumTotalAmountForProject(projectId))
                    .thenReturn(new BigDecimal("500000.00"));

            PurchaseRequestDashboardResponse response = procurementService.getDashboardSummary(projectId);

            assertThat(response.statusCounts()).hasSize(3);
            assertThat(response.statusCounts().get("DRAFT")).isEqualTo(3L);
            assertThat(response.statusCounts().get("APPROVED")).isEqualTo(5L);
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        }
    }

    @Test
    @DisplayName("Should throw when purchase request not found")
    void getRequest_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(purchaseRequestRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> procurementService.getRequest(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("не найдена");
    }
}
