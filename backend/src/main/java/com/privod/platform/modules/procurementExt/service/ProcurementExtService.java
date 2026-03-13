package com.privod.platform.modules.procurementExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurementExt.domain.Delivery;
import com.privod.platform.modules.procurementExt.domain.DeliveryItem;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;
import com.privod.platform.modules.procurementExt.domain.DispatchItem;
import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import com.privod.platform.modules.procurementExt.domain.MaterialReservation;
import com.privod.platform.modules.procurementExt.domain.ReservationStatus;
import com.privod.platform.modules.procurementExt.domain.SupplierRating;
import com.privod.platform.modules.procurementExt.repository.DeliveryItemRepository;
import com.privod.platform.modules.procurementExt.repository.DeliveryRepository;
import com.privod.platform.modules.procurementExt.repository.DispatchItemRepository;
import com.privod.platform.modules.procurementExt.repository.ProcurementDispatchOrderRepository;
import com.privod.platform.modules.procurementExt.repository.MaterialReservationRepository;
import com.privod.platform.modules.procurementExt.repository.SupplierRatingRepository;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryItemRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateSupplierRatingRequest;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryItemResponse;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryResponse;
import com.privod.platform.modules.procurementExt.web.dto.DispatchItemResponse;
import com.privod.platform.modules.procurementExt.web.dto.DispatchOrderResponse;
import com.privod.platform.modules.procurementExt.web.dto.SupplierRatingResponse;
import com.privod.platform.modules.warehouse.service.StockMovementService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementExtService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final ProcurementDispatchOrderRepository dispatchOrderRepository;
    private final DispatchItemRepository dispatchItemRepository;
    private final MaterialReservationRepository materialReservationRepository;
    private final SupplierRatingRepository supplierRatingRepository;
    private final AuditService auditService;
    private final StockMovementService stockMovementService;

    // ========================================================================
    // Deliveries
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<DeliveryResponse> listDeliveries(DeliveryStatus status, UUID routeId, Pageable pageable) {
        Specification<Delivery> spec = Specification
                .where(DeliverySpecification.notDeleted())
                .and(DeliverySpecification.hasStatus(status))
                .and(DeliverySpecification.hasRoute(routeId));

        return deliveryRepository.findAll(spec, pageable).map(d -> {
            List<DeliveryItemResponse> items = deliveryItemRepository.findByDeliveryIdAndDeletedFalse(d.getId())
                    .stream().map(DeliveryItemResponse::fromEntity).toList();
            return DeliveryResponse.fromEntity(d, items);
        });
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getDelivery(UUID id) {
        Delivery d = getDeliveryOrThrow(id);
        List<DeliveryItemResponse> items = deliveryItemRepository.findByDeliveryIdAndDeletedFalse(id)
                .stream().map(DeliveryItemResponse::fromEntity).toList();
        return DeliveryResponse.fromEntity(d, items);
    }

    @Transactional
    public DeliveryResponse createDelivery(CreateDeliveryRequest request) {
        Delivery d = Delivery.builder()
                .routeId(request.routeId())
                .purchaseOrderId(request.purchaseOrderId())
                .vehicleId(request.vehicleId())
                .driverId(request.driverId())
                .plannedDepartureAt(request.plannedDepartureAt())
                .plannedArrivalAt(request.plannedArrivalAt())
                .trackingNumber(request.trackingNumber())
                .status(DeliveryStatus.PLANNED)
                .build();

        d = deliveryRepository.save(d);
        auditService.logCreate("Delivery", d.getId());

        log.info("Доставка создана: {}", d.getId());
        return DeliveryResponse.fromEntity(d, List.of());
    }

    @Transactional
    public DeliveryResponse updateDelivery(UUID id, CreateDeliveryRequest request) {
        Delivery d = getDeliveryOrThrow(id);

        if (request.routeId() != null) d.setRouteId(request.routeId());
        if (request.purchaseOrderId() != null) d.setPurchaseOrderId(request.purchaseOrderId());
        if (request.vehicleId() != null) d.setVehicleId(request.vehicleId());
        if (request.driverId() != null) d.setDriverId(request.driverId());
        if (request.plannedDepartureAt() != null) d.setPlannedDepartureAt(request.plannedDepartureAt());
        if (request.plannedArrivalAt() != null) d.setPlannedArrivalAt(request.plannedArrivalAt());
        if (request.trackingNumber() != null) d.setTrackingNumber(request.trackingNumber());

        d = deliveryRepository.save(d);
        auditService.logUpdate("Delivery", d.getId(), "multiple", null, null);

        log.info("Доставка обновлена: {}", d.getId());
        List<DeliveryItemResponse> items = deliveryItemRepository.findByDeliveryIdAndDeletedFalse(id)
                .stream().map(DeliveryItemResponse::fromEntity).toList();
        return DeliveryResponse.fromEntity(d, items);
    }

    @Transactional
    public void deleteDelivery(UUID id) {
        Delivery d = getDeliveryOrThrow(id);
        d.softDelete();
        deliveryRepository.save(d);
        auditService.logDelete("Delivery", id);
        log.info("Доставка удалена: {}", id);
    }

    @Transactional
    public DeliveryItemResponse addDeliveryItem(UUID deliveryId, CreateDeliveryItemRequest request) {
        getDeliveryOrThrow(deliveryId);

        DeliveryItem item = DeliveryItem.builder()
                .deliveryId(deliveryId)
                .materialId(request.materialId())
                .quantity(request.quantity())
                .unit(request.unit())
                .weight(request.weight())
                .build();

        item = deliveryItemRepository.save(item);
        auditService.logCreate("DeliveryItem", item.getId());

        log.info("Позиция доставки добавлена: {} в доставку {}", item.getId(), deliveryId);
        return DeliveryItemResponse.fromEntity(item);
    }

    @Transactional
    public DeliveryResponse transitionDeliveryStatus(UUID id, DeliveryStatus targetStatus) {
        Delivery d = getDeliveryOrThrow(id);
        DeliveryStatus oldStatus = d.getStatus();

        if (!d.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести доставку из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        d.setStatus(targetStatus);

        if (targetStatus == DeliveryStatus.IN_TRANSIT) {
            d.setActualDepartureAt(Instant.now());
        }
        if (targetStatus == DeliveryStatus.DELIVERED) {
            d.setActualArrivalAt(Instant.now());
        }

        d = deliveryRepository.save(d);
        auditService.logStatusChange("Delivery", d.getId(), oldStatus.name(), targetStatus.name());

        // P1-WAR-3: Авто-создание приходного ордера при поступлении доставки
        if (targetStatus == DeliveryStatus.DELIVERED) {
            List<DeliveryItem> deliveryItems = deliveryItemRepository.findByDeliveryIdAndDeletedFalse(id);
            if (!deliveryItems.isEmpty()) {
                try {
                    List<UUID> materialIds = deliveryItems.stream().map(DeliveryItem::getMaterialId).toList();
                    List<BigDecimal> quantities = deliveryItems.stream().map(DeliveryItem::getQuantity).toList();
                    List<String> units = deliveryItems.stream().map(DeliveryItem::getUnit).toList();
                    UUID orgId = SecurityUtils.requireCurrentOrganizationId();
                    stockMovementService.createAutoReceiptFromDelivery(id, orgId, materialIds, quantities, units);
                } catch (Exception ex) {
                    log.warn("Не удалось авто-создать приходный ордер из доставки {}: {}", id, ex.getMessage());
                }
            }
        }

        log.info("Доставка {} переведена: {} -> {}", d.getId(), oldStatus, targetStatus);
        List<DeliveryItemResponse> items = deliveryItemRepository.findByDeliveryIdAndDeletedFalse(id)
                .stream().map(DeliveryItemResponse::fromEntity).toList();
        return DeliveryResponse.fromEntity(d, items);
    }

    // ========================================================================
    // Dispatch Orders
    // ========================================================================

    @Transactional(readOnly = true)
    public DispatchOrderResponse getDispatchOrder(UUID id) {
        DispatchOrder o = getDispatchOrderOrThrow(id);
        List<DispatchItemResponse> items = dispatchItemRepository.findByOrderIdAndDeletedFalse(id)
                .stream().map(DispatchItemResponse::fromEntity).toList();
        return DispatchOrderResponse.fromEntity(o, items);
    }

    @Transactional
    public DispatchOrderResponse createDispatchOrder(CreateDispatchOrderRequest request) {
        DispatchOrder o = DispatchOrder.builder()
                .projectId(request.projectId())
                .orderNumber(request.orderNumber())
                .vehicleId(request.vehicleId())
                .driverId(request.driverId())
                .loadingPoint(request.loadingPoint())
                .unloadingPoint(request.unloadingPoint())
                .materialName(request.materialName())
                .quantity(request.quantity())
                .unit(request.unit())
                .scheduledDate(request.scheduledDate())
                .scheduledTime(request.scheduledTime())
                .notes(request.notes())
                .status(DispatchStatus.PLANNED)
                .build();

        o = dispatchOrderRepository.save(o);
        auditService.logCreate("DispatchOrder", o.getId());

        log.info("Заявка на диспетчеризацию создана: {} ({})", o.getOrderNumber(), o.getId());
        return DispatchOrderResponse.fromEntity(o, List.of());
    }

    @Transactional
    public DispatchOrderResponse updateDispatchOrder(UUID id, CreateDispatchOrderRequest request) {
        DispatchOrder o = getDispatchOrderOrThrow(id);

        if (request.projectId() != null) o.setProjectId(request.projectId());
        if (request.vehicleId() != null) o.setVehicleId(request.vehicleId());
        if (request.driverId() != null) o.setDriverId(request.driverId());
        if (request.loadingPoint() != null) o.setLoadingPoint(request.loadingPoint());
        if (request.unloadingPoint() != null) o.setUnloadingPoint(request.unloadingPoint());
        if (request.materialName() != null) o.setMaterialName(request.materialName());
        if (request.quantity() != null) o.setQuantity(request.quantity());
        if (request.unit() != null) o.setUnit(request.unit());
        if (request.scheduledDate() != null) o.setScheduledDate(request.scheduledDate());
        if (request.scheduledTime() != null) o.setScheduledTime(request.scheduledTime());
        if (request.notes() != null) o.setNotes(request.notes());

        o = dispatchOrderRepository.save(o);
        auditService.logUpdate("DispatchOrder", o.getId(), "multiple", null, null);

        log.info("Заявка на диспетчеризацию обновлена: {} ({})", o.getOrderNumber(), o.getId());
        List<DispatchItemResponse> items = dispatchItemRepository.findByOrderIdAndDeletedFalse(id)
                .stream().map(DispatchItemResponse::fromEntity).toList();
        return DispatchOrderResponse.fromEntity(o, items);
    }

    @Transactional
    public void deleteDispatchOrder(UUID id) {
        DispatchOrder o = getDispatchOrderOrThrow(id);
        o.softDelete();
        dispatchOrderRepository.save(o);
        auditService.logDelete("DispatchOrder", id);
        log.info("Заявка на диспетчеризацию удалена: {} ({})", o.getOrderNumber(), id);
    }

    @Transactional
    public DispatchOrderResponse transitionDispatchStatus(UUID id, DispatchStatus targetStatus) {
        DispatchOrder o = getDispatchOrderOrThrow(id);
        DispatchStatus oldStatus = o.getStatus();

        if (!o.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести заявку из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        o.setStatus(targetStatus);
        if (targetStatus == DispatchStatus.DISPATCHED) {
            o.setActualDepartureAt(LocalDateTime.now());
        }
        if (targetStatus == DispatchStatus.DELIVERED) {
            o.setActualArrivalAt(LocalDateTime.now());
        }

        o = dispatchOrderRepository.save(o);
        auditService.logStatusChange("DispatchOrder", o.getId(), oldStatus.name(), targetStatus.name());

        log.info("Заявка на диспетчеризацию {} переведена: {} -> {}", o.getOrderNumber(), oldStatus, targetStatus);
        List<DispatchItemResponse> items = dispatchItemRepository.findByOrderIdAndDeletedFalse(id)
                .stream().map(DispatchItemResponse::fromEntity).toList();
        return DispatchOrderResponse.fromEntity(o, items);
    }

    // ========================================================================
    // Material Reservations
    // ========================================================================

    @Transactional
    public void releaseReservation(UUID reservationId) {
        MaterialReservation r = materialReservationRepository.findById(reservationId)
                .filter(res -> !res.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Резервирование не найдено: " + reservationId));

        if (r.getStatus() != ReservationStatus.ACTIVE) {
            throw new IllegalStateException(
                    String.format("Невозможно снять резервирование в статусе %s", r.getStatus().getDisplayName()));
        }

        r.setStatus(ReservationStatus.RELEASED);
        materialReservationRepository.save(r);
        auditService.logStatusChange("MaterialReservation", r.getId(), "ACTIVE", "RELEASED");

        log.info("Резервирование снято: {}", reservationId);
    }

    @Transactional
    public void expireOverdueReservations() {
        List<MaterialReservation> expired = materialReservationRepository
                .findByStatusAndExpiresAtBeforeAndDeletedFalse(ReservationStatus.ACTIVE, Instant.now());

        for (MaterialReservation r : expired) {
            r.setStatus(ReservationStatus.EXPIRED);
            materialReservationRepository.save(r);
            auditService.logStatusChange("MaterialReservation", r.getId(), "ACTIVE", "EXPIRED");
            log.info("Резервирование истекло: {}", r.getId());
        }
    }

    // ========================================================================
    // Supplier Ratings
    // ========================================================================

    @Transactional(readOnly = true)
    public List<SupplierRatingResponse> getRatingsForSupplier(UUID supplierId) {
        return supplierRatingRepository.findBySupplierIdAndDeletedFalseOrderByPeriodIdDesc(supplierId)
                .stream().map(SupplierRatingResponse::fromEntity).toList();
    }

    @Transactional
    public SupplierRatingResponse createRating(CreateSupplierRatingRequest request) {
        SupplierRating sr = SupplierRating.builder()
                .supplierId(request.supplierId())
                .periodId(request.periodId())
                .qualityScore(request.qualityScore())
                .deliveryScore(request.deliveryScore())
                .priceScore(request.priceScore())
                .evaluatedById(request.evaluatedById())
                .comments(request.comments())
                .build();

        sr.recalculateOverall();
        sr = supplierRatingRepository.save(sr);
        auditService.logCreate("SupplierRating", sr.getId());

        log.info("Оценка поставщика создана: {} за период {}", request.supplierId(), request.periodId());
        return SupplierRatingResponse.fromEntity(sr);
    }

    @Transactional
    public SupplierRatingResponse updateRating(UUID id, CreateSupplierRatingRequest request) {
        SupplierRating sr = supplierRatingRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оценка поставщика не найдена: " + id));

        if (request.qualityScore() != null) sr.setQualityScore(request.qualityScore());
        if (request.deliveryScore() != null) sr.setDeliveryScore(request.deliveryScore());
        if (request.priceScore() != null) sr.setPriceScore(request.priceScore());
        if (request.comments() != null) sr.setComments(request.comments());

        sr.recalculateOverall();
        sr = supplierRatingRepository.save(sr);
        auditService.logUpdate("SupplierRating", sr.getId(), "multiple", null, null);

        log.info("Оценка поставщика обновлена: {}", sr.getId());
        return SupplierRatingResponse.fromEntity(sr);
    }

    @Transactional
    public void deleteRating(UUID id) {
        SupplierRating sr = supplierRatingRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оценка поставщика не найдена: " + id));

        sr.softDelete();
        supplierRatingRepository.save(sr);
        auditService.logDelete("SupplierRating", id);
        log.info("Оценка поставщика удалена: {}", id);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private Delivery getDeliveryOrThrow(UUID id) {
        return deliveryRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Доставка не найдена: " + id));
    }

    private DispatchOrder getDispatchOrderOrThrow(UUID id) {
        return dispatchOrderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Заявка на диспетчеризацию не найдена: " + id));
    }

}
