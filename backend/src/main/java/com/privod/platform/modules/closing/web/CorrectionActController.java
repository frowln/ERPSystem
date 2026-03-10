package com.privod.platform.modules.closing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.closing.service.ClosingDocumentService;
import com.privod.platform.modules.closing.web.dto.CorrectionActResponse;
import com.privod.platform.modules.closing.web.dto.CreateCorrectionActRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/correction-acts")
@RequiredArgsConstructor
@Tag(name = "Корректировочные акты", description = "Управление корректировочными актами КС-2")
public class CorrectionActController {

    private final ClosingDocumentService closingDocumentService;

    @GetMapping
    @Operation(summary = "Получить список корректировочных актов")
    public ResponseEntity<ApiResponse<List<CorrectionActResponse>>> list() {
        List<CorrectionActResponse> acts = closingDocumentService.getCorrectionActs();
        return ResponseEntity.ok(ApiResponse.ok(acts));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Создать корректировочный акт")
    public ResponseEntity<ApiResponse<CorrectionActResponse>> create(
            @Valid @RequestBody CreateCorrectionActRequest request) {
        CorrectionActResponse response = closingDocumentService.createCorrectionAct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
