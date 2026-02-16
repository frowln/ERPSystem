package com.privod.platform.modules.permission.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.permission.service.FieldAccessService;
import com.privod.platform.modules.permission.web.dto.FieldAccessResponse;
import com.privod.platform.modules.permission.web.dto.SetFieldAccessRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/field-access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Field Access", description = "Управление доступом к полям моделей")
public class FieldAccessController {

    private final FieldAccessService fieldAccessService;

    @PostMapping
    @Operation(summary = "Установить доступ к полю для группы")
    public ResponseEntity<ApiResponse<FieldAccessResponse>> setAccess(
            @Valid @RequestBody SetFieldAccessRequest request) {
        FieldAccessResponse response = fieldAccessService.setFieldAccess(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/model/{modelName}/field/{fieldName}")
    @Operation(summary = "Получить правила доступа к полю для всех групп")
    public ResponseEntity<ApiResponse<List<FieldAccessResponse>>> getByModelAndField(
            @PathVariable String modelName,
            @PathVariable String fieldName) {
        List<FieldAccessResponse> rules = fieldAccessService.getByModelAndField(modelName, fieldName);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/model/{modelName}/group/{groupId}")
    @Operation(summary = "Получить доступ к полям модели для группы")
    public ResponseEntity<ApiResponse<List<FieldAccessResponse>>> getByModelAndGroup(
            @PathVariable String modelName,
            @PathVariable UUID groupId) {
        List<FieldAccessResponse> rules = fieldAccessService.getByModelAndGroup(modelName, groupId);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Получить все правила доступа к полям для группы")
    public ResponseEntity<ApiResponse<List<FieldAccessResponse>>> getByGroup(
            @PathVariable UUID groupId) {
        List<FieldAccessResponse> rules = fieldAccessService.getByGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/check")
    @Operation(summary = "Проверить доступ пользователя к полю")
    public ResponseEntity<ApiResponse<Boolean>> checkAccess(
            @RequestParam UUID userId,
            @RequestParam String modelName,
            @RequestParam String fieldName,
            @RequestParam(defaultValue = "false") boolean write) {
        boolean hasAccess = fieldAccessService.checkFieldAccess(userId, modelName, fieldName, write);
        return ResponseEntity.ok(ApiResponse.ok(hasAccess));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить правило доступа к полю")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        fieldAccessService.deleteFieldAccess(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
