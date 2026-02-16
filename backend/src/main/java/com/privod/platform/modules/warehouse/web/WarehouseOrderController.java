package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.WarehouseOrder;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderItem;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderStatus;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderType;
import com.privod.platform.modules.warehouse.service.WarehouseOrderService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'PROJECT_MANAGER')")
@Tag(name = "Warehouse Orders", description = "Складские ордера (М-4 приходный, М-11 расходный)")
public class WarehouseOrderController {

    private final WarehouseOrderService orderService;

    @GetMapping
    @Operation(summary = "Список складских ордеров")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseOrder>>> list(
            @RequestParam(required = false) WarehouseOrderStatus status,
            @RequestParam(required = false) WarehouseOrderType orderType,
            @RequestParam(required = false) UUID warehouseId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WarehouseOrder> page = orderService.listOrders(status, orderType, warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить ордер по ID")
    public ResponseEntity<ApiResponse<WarehouseOrder>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(id)));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Позиции ордера")
    public ResponseEntity<ApiResponse<List<WarehouseOrderItem>>> getItems(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderItems(id)));
    }

    @PostMapping
    @Operation(summary = "Создать складской ордер")
    public ResponseEntity<ApiResponse<WarehouseOrder>> create(@Valid @RequestBody WarehouseOrder order) {
        WarehouseOrder created = orderService.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить ордер (только черновик)")
    public ResponseEntity<ApiResponse<WarehouseOrder>> update(@PathVariable UUID id,
                                                                @Valid @RequestBody WarehouseOrder updates) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.updateOrder(id, updates)));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Добавить позицию в ордер")
    public ResponseEntity<ApiResponse<WarehouseOrderItem>> addItem(@PathVariable UUID id,
                                                                     @Valid @RequestBody WarehouseOrderItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(orderService.addItem(id, item)));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Провести ордер")
    public ResponseEntity<ApiResponse<WarehouseOrder>> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.confirmOrder(id)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Отменить ордер")
    public ResponseEntity<ApiResponse<WarehouseOrder>> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.cancelOrder(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить ордер (только черновик)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
