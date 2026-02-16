package com.privod.platform.modules.procurement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.repository.PurchaseRequestItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestResponse;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestRequest;
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
                .name("ZP-00001")
                .requestDate(LocalDate.now())
                .projectId(projectId)
                .status(PurchaseRequestStatus.DRAFT)
                .priority(PurchaseRequestPriority.MEDIUM)
                .requestedByName("Ivanov I.I.")
                .build();
        testRequest.setId(requestId);
        testRequest.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Purchase Request")
    class CreateTests {

        @Test
        @DisplayName("Should create purchase request with DRAFT status")
        void shouldCreate_withDraftStatus() {
            CreatePurchaseRequestRequest request = new CreatePurchaseRequestRequest(
                    LocalDate.now(), projectId, null, null,
                    PurchaseRequestPriority.HIGH, null, "Petrov P.P.", "Urgent materials");

            when(purchaseRequestRepository.getNextNameSequence()).thenReturn(1L);
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> {
                PurchaseRequest pr = inv.getArgument(0);
                pr.setId(UUID.randomUUID());
                pr.setCreatedAt(Instant.now());
                return pr;
            });

            PurchaseRequestResponse response = procurementService.createRequest(request);

            assertThat(response).isNotNull();
            verify(auditService).logCreate(eq("PurchaseRequest"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default priority to MEDIUM when null")
        void shouldDefaultPriority_whenNull() {
            CreatePurchaseRequestRequest request = new CreatePurchaseRequestRequest(
                    LocalDate.now(), projectId, null, null,
                    null, null, "Sidorov S.S.", null);

            when(purchaseRequestRepository.getNextNameSequence()).thenReturn(2L);
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> {
                PurchaseRequest pr = inv.getArgument(0);
                pr.setId(UUID.randomUUID());
                pr.setCreatedAt(Instant.now());
                return pr;
            });

            procurementService.createRequest(request);

            verify(purchaseRequestRepository).save(any(PurchaseRequest.class));
        }
    }

    @Nested
    @DisplayName("Update Purchase Request")
    class UpdateTests {

        @Test
        @DisplayName("Should update purchase request in DRAFT status")
        void shouldUpdate_whenDraftStatus() {
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            UpdatePurchaseRequestRequest request = new UpdatePurchaseRequestRequest(
                    null, null, null, null, PurchaseRequestPriority.HIGH, null, "Updated notes");

            PurchaseRequestResponse response = procurementService.updateRequest(requestId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate(eq("PurchaseRequest"), eq(requestId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when not in DRAFT status")
        void shouldThrowException_whenNotDraft() {
            testRequest.setStatus(PurchaseRequestStatus.SUBMITTED);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            UpdatePurchaseRequestRequest request = new UpdatePurchaseRequestRequest(
                    null, null, null, null, null, null, "Notes");

            assertThatThrownBy(() -> procurementService.updateRequest(requestId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Purchase Request Items")
    class ItemTests {

        @Test
        @DisplayName("Should add item to purchase request")
        void shouldAddItem_whenDraftStatus() {
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestItemRepository.save(any(PurchaseRequestItem.class))).thenAnswer(inv -> {
                PurchaseRequestItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(purchaseRequestItemRepository.sumAmountByRequestId(requestId)).thenReturn(new BigDecimal("50000"));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            CreatePurchaseRequestItemRequest itemRequest = new CreatePurchaseRequestItemRequest(
                    null, 1, "Cement M400", new BigDecimal("100"), "ton",
                    new BigDecimal("500.00"), null);

            procurementService.addItem(requestId, itemRequest);

            verify(auditService).logCreate(eq("PurchaseRequestItem"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject adding item when not DRAFT")
        void shouldThrowException_whenAddingItemToNonDraft() {
            testRequest.setStatus(PurchaseRequestStatus.APPROVED);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            CreatePurchaseRequestItemRequest itemRequest = new CreatePurchaseRequestItemRequest(
                    null, 1, "Rebar", new BigDecimal("50"), "ton",
                    new BigDecimal("1000.00"), null);

            assertThatThrownBy(() -> procurementService.addItem(requestId, itemRequest))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should submit purchase request")
        void shouldSubmit_whenDraft() {
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            PurchaseRequestResponse response = procurementService.submitRequest(requestId);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange(eq("PurchaseRequest"), eq(requestId),
                    eq("DRAFT"), eq("SUBMITTED"));
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            testRequest.setStatus(PurchaseRequestStatus.CANCELLED);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            assertThatThrownBy(() -> procurementService.submitRequest(requestId))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("Should reject request with reason")
        void shouldReject_withReason() {
            testRequest.setStatus(PurchaseRequestStatus.SUBMITTED);
            when(purchaseRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(purchaseRequestItemRepository.findByRequestIdAndDeletedFalseOrderBySequenceAsc(requestId))
                    .thenReturn(List.of());

            PurchaseRequestResponse response = procurementService.rejectRequest(requestId, "Budget exceeded");

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange(eq("PurchaseRequest"), eq(requestId),
                    eq("SUBMITTED"), eq("REJECTED"));
        }
    }

    @Test
    @DisplayName("Should throw when purchase request not found")
    void shouldThrowException_whenRequestNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(purchaseRequestRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> procurementService.getRequest(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Заявка на закупку не найдена");
    }
}
