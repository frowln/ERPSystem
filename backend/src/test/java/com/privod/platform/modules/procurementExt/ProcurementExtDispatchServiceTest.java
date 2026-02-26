package com.privod.platform.modules.procurementExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.procurementExt.domain.DispatchOrderStatus;
import com.privod.platform.modules.procurementExt.domain.DispatchPriority;
import com.privod.platform.modules.procurementExt.repository.DeliveryItemRepository;
import com.privod.platform.modules.procurementExt.repository.DeliveryRepository;
import com.privod.platform.modules.procurementExt.repository.DispatchItemRepository;
import com.privod.platform.modules.procurementExt.repository.ProcurementDispatchOrderRepository;
import com.privod.platform.modules.procurementExt.repository.MaterialReservationRepository;
import com.privod.platform.modules.procurementExt.repository.SupplierRatingRepository;
import com.privod.platform.modules.procurementExt.service.ProcurementExtService;
import com.privod.platform.modules.procurementExt.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.procurementExt.web.dto.DispatchOrderResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class ProcurementExtDispatchServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryItemRepository deliveryItemRepository;

    @Mock
    private ProcurementDispatchOrderRepository dispatchOrderRepository;

    @Mock
    private DispatchItemRepository dispatchItemRepository;

    @Mock
    private MaterialReservationRepository materialReservationRepository;

    @Mock
    private SupplierRatingRepository supplierRatingRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProcurementExtService service;

    private UUID orderId;
    private UUID projectId;
    private DispatchOrder testOrder;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testOrder = DispatchOrder.builder()
                .projectId(projectId)
                .code("ДС-00001")
                .priority(DispatchPriority.HIGH)
                .status(DispatchOrderStatus.NEW)
                .requestedById(UUID.randomUUID())
                .notes("Срочная доставка цемента")
                .build();
        testOrder.setId(orderId);
        testOrder.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Dispatch Order")
    class CreateTests {

        @Test
        @DisplayName("Should create dispatch order with auto-generated code")
        void createDispatchOrder_Success() {
            CreateDispatchOrderRequest request = new CreateDispatchOrderRequest(
                    projectId, DispatchPriority.HIGH, UUID.randomUUID(), "Срочная доставка");

            when(dispatchOrderRepository.getNextCodeSequence()).thenReturn(1L);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(invocation -> {
                DispatchOrder o = invocation.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            DispatchOrderResponse response = service.createDispatchOrder(request);

            assertThat(response.status()).isEqualTo(DispatchOrderStatus.NEW);
            assertThat(response.code()).isEqualTo("ДС-00001");
            assertThat(response.priority()).isEqualTo(DispatchPriority.HIGH);
            assertThat(response.priorityDisplayName()).isEqualTo("Высокий");
            verify(auditService).logCreate(eq("DispatchOrder"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create dispatch order with default MEDIUM priority")
        void createDispatchOrder_DefaultPriority() {
            CreateDispatchOrderRequest request = new CreateDispatchOrderRequest(
                    projectId, null, null, null);

            when(dispatchOrderRepository.getNextCodeSequence()).thenReturn(2L);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(invocation -> {
                DispatchOrder o = invocation.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(Instant.now());
                return o;
            });

            DispatchOrderResponse response = service.createDispatchOrder(request);

            assertThat(response.priority()).isEqualTo(DispatchPriority.MEDIUM);
        }
    }

    @Nested
    @DisplayName("Dispatch Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition NEW -> CONFIRMED")
        void confirmDispatch_Success() {
            when(dispatchOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));
            when(dispatchItemRepository.findByOrderIdAndDeletedFalse(orderId)).thenReturn(List.of());

            DispatchOrderResponse response = service.transitionDispatchStatus(orderId, DispatchOrderStatus.CONFIRMED);

            assertThat(response.status()).isEqualTo(DispatchOrderStatus.CONFIRMED);
            verify(auditService).logStatusChange("DispatchOrder", orderId, "NEW", "CONFIRMED");
        }

        @Test
        @DisplayName("Should transition to DISPATCHED and set dispatchedAt")
        void dispatchOrder_SetsDispatchedAt() {
            testOrder.setStatus(DispatchOrderStatus.CONFIRMED);
            when(dispatchOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));
            when(dispatchItemRepository.findByOrderIdAndDeletedFalse(orderId)).thenReturn(List.of());

            DispatchOrderResponse response = service.transitionDispatchStatus(orderId, DispatchOrderStatus.DISPATCHED);

            assertThat(response.status()).isEqualTo(DispatchOrderStatus.DISPATCHED);
            assertThat(testOrder.getDispatchedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid dispatch status transition")
        void invalidTransition() {
            testOrder.setStatus(DispatchOrderStatus.DELIVERED);
            when(dispatchOrderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

            assertThatThrownBy(() -> service.transitionDispatchStatus(orderId, DispatchOrderStatus.CONFIRMED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести заявку");
        }
    }

    @Test
    @DisplayName("Should throw when dispatch order not found")
    void getDispatchOrder_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(dispatchOrderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getDispatchOrder(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Заявка на диспетчеризацию не найдена");
    }
}
