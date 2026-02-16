package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.service.NumberSequenceService;
import com.privod.platform.modules.settings.web.dto.NumberSequenceResponse;
import com.privod.platform.modules.settings.web.dto.UpdateNumberSequenceRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/sequences")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Number Sequences", description = "Управление нумераторами")
public class NumberSequenceController {

    private final NumberSequenceService numberSequenceService;

    @GetMapping
    @Operation(summary = "Список всех нумераторов")
    public ResponseEntity<ApiResponse<List<NumberSequenceResponse>>> listAll() {
        List<NumberSequenceResponse> sequences = numberSequenceService.listAll();
        return ResponseEntity.ok(ApiResponse.ok(sequences));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить нумератор по ID")
    public ResponseEntity<ApiResponse<NumberSequenceResponse>> getById(@PathVariable UUID id) {
        NumberSequenceResponse response = numberSequenceService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Получить нумератор по коду")
    public ResponseEntity<ApiResponse<NumberSequenceResponse>> getByCode(@PathVariable String code) {
        NumberSequenceResponse response = numberSequenceService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить нумератор")
    public ResponseEntity<ApiResponse<NumberSequenceResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNumberSequenceRequest request) {
        NumberSequenceResponse response = numberSequenceService.updateSequence(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/code/{code}/next")
    @Operation(summary = "Получить следующий номер из нумератора")
    public ResponseEntity<ApiResponse<Map<String, String>>> getNextNumber(@PathVariable String code) {
        String nextNumber = numberSequenceService.getNextNumber(code);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("number", nextNumber)));
    }
}
