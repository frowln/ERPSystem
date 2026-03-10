package com.privod.platform.modules.closing.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.closing.service.ClosingDocumentService;
import com.privod.platform.modules.closing.web.dto.Ks6aEntryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ks6a")
@RequiredArgsConstructor
@Tag(name = "КС-6а", description = "Журнал учёта выполненных работ (КС-6а)")
public class Ks6aController {

    private final ClosingDocumentService closingDocumentService;

    @GetMapping
    @Operation(summary = "Получить записи журнала КС-6а по проекту и году")
    public ResponseEntity<ApiResponse<List<Ks6aEntryResponse>>> getEntries(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Integer year) {
        List<Ks6aEntryResponse> entries = closingDocumentService.getKs6aEntries(projectId, year);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }
}
