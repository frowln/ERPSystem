package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.UnitOfMeasure;
import com.privod.platform.modules.warehouse.service.UnitOfMeasureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/uom")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Units of Measure", description = "ОКЕИ reference catalog — shared across all tenants")
public class UnitOfMeasureController {

    private final UnitOfMeasureService uomService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER')")
    @Operation(summary = "List units of measure (optional ?group= filter)")
    public ResponseEntity<ApiResponse<PageResponse<UnitOfMeasure>>> list(
            @RequestParam(required = false) String group,
            @PageableDefault(size = 50, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<UnitOfMeasure> page = uomService.list(group, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER')")
    @Operation(summary = "Get unit of measure by ID")
    public ResponseEntity<ApiResponse<UnitOfMeasure>> getById(@PathVariable UUID id) {
        UnitOfMeasure uom = uomService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(uom));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new unit of measure (ADMIN only)")
    public ResponseEntity<ApiResponse<UnitOfMeasure>> create(@RequestBody UnitOfMeasure request) {
        UnitOfMeasure created = uomService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a unit of measure (ADMIN only)")
    public ResponseEntity<ApiResponse<UnitOfMeasure>> update(
            @PathVariable UUID id,
            @RequestBody UnitOfMeasure request) {

        UnitOfMeasure updated = uomService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Soft-delete (deactivate) a unit of measure (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        uomService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER')")
    @Operation(summary = "Convert quantity between compatible units",
               description = "GET /api/uom/convert?from=кг&to=т&qty=5000")
    public ResponseEntity<ApiResponse<BigDecimal>> convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam BigDecimal qty) {

        BigDecimal result = uomService.convert(from, to, qty);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
