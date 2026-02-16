package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.changeManagement.domain.ChangeOrder;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderItem;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderType;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderItemRepository;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRepository;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderItemResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderItemRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequest;
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
class ChangeOrderServiceTest {

    @Mock
    private ChangeOrderRepository changeOrderRepository;

    @Mock
    private ChangeOrderItemRepository changeOrderItemRepository;

    @Mock
    private ChangeOrderRequestService changeOrderRequestService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ChangeOrderService changeOrderService;

    private UUID orderId;
    private UUID projectId;
    private UUID contractId;
    private UUID corId;
    private ChangeOrder testOrder;
    private ChangeOrderRequest testCor;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        contractId = UUID.randomUUID();
        corId = UUID.randomUUID();

        testOrder = ChangeOrder.builder()
                .projectId(projectId)
                .contractId(contractId)
                .number("CO-00001")
                .title("Дополнительное соглашение по перекладке коммуникаций")
                .description("Работы по перекладке подземных коммуникаций")
                .changeOrderType(ChangeOrderType.ADDITION)
                .status(ChangeOrderStatus.DRAFT)
                .totalAmount(new BigDecimal("450000.00"))
                .scheduleImpactDays(10)
                .originalContractAmount(new BigDecimal("5000000.00"))
                .revisedContractAmount(new BigDecimal("5450000.00"))
                .changeOrderRequestId(corId)
                .build();
        testOrder.setId(orderId);
        testOrder.setCreatedAt(Instant.now());

        testCor = ChangeOrderRequest.builder()
                .changeEventId(UUID.randomUUID())
                .projectId(projectId)
                .number("COR-00001")
                .title("Запрос на расценку")
                .status(ChangeOrderRequestStatus.APPROVED)
                .build();
        testCor.setId(corId);
    }

    @Nested
    @DisplayName("Create Change Order")
    class CreateTests {

        @Test
        @DisplayName("Should create change order with DRAFT status from approved COR")
        void shouldCreateChangeOrder_whenCorApproved() {
            when(changeOrderRequestService.getChangeOrderRequestOrThrow(corId)).thenReturn(testCor);
            when(changeOrderRepository.getNextNumberSequence()).thenReturn(1L);
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> {
                ChangeOrder o = inv.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            CreateChangeOrderRequest request = new CreateChangeOrderRequest(
                    projectId, contractId, "Допсоглашение",
                    "Описание", ChangeOrderType.ADDITION,
                    new BigDecimal("5000000.00"), 10, corId);

            ChangeOrderResponse response = changeOrderService.createChangeOrder(request);

            assertThat(response.status()).isEqualTo(ChangeOrderStatus.DRAFT);
            assertThat(response.number()).isEqualTo("CO-00001");
            assertThat(response.changeOrderRequestId()).isEqualTo(corId);
            verify(auditService).logCreate(eq("ChangeOrder"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject creation from non-approved COR")
        void shouldThrowException_whenCorNotApproved() {
            testCor.setStatus(ChangeOrderRequestStatus.DRAFT);
            when(changeOrderRequestService.getChangeOrderRequestOrThrow(corId)).thenReturn(testCor);

            CreateChangeOrderRequest request = new CreateChangeOrderRequest(
                    projectId, contractId, "Допсоглашение",
                    null, null, null, null, corId);

            assertThatThrownBy(() -> changeOrderService.createChangeOrder(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("утверждённого запроса");
        }

        @Test
        @DisplayName("Should create change order without COR (direct creation)")
        void shouldCreateChangeOrder_whenNoCor() {
            when(changeOrderRepository.getNextNumberSequence()).thenReturn(2L);
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> {
                ChangeOrder o = inv.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            CreateChangeOrderRequest request = new CreateChangeOrderRequest(
                    projectId, contractId, "Прямой ордер",
                    null, ChangeOrderType.DEDUCTION,
                    new BigDecimal("3000000.00"), 0, null);

            ChangeOrderResponse response = changeOrderService.createChangeOrder(request);

            assertThat(response.status()).isEqualTo(ChangeOrderStatus.DRAFT);
            assertThat(response.changeOrderRequestId()).isNull();
        }

        @Test
        @DisplayName("Should default scheduleImpactDays to 0 when null")
        void shouldDefaultScheduleImpact_whenNull() {
            when(changeOrderRepository.getNextNumberSequence()).thenReturn(3L);
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> {
                ChangeOrder o = inv.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            CreateChangeOrderRequest request = new CreateChangeOrderRequest(
                    projectId, contractId, "Ордер", null, null, null, null, null);

            ChangeOrderResponse response = changeOrderService.createChangeOrder(request);

            assertThat(response.scheduleImpactDays()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should approve change order and set approved date")
        void shouldApproveOrder_whenPendingApproval() {
            testOrder.setStatus(ChangeOrderStatus.PENDING_APPROVAL);
            UUID approverId = UUID.randomUUID();

            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderStatusRequest request = new ChangeOrderStatusRequest(
                    ChangeOrderStatus.APPROVED, approverId);
            ChangeOrderResponse response = changeOrderService.changeStatus(orderId, request);

            assertThat(response.status()).isEqualTo(ChangeOrderStatus.APPROVED);
            assertThat(response.approvedById()).isEqualTo(approverId);
            assertThat(response.approvedDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("ChangeOrder", orderId, "PENDING_APPROVAL", "APPROVED");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void shouldThrowException_whenInvalidTransition() {
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

            ChangeOrderStatusRequest request = new ChangeOrderStatusRequest(
                    ChangeOrderStatus.APPROVED, null);

            assertThatThrownBy(() -> changeOrderService.changeStatus(orderId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести ордер на изменение");
        }

        @Test
        @DisplayName("Should set executed date on EXECUTED transition")
        void shouldSetExecutedDate_whenExecuted() {
            testOrder.setStatus(ChangeOrderStatus.APPROVED);
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderStatusRequest request = new ChangeOrderStatusRequest(
                    ChangeOrderStatus.EXECUTED, null);
            ChangeOrderResponse response = changeOrderService.changeStatus(orderId, request);

            assertThat(response.status()).isEqualTo(ChangeOrderStatus.EXECUTED);
            assertThat(response.executedDate()).isEqualTo(LocalDate.now());
        }
    }

    @Nested
    @DisplayName("Budget Calculations")
    class BudgetCalculationTests {

        @Test
        @DisplayName("Should calculate revised contract amount from approved and executed change orders")
        void shouldCalculateRevisedAmount_whenApprovedAndExecutedOrders() {
            when(changeOrderRepository.sumTotalAmountByContractIdAndStatus(
                    contractId, ChangeOrderStatus.APPROVED))
                    .thenReturn(new BigDecimal("500000.00"));
            when(changeOrderRepository.sumTotalAmountByContractIdAndStatus(
                    contractId, ChangeOrderStatus.EXECUTED))
                    .thenReturn(new BigDecimal("200000.00"));

            BigDecimal revised = changeOrderService.calculateRevisedContractAmount(
                    contractId, new BigDecimal("5000000.00"));

            assertThat(revised).isEqualByComparingTo(new BigDecimal("5700000.00"));
        }

        @Test
        @DisplayName("Should add item and recalculate change order total")
        void shouldRecalculateTotal_whenItemAdded() {
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(changeOrderItemRepository.save(any(ChangeOrderItem.class))).thenAnswer(inv -> {
                ChangeOrderItem i = inv.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });
            when(changeOrderItemRepository.sumTotalPriceByChangeOrderId(orderId))
                    .thenReturn(new BigDecimal("150000.00"));
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            CreateChangeOrderItemRequest request = new CreateChangeOrderItemRequest(
                    orderId, "Демонтаж трубопровода",
                    new BigDecimal("100"), "м.п.",
                    new BigDecimal("1500.00"),
                    null, null, 1);

            ChangeOrderItemResponse response = changeOrderService.addItem(request);

            assertThat(response.description()).isEqualTo("Демонтаж трубопровода");
            assertThat(testOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("150000.00"));
        }

        @Test
        @DisplayName("Should reject adding item when order is not DRAFT")
        void shouldThrowException_whenAddingItemToNonDraftOrder() {
            testOrder.setStatus(ChangeOrderStatus.APPROVED);
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

            CreateChangeOrderItemRequest request = new CreateChangeOrderItemRequest(
                    orderId, "Позиция", new BigDecimal("10"), "шт.",
                    new BigDecimal("100.00"), null, null, 1);

            assertThatThrownBy(() -> changeOrderService.addItem(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Добавление позиций возможно только");
        }
    }

    @Nested
    @DisplayName("Update and Delete")
    class UpdateAndDeleteTests {

        @Test
        @DisplayName("Should update change order in DRAFT status")
        void shouldUpdateOrder_whenDraftStatus() {
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateChangeOrderRequest request = new UpdateChangeOrderRequest(
                    "Обновлённый ордер", null, ChangeOrderType.MIXED, null, 15);

            ChangeOrderResponse response = changeOrderService.updateChangeOrder(orderId, request);

            assertThat(response.title()).isEqualTo("Обновлённый ордер");
            assertThat(response.changeOrderType()).isEqualTo(ChangeOrderType.MIXED);
            assertThat(response.scheduleImpactDays()).isEqualTo(15);
        }

        @Test
        @DisplayName("Should reject update when change order is not DRAFT")
        void shouldThrowException_whenUpdateNonDraftOrder() {
            testOrder.setStatus(ChangeOrderStatus.APPROVED);
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

            UpdateChangeOrderRequest request = new UpdateChangeOrderRequest(
                    "Попытка", null, null, null, null);

            assertThatThrownBy(() -> changeOrderService.updateChangeOrder(orderId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование ордера на изменение возможно только в статусе Черновик");
        }

        @Test
        @DisplayName("Should throw when change order not found")
        void shouldThrowException_whenOrderNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(changeOrderRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> changeOrderService.getChangeOrder(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Ордер на изменение не найден");
        }

        @Test
        @DisplayName("Should soft delete change order")
        void shouldSoftDelete_whenValidId() {
            when(changeOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(changeOrderRepository.save(any(ChangeOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            changeOrderService.deleteChangeOrder(orderId);

            assertThat(testOrder.isDeleted()).isTrue();
            verify(auditService).logDelete("ChangeOrder", orderId);
        }
    }
}
