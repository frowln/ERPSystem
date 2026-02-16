package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.WbsNodeService;
import com.privod.platform.modules.planning.web.dto.CreateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.UpdateWbsNodeRequest;
import com.privod.platform.modules.planning.web.dto.WbsNodeResponse;
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
@RequestMapping("/api/wbs-nodes")
@RequiredArgsConstructor
@Tag(name = "WBS Nodes", description = "Управление узлами иерархической структуры работ")
public class WbsNodeController {

    private final WbsNodeService wbsNodeService;

    @GetMapping
    @Operation(summary = "Получить узлы WBS проекта с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<WbsNodeResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "sortOrder", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<WbsNodeResponse> page = wbsNodeService.findByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить узел WBS по ID")
    public ResponseEntity<ApiResponse<WbsNodeResponse>> getById(@PathVariable UUID id) {
        WbsNodeResponse response = wbsNodeService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/tree")
    @Operation(summary = "Получить дерево корневых узлов WBS проекта")
    public ResponseEntity<ApiResponse<List<WbsNodeResponse>>> getTree(@RequestParam UUID projectId) {
        List<WbsNodeResponse> tree = wbsNodeService.findTree(projectId);
        return ResponseEntity.ok(ApiResponse.ok(tree));
    }

    @GetMapping("/{parentId}/children")
    @Operation(summary = "Получить дочерние узлы WBS")
    public ResponseEntity<ApiResponse<List<WbsNodeResponse>>> getChildren(@PathVariable UUID parentId) {
        List<WbsNodeResponse> children = wbsNodeService.findChildren(parentId);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @GetMapping("/critical-path")
    @Operation(summary = "Получить узлы критического пути проекта")
    public ResponseEntity<ApiResponse<List<WbsNodeResponse>>> getCriticalPath(@RequestParam UUID projectId) {
        List<WbsNodeResponse> criticalPath = wbsNodeService.findCriticalPath(projectId);
        return ResponseEntity.ok(ApiResponse.ok(criticalPath));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать узел WBS")
    public ResponseEntity<ApiResponse<WbsNodeResponse>> create(
            @Valid @RequestBody CreateWbsNodeRequest request) {
        WbsNodeResponse response = wbsNodeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Обновить узел WBS")
    public ResponseEntity<ApiResponse<WbsNodeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWbsNodeRequest request) {
        WbsNodeResponse response = wbsNodeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить узел WBS (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        wbsNodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/cpm/forward-pass")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Запустить прямой проход CPM")
    public ResponseEntity<ApiResponse<Void>> forwardPass(@RequestParam UUID projectId) {
        wbsNodeService.calculateForwardPass(projectId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/cpm/backward-pass")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Запустить обратный проход CPM")
    public ResponseEntity<ApiResponse<Void>> backwardPass(@RequestParam UUID projectId) {
        wbsNodeService.calculateBackwardPass(projectId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
