package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.domain.OrderType;
import com.privod.platform.modules.hrRussian.service.EmploymentOrderService;
import com.privod.platform.modules.hrRussian.web.dto.CreateEmploymentOrderRequest;
import com.privod.platform.modules.hrRussian.web.dto.EmploymentOrderResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr-russian/orders")
@RequiredArgsConstructor
@Tag(name = "Employment Orders", description = "Кадровые приказы (РФ)")
public class EmploymentOrderController {

    private final EmploymentOrderService orderService;

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get orders by employee")
    public ResponseEntity<ApiResponse<List<EmploymentOrderResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        List<EmploymentOrderResponse> orders = orderService.getByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping
    @Operation(summary = "List orders with optional type filter and pagination")
    public ResponseEntity<ApiResponse<PageResponse<EmploymentOrderResponse>>> list(
            @RequestParam(required = false) OrderType orderType,
            @PageableDefault(size = 20, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EmploymentOrderResponse> page = orderService.listOrders(orderType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new employment order")
    public ResponseEntity<ApiResponse<EmploymentOrderResponse>> create(
            @Valid @RequestBody CreateEmploymentOrderRequest request) {
        EmploymentOrderResponse response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete an employment order")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
