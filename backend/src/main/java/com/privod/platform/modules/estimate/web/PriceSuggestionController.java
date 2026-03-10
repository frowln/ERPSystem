package com.privod.platform.modules.estimate.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.estimate.service.PriceSuggestionService;
import com.privod.platform.modules.estimate.web.dto.PriceSuggestionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
@Tag(name = "Estimates - Price Suggestion", description = "AI-assisted price suggestions based on historical data")
public class PriceSuggestionController {

    private final PriceSuggestionService priceSuggestionService;

    @GetMapping("/price-suggestion")
    @Operation(summary = "Get price suggestions based on item name similarity")
    public ResponseEntity<ApiResponse<PriceSuggestionResponse>> getPriceSuggestion(
            @RequestParam String name) {
        PriceSuggestionResponse response = priceSuggestionService.getSuggestions(name);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
