package com.privod.platform.modules.estimate.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.estimate.service.LocalEstimateService;
import com.privod.platform.modules.estimate.web.dto.NormativeSectionResponse;
import com.privod.platform.modules.estimate.web.dto.RateResourceItemResponse;
import com.privod.platform.modules.integration.pricing.service.PricingService;
import com.privod.platform.modules.integration.pricing.web.dto.PriceRateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estimates/normative")
@RequiredArgsConstructor
@Tag(name = "Normative Data (Нормативные данные)", description = "Справочник нормативных баз ГЭСН/ФЕР/ТЕР: разделы, расценки, ресурсный состав")
public class NormativeDataController {

    private final LocalEstimateService localEstimateService;
    private final PricingService pricingService;

    @GetMapping("/sections")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Получить разделы нормативной базы (дерево)")
    public ResponseEntity<ApiResponse<List<NormativeSectionResponse>>> getSections(
            @RequestParam UUID databaseId,
            @RequestParam(required = false) UUID parentId) {
        List<NormativeSectionResponse> sections = localEstimateService.getNormativeSections(databaseId, parentId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    @GetMapping("/rates/{rateId}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Получить ресурсный состав расценки")
    public ResponseEntity<ApiResponse<List<RateResourceItemResponse>>> getRateResources(
            @PathVariable UUID rateId) {
        List<RateResourceItemResponse> resources = localEstimateService.getRateResources(rateId);
        return ResponseEntity.ok(ApiResponse.ok(resources));
    }

    @GetMapping("/rates/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Поиск расценок в нормативной базе")
    public ResponseEntity<ApiResponse<PageResponse<PriceRateResponse>>> searchRates(
            @RequestParam UUID databaseId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PriceRateResponse> page = pricingService.searchRates(query, databaseId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
