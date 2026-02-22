package com.privod.platform.modules.ops.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchRoute;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import com.privod.platform.modules.ops.repository.DispatchOrderRepository;
import com.privod.platform.modules.ops.repository.DispatchRouteRepository;
import com.privod.platform.modules.ops.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.ops.web.dto.DispatchOrderResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispatchService {

    private final DispatchOrderRepository dispatchOrderRepository;
    private final DispatchRouteRepository dispatchRouteRepository;
    private final AuditService auditService;

    private static final AtomicLong orderSequence = new AtomicLong(System.currentTimeMillis() % 100000);

    // ========================================================================
    // Dispatch Orders
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<DispatchOrderResponse> listOrders(UUID projectId, DispatchStatus status, Pageable pageable) {
        if (projectId != null && status != null) {
            return dispatchOrderRepository.findByProjectIdAndStatusAndDeletedFalse(projectId, status, pageable)
                    .map(DispatchOrderResponse::fromEntity);
        }
        if (projectId != null) {
            return dispatchOrderRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(DispatchOrderResponse::fromEntity);
        }
        if (status != null) {
            return dispatchOrderRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(DispatchOrderResponse::fromEntity);
        }
        return dispatchOrderRepository.findByDeletedFalse(pageable)
                .map(DispatchOrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DispatchOrderResponse getOrder(UUID id) {
        DispatchOrder order = getOrderOrThrow(id);
        return DispatchOrderResponse.fromEntity(order);
    }

    @Transactional
    public DispatchOrderResponse createOrder(CreateDispatchOrderRequest request) {
        String orderNumber = generateOrderNumber();

        DispatchOrder order = DispatchOrder.builder()
                .orderNumber(orderNumber)
                .projectId(request.projectId())
                .vehicleId(request.vehicleId())
                .driverId(request.driverId())
                .loadingPoint(request.loadingPoint())
                .unloadingPoint(request.unloadingPoint())
                .materialName(request.materialName())
                .quantity(request.quantity())
                .unit(request.unit())
                .scheduledDate(request.scheduledDate())
                .scheduledTime(request.scheduledTime())
                .distance(request.distance())
                .notes(request.notes())
                .status(DispatchStatus.PLANNED)
                .build();

        order = dispatchOrderRepository.save(order);
        auditService.logCreate("DispatchOrder", order.getId());

        log.info("Диспетчерское задание создано: {} ({})", order.getOrderNumber(), order.getId());
        return DispatchOrderResponse.fromEntity(order);
    }

    @Transactional
    public DispatchOrderResponse updateOrder(UUID id, CreateDispatchOrderRequest request) {
        DispatchOrder order = getOrderOrThrow(id);
        if (request.projectId() != null) order.setProjectId(request.projectId());
        if (request.vehicleId() != null) order.setVehicleId(request.vehicleId());
        if (request.driverId() != null) order.setDriverId(request.driverId());
        if (request.loadingPoint() != null) order.setLoadingPoint(request.loadingPoint());
        if (request.unloadingPoint() != null) order.setUnloadingPoint(request.unloadingPoint());
        if (request.materialName() != null) order.setMaterialName(request.materialName());
        if (request.quantity() != null) order.setQuantity(request.quantity());
        if (request.unit() != null) order.setUnit(request.unit());
        if (request.scheduledDate() != null) order.setScheduledDate(request.scheduledDate());
        if (request.scheduledTime() != null) order.setScheduledTime(request.scheduledTime());
        if (request.distance() != null) order.setDistance(request.distance());
        if (request.notes() != null) order.setNotes(request.notes());

        order = dispatchOrderRepository.save(order);
        auditService.logUpdate("DispatchOrder", order.getId(), "multiple", null, null);
        log.info("Диспетчерское задание обновлено: {} ({})", order.getOrderNumber(), order.getId());
        return DispatchOrderResponse.fromEntity(order);
    }

    @Transactional
    public DispatchOrderResponse transitionStatus(UUID id, DispatchStatus targetStatus) {
        DispatchOrder order = getOrderOrThrow(id);
        DispatchStatus oldStatus = order.getStatus();

        if (!order.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести заявку из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        order.setStatus(targetStatus);

        if (targetStatus == DispatchStatus.IN_TRANSIT && order.getActualDepartureAt() == null) {
            order.setActualDepartureAt(LocalDateTime.now());
        }
        if (targetStatus == DispatchStatus.DELIVERED && order.getActualArrivalAt() == null) {
            order.setActualArrivalAt(LocalDateTime.now());
        }

        order = dispatchOrderRepository.save(order);
        auditService.logStatusChange("DispatchOrder", order.getId(), oldStatus.name(), targetStatus.name());

        log.info("Диспетчерское задание {} переведено: {} -> {}", order.getOrderNumber(), oldStatus, targetStatus);
        return DispatchOrderResponse.fromEntity(order);
    }

    @Transactional
    public void deleteOrder(UUID id) {
        DispatchOrder order = getOrderOrThrow(id);
        order.softDelete();
        dispatchOrderRepository.save(order);
        auditService.logDelete("DispatchOrder", id);
        log.info("Диспетчерское задание удалено: {} ({})", order.getOrderNumber(), id);
    }

    // ========================================================================
    // Routes
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<DispatchRoute> listRoutes(Pageable pageable) {
        return dispatchRouteRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public List<DispatchRoute> getActiveRoutes() {
        return dispatchRouteRepository.findByIsActiveTrueAndDeletedFalse();
    }

    @Transactional(readOnly = true)
    public DispatchRoute getRoute(UUID id) {
        return getRouteOrThrow(id);
    }

    @Transactional
    public DispatchRoute createRoute(DispatchRoute route) {
        route = dispatchRouteRepository.save(route);
        auditService.logCreate("DispatchRoute", route.getId());
        log.info("Маршрут создан: {} ({})", route.getName(), route.getId());
        return route;
    }

    @Transactional
    public DispatchRoute updateRoute(UUID id, DispatchRoute updates) {
        DispatchRoute route = getRouteOrThrow(id);
        if (updates.getName() != null) route.setName(updates.getName());
        if (updates.getFromLocation() != null) route.setFromLocation(updates.getFromLocation());
        if (updates.getToLocation() != null) route.setToLocation(updates.getToLocation());
        if (updates.getDistanceKm() != null) route.setDistanceKm(updates.getDistanceKm());
        if (updates.getEstimatedDurationMinutes() > 0) route.setEstimatedDurationMinutes(updates.getEstimatedDurationMinutes());

        route = dispatchRouteRepository.save(route);
        auditService.logUpdate("DispatchRoute", route.getId(), "multiple", null, null);
        log.info("Маршрут обновлён: {} ({})", route.getName(), route.getId());
        return route;
    }

    @Transactional
    public void deleteRoute(UUID id) {
        DispatchRoute route = getRouteOrThrow(id);
        route.softDelete();
        dispatchRouteRepository.save(route);
        auditService.logDelete("DispatchRoute", id);
        log.info("Маршрут удалён: {} ({})", route.getName(), id);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private DispatchOrder getOrderOrThrow(UUID id) {
        return dispatchOrderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Диспетчерское задание не найдено: " + id));
    }

    private DispatchRoute getRouteOrThrow(UUID id) {
        return dispatchRouteRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден: " + id));
    }

    private String generateOrderNumber() {
        return String.format("ДЗ-%05d", orderSequence.incrementAndGet());
    }
}
