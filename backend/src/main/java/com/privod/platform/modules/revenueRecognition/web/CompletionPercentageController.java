package com.privod.platform.modules.revenueRecognition.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.revenueRecognition.service.CompletionPercentageService;
import com.privod.platform.modules.revenueRecognition.web.dto.CompletionPercentageResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateCompletionPercentageRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/completion-percentages")
@RequiredArgsConstructor
@Tag(name = "Completion Percentages", description = "Completion percentage tracking for revenue contracts")
public class CompletionPercentageController {

    private final CompletionPercentageService completionPercentageService;

    @GetMapping
    @Operation(summary = "List completion percentages by revenue contract")
    public ResponseEntity<ApiResponse<PageResponse<CompletionPercentageResponse>>> list(
            @RequestParam UUID revenueContractId,
            @PageableDefault(size = 20, sort = "calculationDate", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<CompletionPercentageResponse> page = completionPercentageService.listByContract(
                revenueContractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get completion percentage by ID")
    public ResponseEntity<ApiResponse<CompletionPercentageResponse>> getById(@PathVariable UUID id) {
        CompletionPercentageResponse response = completionPercentageService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/latest")
    @Operation(summary = "Get the latest completion percentage for a revenue contract")
    public ResponseEntity<ApiResponse<CompletionPercentageResponse>> getLatest(
            @RequestParam UUID revenueContractId) {
        CompletionPercentageResponse response = completionPercentageService.getLatest(revenueContractId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new completion percentage record")
    public ResponseEntity<ApiResponse<CompletionPercentageResponse>> create(
            @Valid @RequestBody CreateCompletionPercentageRequest request) {
        CompletionPercentageResponse response = completionPercentageService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a completion percentage record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        completionPercentageService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
