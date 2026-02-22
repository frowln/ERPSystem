package com.privod.platform.modules.ops.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchRoute;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import com.privod.platform.modules.ops.repository.DispatchOrderRepository;
import com.privod.platform.modules.ops.repository.DispatchRouteRepository;
import com.privod.platform.modules.ops.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.ops.web.dto.CreateDispatchRouteRequest;
import com.privod.platform.modules.ops.web.dto.DispatchOrderResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
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
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DispatchServiceTest {

    @Mock
    private DispatchOrderRepository dispatchOrderRepository;

    @Mock
    private DispatchRouteRepository dispatchRouteRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DispatchService dispatchService;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    private final UUID organizationId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID vehicleId = UUID.randomUUID();
    private final UUID driverId = UUID.randomUUID();
    private final UUID orderId = UUID.randomUUID();
    private final UUID routeId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        securityUtilsMock = mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::requireCurrentOrganizationId).thenReturn(organizationId);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private DispatchOrder buildPlannedOrder() {
        DispatchOrder order = DispatchOrder.builder()
                .orderNumber("ДЗ-00001")
                .organizationId(organizationId)
                .projectId(projectId)
                .vehicleId(vehicleId)
                .driverId(driverId)
                .loadingPoint("Склад А")
                .unloadingPoint("Площадка Б")
                .materialName("Песок")
                .quantity(new BigDecimal("25.000"))
                .unit("т")
                .scheduledDate(LocalDate.of(2026, 3, 15))
                .scheduledTime("08:00")
                .distance(new BigDecimal("42.50"))
                .notes("Срочная доставка")
                .status(DispatchStatus.PLANNED)
                .build();
        order.setId(orderId);
        order.setCreatedAt(Instant.now());
        return order;
    }

    private CreateDispatchOrderRequest buildCreateOrderRequest() {
        return new CreateDispatchOrderRequest(
                projectId,
                vehicleId,
                driverId,
                "Склад А",
                "Площадка Б",
                "Песок",
                new BigDecimal("25.000"),
                "т",
                LocalDate.of(2026, 3, 15),
                "08:00",
                new BigDecimal("42.50"),
                "Срочная доставка"
        );
    }

    private CreateDispatchRouteRequest buildCreateRouteRequest() {
        return new CreateDispatchRouteRequest(
                "Маршрут Москва-Тула",
                "Москва, склад",
                "Тула, объект",
                new BigDecimal("180.00"),
                120
        );
    }

    private DispatchRoute buildActiveRoute() {
        DispatchRoute route = DispatchRoute.builder()
                .organizationId(organizationId)
                .name("Маршрут Москва-Тула")
                .fromLocation("Москва, склад")
                .toLocation("Тула, объект")
                .distanceKm(new BigDecimal("180.00"))
                .estimatedDurationMinutes(120)
                .isActive(true)
                .build();
        route.setId(routeId);
        route.setCreatedAt(Instant.now());
        return route;
    }

    private void stubOrderFound(DispatchOrder order) {
        when(dispatchOrderRepository.findById(orderId)).thenReturn(Optional.of(order));
    }

    private void stubRouteFound(DispatchRoute route) {
        when(dispatchRouteRepository.findById(routeId)).thenReturn(Optional.of(route));
    }

    // ---------------------------------------------------------------
    // Create Order
    // ---------------------------------------------------------------

    @Nested
    @DisplayName("createOrder")
    class CreateOrder {

        @Test
        @DisplayName("should create dispatch order with PLANNED status and generated order number")
        void createsOrderWithPlannedStatus() {
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(invocation -> {
                DispatchOrder saved = invocation.getArgument(0);
                saved.setId(orderId);
                saved.setCreatedAt(Instant.now());
                return saved;
            });

            DispatchOrderResponse response = dispatchService.createOrder(buildCreateOrderRequest());

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(DispatchStatus.PLANNED);
            assertThat(response.projectId()).isEqualTo(projectId);
            assertThat(response.vehicleId()).isEqualTo(vehicleId);
            assertThat(response.driverId()).isEqualTo(driverId);
            assertThat(response.loadingPoint()).isEqualTo("Склад А");
            assertThat(response.unloadingPoint()).isEqualTo("Площадка Б");
            assertThat(response.materialName()).isEqualTo("Песок");
            assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("25.000"));
            assertThat(response.unit()).isEqualTo("т");
            assertThat(response.orderNumber()).startsWith("ДЗ-");

            verify(auditService).logCreate(eq("DispatchOrder"), eq(orderId));
        }

        @Test
        @DisplayName("should assign organizationId from security context")
        void assignsOrganizationIdFromContext() {
            ArgumentCaptor<DispatchOrder> captor = ArgumentCaptor.forClass(DispatchOrder.class);
            when(dispatchOrderRepository.save(captor.capture())).thenAnswer(invocation -> {
                DispatchOrder saved = invocation.getArgument(0);
                saved.setId(orderId);
                saved.setCreatedAt(Instant.now());
                return saved;
            });

            dispatchService.createOrder(buildCreateOrderRequest());

            DispatchOrder captured = captor.getValue();
            assertThat(captured.getOrganizationId()).isEqualTo(organizationId);
            assertThat(captured.getStatus()).isEqualTo(DispatchStatus.PLANNED);
        }
    }

    // ---------------------------------------------------------------
    // Status Transitions
    // ---------------------------------------------------------------

    @Nested
    @DisplayName("transitionStatus")
    class TransitionStatus {

        @Test
        @DisplayName("should transition PLANNED -> DISPATCHED")
        void plannedToDispatched() {
            DispatchOrder order = buildPlannedOrder();
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            DispatchOrderResponse response = dispatchService.transitionStatus(orderId, DispatchStatus.DISPATCHED);

            assertThat(response.status()).isEqualTo(DispatchStatus.DISPATCHED);
            verify(auditService).logStatusChange("DispatchOrder", orderId, "PLANNED", "DISPATCHED");
        }

        @Test
        @DisplayName("should transition DISPATCHED -> IN_TRANSIT and set actualDepartureAt")
        void dispatchedToInTransit_SetsActualDeparture() {
            DispatchOrder order = buildPlannedOrder();
            order.setStatus(DispatchStatus.DISPATCHED);
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            DispatchOrderResponse response = dispatchService.transitionStatus(orderId, DispatchStatus.IN_TRANSIT);

            assertThat(response.status()).isEqualTo(DispatchStatus.IN_TRANSIT);
            assertThat(order.getActualDepartureAt()).isNotNull();
            verify(auditService).logStatusChange("DispatchOrder", orderId, "DISPATCHED", "IN_TRANSIT");
        }

        @Test
        @DisplayName("should not overwrite actualDepartureAt if already set")
        void inTransit_DoesNotOverwriteExistingDeparture() {
            DispatchOrder order = buildPlannedOrder();
            order.setStatus(DispatchStatus.DISPATCHED);
            java.time.LocalDateTime existingDeparture = java.time.LocalDateTime.of(2026, 3, 15, 7, 30);
            order.setActualDepartureAt(existingDeparture);
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            dispatchService.transitionStatus(orderId, DispatchStatus.IN_TRANSIT);

            assertThat(order.getActualDepartureAt()).isEqualTo(existingDeparture);
        }

        @Test
        @DisplayName("should transition IN_TRANSIT -> DELIVERED and set actualArrivalAt")
        void inTransitToDelivered_SetsActualArrival() {
            DispatchOrder order = buildPlannedOrder();
            order.setStatus(DispatchStatus.IN_TRANSIT);
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            DispatchOrderResponse response = dispatchService.transitionStatus(orderId, DispatchStatus.DELIVERED);

            assertThat(response.status()).isEqualTo(DispatchStatus.DELIVERED);
            assertThat(order.getActualArrivalAt()).isNotNull();
            verify(auditService).logStatusChange("DispatchOrder", orderId, "IN_TRANSIT", "DELIVERED");
        }

        @Test
        @DisplayName("should throw IllegalStateException on invalid transition PLANNED -> DELIVERED")
        void invalidTransition_PlannedToDelivered() {
            DispatchOrder order = buildPlannedOrder();
            stubOrderFound(order);

            assertThatThrownBy(() -> dispatchService.transitionStatus(orderId, DispatchStatus.DELIVERED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести заявку");

            verify(dispatchOrderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw IllegalStateException on transition from terminal status DELIVERED")
        void invalidTransition_DeliveredIsTerminal() {
            DispatchOrder order = buildPlannedOrder();
            order.setStatus(DispatchStatus.DELIVERED);
            stubOrderFound(order);

            assertThatThrownBy(() -> dispatchService.transitionStatus(orderId, DispatchStatus.CANCELLED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести заявку");

            verify(dispatchOrderRepository, never()).save(any());
        }

        @Test
        @DisplayName("should allow PLANNED -> CANCELLED")
        void plannedToCancelled() {
            DispatchOrder order = buildPlannedOrder();
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            DispatchOrderResponse response = dispatchService.transitionStatus(orderId, DispatchStatus.CANCELLED);

            assertThat(response.status()).isEqualTo(DispatchStatus.CANCELLED);
            verify(auditService).logStatusChange("DispatchOrder", orderId, "PLANNED", "CANCELLED");
        }
    }

    // ---------------------------------------------------------------
    // Delete Order
    // ---------------------------------------------------------------

    @Nested
    @DisplayName("deleteOrder")
    class DeleteOrder {

        @Test
        @DisplayName("should soft-delete dispatch order")
        void softDeletesOrder() {
            DispatchOrder order = buildPlannedOrder();
            stubOrderFound(order);
            when(dispatchOrderRepository.save(any(DispatchOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            dispatchService.deleteOrder(orderId);

            ArgumentCaptor<DispatchOrder> captor = ArgumentCaptor.forClass(DispatchOrder.class);
            verify(dispatchOrderRepository).save(captor.capture());
            assertThat(captor.getValue().isDeleted()).isTrue();
            verify(auditService).logDelete("DispatchOrder", orderId);
        }
    }

    // ---------------------------------------------------------------
    // Route CRUD
    // ---------------------------------------------------------------

    @Nested
    @DisplayName("Route operations")
    class RouteOperations {

        @Test
        @DisplayName("should create route with isActive=true and organizationId from context")
        void createsRouteWithActiveFlag() {
            when(dispatchRouteRepository.save(any(DispatchRoute.class))).thenAnswer(invocation -> {
                DispatchRoute saved = invocation.getArgument(0);
                saved.setId(routeId);
                saved.setCreatedAt(Instant.now());
                return saved;
            });

            DispatchRoute result = dispatchService.createRoute(buildCreateRouteRequest());

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Маршрут Москва-Тула");
            assertThat(result.getFromLocation()).isEqualTo("Москва, склад");
            assertThat(result.getToLocation()).isEqualTo("Тула, объект");
            assertThat(result.getDistanceKm()).isEqualByComparingTo(new BigDecimal("180.00"));
            assertThat(result.getEstimatedDurationMinutes()).isEqualTo(120);
            assertThat(result.isActive()).isTrue();
            assertThat(result.getOrganizationId()).isEqualTo(organizationId);

            verify(auditService).logCreate(eq("DispatchRoute"), eq(routeId));
        }

        @Test
        @DisplayName("should default estimatedDurationMinutes to 0 when null")
        void defaultsEstimatedDurationToZero() {
            CreateDispatchRouteRequest request = new CreateDispatchRouteRequest(
                    "Короткий маршрут", "Точка А", "Точка Б",
                    new BigDecimal("10.00"), null
            );

            ArgumentCaptor<DispatchRoute> captor = ArgumentCaptor.forClass(DispatchRoute.class);
            when(dispatchRouteRepository.save(captor.capture())).thenAnswer(invocation -> {
                DispatchRoute saved = invocation.getArgument(0);
                saved.setId(routeId);
                saved.setCreatedAt(Instant.now());
                return saved;
            });

            dispatchService.createRoute(request);

            assertThat(captor.getValue().getEstimatedDurationMinutes()).isEqualTo(0);
        }

        @Test
        @DisplayName("should soft-delete route")
        void softDeletesRoute() {
            DispatchRoute route = buildActiveRoute();
            stubRouteFound(route);
            when(dispatchRouteRepository.save(any(DispatchRoute.class))).thenAnswer(inv -> inv.getArgument(0));

            dispatchService.deleteRoute(routeId);

            ArgumentCaptor<DispatchRoute> captor = ArgumentCaptor.forClass(DispatchRoute.class);
            verify(dispatchRouteRepository).save(captor.capture());
            assertThat(captor.getValue().isDeleted()).isTrue();
            verify(auditService).logDelete("DispatchRoute", routeId);
        }
    }

    // ---------------------------------------------------------------
    // Not Found
    // ---------------------------------------------------------------

    @Nested
    @DisplayName("Not found scenarios")
    class NotFound {

        @Test
        @DisplayName("should throw EntityNotFoundException when order not found")
        void throwsWhenOrderNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(dispatchOrderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dispatchService.getOrder(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Диспетчерское задание не найдено");
        }

        @Test
        @DisplayName("should throw EntityNotFoundException when order is soft-deleted")
        void throwsWhenOrderSoftDeleted() {
            DispatchOrder order = buildPlannedOrder();
            order.softDelete();
            when(dispatchOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> dispatchService.getOrder(orderId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Диспетчерское задание не найдено");
        }

        @Test
        @DisplayName("should throw EntityNotFoundException when route not found")
        void throwsWhenRouteNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(dispatchRouteRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dispatchService.getRoute(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Маршрут не найден");
        }
    }
}
