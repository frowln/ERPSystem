package com.privod.platform.modules.procurementExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrder;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrderItem;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrderStatus;
import com.privod.platform.modules.procurementExt.service.PurchaseOrderService;
import com.privod.platform.modules.procurementExt.web.dto.CreatePurchaseOrderWithItemsRequest;
import com.privod.platform.modules.procurementExt.web.dto.PurchaseOrderBulkTransitionRequest;
import com.privod.platform.modules.procurementExt.web.dto.PurchaseOrderBulkTransitionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/procurement/purchase-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER', 'PROJECT_MANAGER')")
@Tag(name = "Purchase Orders", description = "Заказы поставщикам")
public class PurchaseOrderController {

    private final PurchaseOrderService orderService;

    @GetMapping
    @Operation(summary = "Список заказов поставщикам с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseOrder>>> list(
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) UUID purchaseRequestId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PurchaseOrder> page = orderService.listOrders(status, projectId, supplierId, purchaseRequestId, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить заказ по ID")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(id)));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Позиции заказа")
    public ResponseEntity<ApiResponse<List<PurchaseOrderItem>>> getItems(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderItems(id)));
    }

    @PostMapping
    @Operation(summary = "Создать заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrder>> create(@Valid @RequestBody PurchaseOrder order) {
        PurchaseOrder created = orderService.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PostMapping("/with-items")
    @Operation(summary = "Создать заказ поставщику с позициями (одной транзакцией)")
    public ResponseEntity<ApiResponse<PurchaseOrder>> createWithItems(
            @Valid @RequestBody CreatePurchaseOrderWithItemsRequest request) {
        PurchaseOrder order = PurchaseOrder.builder()
                .orderNumber(request.orderNumber())
                .projectId(request.projectId())
                .purchaseRequestId(request.purchaseRequestId())
                .contractId(request.contractId())
                .supplierId(request.supplierId())
                .orderDate(request.orderDate())
                .expectedDeliveryDate(request.expectedDeliveryDate())
                .currency(request.currency())
                .paymentTerms(request.paymentTerms())
                .deliveryAddress(request.deliveryAddress())
                .notes(request.notes())
                .build();

        List<PurchaseOrderItem> items = request.items().stream()
                .map(item -> PurchaseOrderItem.builder()
                        .materialId(item.materialId())
                        .materialName(item.materialName())
                        .unit(item.unit())
                        .quantity(item.quantity())
                        .unitPrice(item.unitPrice())
                        .vatRate(item.vatRate())
                        .specificationItemId(item.specificationItemId())
                        .build())
                .toList();

        PurchaseOrder created = orderService.createOrderWithItems(order, items);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить заказ (только черновик)")
    public ResponseEntity<ApiResponse<PurchaseOrder>> update(@PathVariable UUID id,
                                                               @Valid @RequestBody PurchaseOrder updates) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.updateOrder(id, updates)));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Добавить позицию в заказ")
    public ResponseEntity<ApiResponse<PurchaseOrderItem>> addItem(@PathVariable UUID id,
                                                                    @Valid @RequestBody PurchaseOrderItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(orderService.addItem(id, item)));
    }

    @PutMapping("/{id}/items/{itemId}")
    @Operation(summary = "Обновить позицию заказа")
    public ResponseEntity<ApiResponse<PurchaseOrderItem>> updateItem(@PathVariable UUID id,
                                                                     @PathVariable UUID itemId,
                                                                     @Valid @RequestBody PurchaseOrderItem updates) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.updateItem(id, itemId, updates)));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @Operation(summary = "Удалить позицию из заказа")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID id,
                                                         @PathVariable UUID itemId) {
        orderService.deleteItem(id, itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Отправить заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrder>> send(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.sendOrder(id)));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Подтвердить заказ")
    public ResponseEntity<ApiResponse<PurchaseOrder>> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.confirmOrder(id)));
    }

    @PostMapping("/{id}/delivery")
    @Operation(summary = "Зарегистрировать поставку по позиции")
    public ResponseEntity<ApiResponse<PurchaseOrder>> registerDelivery(
            @PathVariable UUID id,
            @RequestParam UUID itemId,
            @RequestParam BigDecimal deliveredQuantity) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.registerDelivery(id, itemId, deliveredQuantity)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Отменить заказ")
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.cancelOrder(id)));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Закрыть заказ")
    public ResponseEntity<ApiResponse<PurchaseOrder>> close(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.closeOrder(id)));
    }

    @PostMapping("/{id}/invoice")
    @Operation(summary = "Пометить заказ как оплаченный")
    public ResponseEntity<ApiResponse<PurchaseOrder>> invoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.invoiceOrder(id)));
    }

    @PostMapping("/bulk-transition")
    @Operation(summary = "Массовое изменение статусов заказов поставщикам")
    public ResponseEntity<ApiResponse<PurchaseOrderBulkTransitionResponse>> bulkTransition(
            @Valid @RequestBody PurchaseOrderBulkTransitionRequest request) {
        PurchaseOrderBulkTransitionResponse response =
                orderService.bulkTransitionOrders(request.action(), request.orderIds());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить заказ (только черновик)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
