package com.privod.platform.modules.procurement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.procurement.service.ProcurementDirectoryService;
import com.privod.platform.modules.procurement.web.dto.ProcurementSupplierOptionResponse;
import com.privod.platform.modules.procurement.web.dto.SendPriceRequestsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/procurement")
@RequiredArgsConstructor
@Tag(name = "Procurement Directories", description = "Справочники и сервисные операции закупок")
public class ProcurementDirectoryController {

    private final ProcurementDirectoryService procurementDirectoryService;

    @GetMapping("/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER', 'SUPPLY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Получить список поставщиков для модулей закупок")
    public ResponseEntity<ApiResponse<List<ProcurementSupplierOptionResponse>>> suppliers() {
        List<ProcurementSupplierOptionResponse> response = procurementDirectoryService.listSuppliers();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/price-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER', 'SUPPLY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Отправить запросы цен поставщикам")
    public ResponseEntity<ApiResponse<Void>> sendPriceRequests(
            @Valid @RequestBody SendPriceRequestsRequest request) {
        procurementDirectoryService.sendPriceRequests(request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
