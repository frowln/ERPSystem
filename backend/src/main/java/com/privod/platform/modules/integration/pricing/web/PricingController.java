package com.privod.platform.modules.integration.pricing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.pricing.service.PricingService;
import com.privod.platform.modules.integration.pricing.web.dto.CreatePriceIndexRequest;
import com.privod.platform.modules.integration.pricing.web.dto.CreatePricingDatabaseRequest;
import com.privod.platform.modules.integration.pricing.web.dto.ImportQuarterlyPriceIndicesRequest;
import com.privod.platform.modules.integration.pricing.web.dto.PriceCalculationResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PriceIndexResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PricingImportReportResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PriceRateResponse;
import com.privod.platform.modules.integration.pricing.web.dto.PricingDatabaseResponse;
import com.privod.platform.modules.integration.pricing.web.dto.QuarterlyIndexImportResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/pricing")
@RequiredArgsConstructor
@Tag(name = "Pricing Integration", description = "Интеграция с базами расценок ФЕР/ТЕР")
public class PricingController {

    private final PricingService pricingService;

    // === Pricing Databases ===

    @GetMapping("/databases")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Список баз расценок")
    public ResponseEntity<ApiResponse<PageResponse<PricingDatabaseResponse>>> listDatabases(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PricingDatabaseResponse> page = pricingService.listDatabases(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/databases")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать базу расценок")
    public ResponseEntity<ApiResponse<PricingDatabaseResponse>> createDatabase(
            @Valid @RequestBody CreatePricingDatabaseRequest request) {
        PricingDatabaseResponse response = pricingService.createDatabase(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/databases/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить базу расценок по ID")
    public ResponseEntity<ApiResponse<PricingDatabaseResponse>> getDatabase(@PathVariable UUID id) {
        PricingDatabaseResponse response = pricingService.getDatabase(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Price Rates ===

    @GetMapping("/rates")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Поиск расценок")
    public ResponseEntity<ApiResponse<PageResponse<PriceRateResponse>>> searchRates(
            @RequestParam(required = false) UUID databaseId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PriceRateResponse> page = pricingService.searchRates(search, databaseId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/rates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить расценку по ID")
    public ResponseEntity<ApiResponse<PriceRateResponse>> getRateById(@PathVariable UUID id) {
        PriceRateResponse response = pricingService.getRateById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/rates/import")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Импорт расценок из CSV")
    public ResponseEntity<ApiResponse<PricingImportReportResponse>> importRates(
            @RequestParam UUID databaseId,
            @RequestParam("file") MultipartFile file) throws IOException {
        PricingImportReportResponse report = pricingService.importRatesWithReport(databaseId, file.getInputStream());
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/rates/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR')")
    @Operation(summary = "Экспорт расценок в CSV")
    public ResponseEntity<byte[]> exportRates(@RequestParam UUID databaseId) {
        byte[] data = pricingService.exportRatesToExcel(databaseId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "rates_" + databaseId + ".csv");

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    // === Price Indices ===

    @GetMapping("/indices")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить индексы пересчёта")
    public ResponseEntity<ApiResponse<PageResponse<PriceIndexResponse>>> getIndices(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String workType,
            @PageableDefault(size = 20, sort = "targetQuarter", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PriceIndexResponse> page = pricingService.getIndices(region, workType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/indices")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Добавить индекс пересчёта")
    public ResponseEntity<ApiResponse<PriceIndexResponse>> createIndex(
            @Valid @RequestBody CreatePriceIndexRequest request) {
        PriceIndexResponse response = pricingService.createIndex(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/indices/import-quarterly")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Импорт квартальных индексов Минстроя")
    public ResponseEntity<ApiResponse<QuarterlyIndexImportResponse>> importQuarterlyIndices(
            @Valid @RequestBody ImportQuarterlyPriceIndicesRequest request) {
        QuarterlyIndexImportResponse response = pricingService.importQuarterlyIndices(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Price Calculation ===

    @GetMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER')")
    @Operation(summary = "Расчёт текущей стоимости с индексами пересчёта")
    public ResponseEntity<ApiResponse<PriceCalculationResponse>> calculatePrice(
            @RequestParam UUID rateId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String region) {
        PriceCalculationResponse response = pricingService.calculateCurrentPrice(rateId, quantity, region);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
