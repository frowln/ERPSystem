package com.privod.platform.modules.procurementExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurementExt.domain.Delivery;
import com.privod.platform.modules.procurementExt.domain.DeliveryItem;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;
import com.privod.platform.modules.procurementExt.repository.DeliveryItemRepository;
import com.privod.platform.modules.procurementExt.repository.DeliveryRepository;
import com.privod.platform.modules.procurementExt.repository.DispatchItemRepository;
import com.privod.platform.modules.procurementExt.repository.DispatchOrderRepository;
import com.privod.platform.modules.procurementExt.repository.MaterialReservationRepository;
import com.privod.platform.modules.procurementExt.repository.SupplierRatingRepository;
import com.privod.platform.modules.procurementExt.service.ProcurementExtService;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryItemRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryRequest;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryItemResponse;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryResponse;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProcurementExtDeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryItemRepository deliveryItemRepository;

    @Mock
    private DispatchOrderRepository dispatchOrderRepository;

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

    private UUID deliveryId;
    private UUID routeId;
    private Delivery testDelivery;

    @BeforeEach
    void setUp() {
        deliveryId = UUID.randomUUID();
        routeId = UUID.randomUUID();

        testDelivery = Delivery.builder()
                .routeId(routeId)
                .purchaseOrderId(UUID.randomUUID())
                .vehicleId(UUID.randomUUID())
                .driverId(UUID.randomUUID())
                .plannedDepartureAt(Instant.now().plusSeconds(3600))
                .plannedArrivalAt(Instant.now().plusSeconds(7200))
                .status(DeliveryStatus.PLANNED)
                .trackingNumber("TRK-001")
                .build();
        testDelivery.setId(deliveryId);
        testDelivery.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Delivery")
    class CreateTests {

        @Test
        @DisplayName("Should create delivery with PLANNED status")
        void createDelivery_Success() {
            CreateDeliveryRequest request = new CreateDeliveryRequest(
                    routeId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200),
                    "TRK-002");

            when(deliveryRepository.save(any(Delivery.class))).thenAnswer(invocation -> {
                Delivery d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DeliveryResponse response = service.createDelivery(request);

            assertThat(response.status()).isEqualTo(DeliveryStatus.PLANNED);
            assertThat(response.trackingNumber()).isEqualTo("TRK-002");
            assertThat(response.items()).isEmpty();
            verify(auditService).logCreate(eq("Delivery"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Add Delivery Item")
    class AddItemTests {

        @Test
        @DisplayName("Should add item to delivery")
        void addItem_Success() {
            when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));
            when(deliveryItemRepository.save(any(DeliveryItem.class))).thenAnswer(invocation -> {
                DeliveryItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            UUID materialId = UUID.randomUUID();
            CreateDeliveryItemRequest request = new CreateDeliveryItemRequest(
                    materialId, new BigDecimal("100.000"), "кг", new BigDecimal("100.000"));

            DeliveryItemResponse response = service.addDeliveryItem(deliveryId, request);

            assertThat(response.materialId()).isEqualTo(materialId);
            assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("100.000"));
            verify(auditService).logCreate(eq("DeliveryItem"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Delivery Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition PLANNED -> LOADING")
        void startLoading_Success() {
            when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));
            when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> inv.getArgument(0));
            when(deliveryItemRepository.findByDeliveryIdAndDeletedFalse(deliveryId)).thenReturn(List.of());

            DeliveryResponse response = service.transitionDeliveryStatus(deliveryId, DeliveryStatus.LOADING);

            assertThat(response.status()).isEqualTo(DeliveryStatus.LOADING);
            verify(auditService).logStatusChange("Delivery", deliveryId, "PLANNED", "LOADING");
        }

        @Test
        @DisplayName("Should transition to IN_TRANSIT and set actual departure")
        void depart_SetsActualDeparture() {
            testDelivery.setStatus(DeliveryStatus.LOADING);
            when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));
            when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> inv.getArgument(0));
            when(deliveryItemRepository.findByDeliveryIdAndDeletedFalse(deliveryId)).thenReturn(List.of());

            DeliveryResponse response = service.transitionDeliveryStatus(deliveryId, DeliveryStatus.IN_TRANSIT);

            assertThat(response.status()).isEqualTo(DeliveryStatus.IN_TRANSIT);
            assertThat(testDelivery.getActualDepartureAt()).isNotNull();
        }

        @Test
        @DisplayName("Should transition to DELIVERED and set actual arrival")
        void deliver_SetsActualArrival() {
            testDelivery.setStatus(DeliveryStatus.IN_TRANSIT);
            when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));
            when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> inv.getArgument(0));
            when(deliveryItemRepository.findByDeliveryIdAndDeletedFalse(deliveryId)).thenReturn(List.of());

            DeliveryResponse response = service.transitionDeliveryStatus(deliveryId, DeliveryStatus.DELIVERED);

            assertThat(response.status()).isEqualTo(DeliveryStatus.DELIVERED);
            assertThat(testDelivery.getActualArrivalAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid delivery status transition")
        void invalidTransition() {
            testDelivery.setStatus(DeliveryStatus.DELIVERED);
            when(deliveryRepository.findById(deliveryId)).thenReturn(Optional.of(testDelivery));

            assertThatThrownBy(() -> service.transitionDeliveryStatus(deliveryId, DeliveryStatus.PLANNED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести доставку");
        }
    }

    @Test
    @DisplayName("Should throw when delivery not found")
    void getDelivery_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(deliveryRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getDelivery(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Доставка не найдена");
    }
}
