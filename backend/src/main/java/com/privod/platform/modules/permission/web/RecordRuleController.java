package com.privod.platform.modules.permission.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.permission.service.RecordRuleService;
import com.privod.platform.modules.permission.web.dto.CreateRecordRuleRequest;
import com.privod.platform.modules.permission.web.dto.RecordRuleResponse;
import com.privod.platform.modules.permission.web.dto.UpdateRecordRuleRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/record-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Record Rules", description = "Управление правилами записей (Odoo-style domain rules)")
public class RecordRuleController {

    private final RecordRuleService recordRuleService;

    @PostMapping
    @Operation(summary = "Создать правило записи")
    public ResponseEntity<ApiResponse<RecordRuleResponse>> create(
            @Valid @RequestBody CreateRecordRuleRequest request) {
        RecordRuleResponse response = recordRuleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить правило записи")
    public ResponseEntity<ApiResponse<RecordRuleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRecordRuleRequest request) {
        RecordRuleResponse response = recordRuleService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить правило записи по ID")
    public ResponseEntity<ApiResponse<RecordRuleResponse>> getById(@PathVariable UUID id) {
        RecordRuleResponse response = recordRuleService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/model/{modelName}")
    @Operation(summary = "Получить правила записи для модели")
    public ResponseEntity<ApiResponse<List<RecordRuleResponse>>> getByModel(
            @PathVariable String modelName) {
        List<RecordRuleResponse> rules = recordRuleService.findByModel(modelName);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Получить правила записи для группы")
    public ResponseEntity<ApiResponse<List<RecordRuleResponse>>> getByGroup(
            @PathVariable UUID groupId) {
        List<RecordRuleResponse> rules = recordRuleService.findByGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/applicable")
    @Operation(summary = "Получить применимые правила для пользователя и модели")
    public ResponseEntity<ApiResponse<List<RecordRuleResponse>>> getApplicable(
            @RequestParam UUID userId,
            @RequestParam String modelName) {
        List<RecordRuleResponse> rules = recordRuleService.getApplicableRules(userId, modelName);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить правило записи (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        recordRuleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
