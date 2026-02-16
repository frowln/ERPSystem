package com.privod.platform.modules.permission.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.permission.domain.AccessOperation;
import com.privod.platform.modules.permission.service.ModelAccessService;
import com.privod.platform.modules.permission.web.dto.ModelAccessResponse;
import com.privod.platform.modules.permission.web.dto.SetModelAccessRequest;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/model-access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Model Access", description = "Управление доступом к моделям данных")
public class ModelAccessController {

    private final ModelAccessService modelAccessService;

    @PostMapping
    @Operation(summary = "Установить доступ к модели для группы")
    public ResponseEntity<ApiResponse<ModelAccessResponse>> setAccess(
            @Valid @RequestBody SetModelAccessRequest request) {
        ModelAccessResponse response = modelAccessService.setAccess(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/model/{modelName}")
    @Operation(summary = "Получить все правила доступа для модели")
    public ResponseEntity<ApiResponse<List<ModelAccessResponse>>> getByModel(
            @PathVariable String modelName) {
        List<ModelAccessResponse> rules = modelAccessService.getAccessByModel(modelName);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Получить все правила доступа для группы")
    public ResponseEntity<ApiResponse<List<ModelAccessResponse>>> getByGroup(
            @PathVariable UUID groupId) {
        List<ModelAccessResponse> rules = modelAccessService.getAccessByGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/model/{modelName}/group/{groupId}")
    @Operation(summary = "Получить конкретное правило доступа")
    public ResponseEntity<ApiResponse<ModelAccessResponse>> getAccess(
            @PathVariable String modelName,
            @PathVariable UUID groupId) {
        ModelAccessResponse response = modelAccessService.getAccess(modelName, groupId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/check")
    @Operation(summary = "Проверить доступ пользователя к модели")
    public ResponseEntity<ApiResponse<Boolean>> checkAccess(
            @RequestParam UUID userId,
            @RequestParam String modelName,
            @RequestParam AccessOperation operation) {
        boolean hasAccess = modelAccessService.checkAccess(userId, modelName, operation);
        return ResponseEntity.ok(ApiResponse.ok(hasAccess));
    }

    @GetMapping("/models")
    @Operation(summary = "Получить список всех моделей с правилами доступа")
    public ResponseEntity<ApiResponse<List<String>>> getAllModels() {
        List<String> models = modelAccessService.getAllModelNames();
        return ResponseEntity.ok(ApiResponse.ok(models));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить правило доступа к модели")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        modelAccessService.deleteAccess(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
