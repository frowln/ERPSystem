package com.privod.platform.modules.permission.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.permission.service.PermissionGroupService;
import com.privod.platform.modules.permission.web.dto.CreatePermissionGroupRequest;
import com.privod.platform.modules.permission.web.dto.PermissionGroupResponse;
import com.privod.platform.modules.permission.web.dto.UpdatePermissionGroupRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/permission-groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Permission Groups", description = "Управление группами прав доступа")
public class PermissionGroupController {

    private final PermissionGroupService groupService;

    @GetMapping
    @Operation(summary = "Список групп прав с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<PermissionGroupResponse>>> list(
            @PageableDefault(size = 20, sort = "sequence", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PermissionGroupResponse> page = groupService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/active")
    @Operation(summary = "Список всех активных групп прав")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> listActive() {
        List<PermissionGroupResponse> groups = groupService.findAllActive();
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить группу прав по ID")
    public ResponseEntity<ApiResponse<PermissionGroupResponse>> getById(@PathVariable UUID id) {
        PermissionGroupResponse response = groupService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Получить группы по категории")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> getByCategory(
            @PathVariable String category) {
        List<PermissionGroupResponse> groups = groupService.findByCategory(category);
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Получить дочерние группы")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> getChildren(@PathVariable UUID id) {
        List<PermissionGroupResponse> children = groupService.findChildren(id);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @GetMapping("/{id}/hierarchy")
    @Operation(summary = "Получить иерархию группы (от корневой до текущей)")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> getHierarchy(@PathVariable UUID id) {
        List<PermissionGroupResponse> hierarchy = groupService.getGroupHierarchy(id);
        return ResponseEntity.ok(ApiResponse.ok(hierarchy));
    }

    @GetMapping("/search")
    @Operation(summary = "Поиск групп по имени")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> search(
            @RequestParam String query) {
        List<PermissionGroupResponse> results = groupService.search(query);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PostMapping
    @Operation(summary = "Создать новую группу прав")
    public ResponseEntity<ApiResponse<PermissionGroupResponse>> create(
            @Valid @RequestBody CreatePermissionGroupRequest request) {
        PermissionGroupResponse response = groupService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить группу прав")
    public ResponseEntity<ApiResponse<PermissionGroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePermissionGroupRequest request) {
        PermissionGroupResponse response = groupService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить группу прав (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        groupService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
