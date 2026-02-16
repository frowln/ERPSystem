package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.planning.service.WbsDependencyService;
import com.privod.platform.modules.planning.web.dto.CreateWbsDependencyRequest;
import com.privod.platform.modules.planning.web.dto.WbsDependencyResponse;
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
@RequestMapping("/api/wbs-dependencies")
@RequiredArgsConstructor
@Tag(name = "WBS Dependencies", description = "Управление зависимостями между узлами WBS")
public class WbsDependencyController {

    private final WbsDependencyService dependencyService;

    @GetMapping
    @Operation(summary = "Получить зависимости по узлу WBS")
    public ResponseEntity<ApiResponse<List<WbsDependencyResponse>>> findByNode(@RequestParam UUID nodeId) {
        List<WbsDependencyResponse> deps = dependencyService.findByNodeId(nodeId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @GetMapping("/project")
    @Operation(summary = "Получить все зависимости проекта")
    public ResponseEntity<ApiResponse<List<WbsDependencyResponse>>> findByProject(@RequestParam UUID projectId) {
        List<WbsDependencyResponse> deps = dependencyService.findByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @GetMapping("/{nodeId}/predecessors")
    @Operation(summary = "Получить предшественников узла")
    public ResponseEntity<ApiResponse<List<WbsDependencyResponse>>> getPredecessors(@PathVariable UUID nodeId) {
        List<WbsDependencyResponse> deps = dependencyService.findPredecessors(nodeId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @GetMapping("/{nodeId}/successors")
    @Operation(summary = "Получить последователей узла")
    public ResponseEntity<ApiResponse<List<WbsDependencyResponse>>> getSuccessors(@PathVariable UUID nodeId) {
        List<WbsDependencyResponse> deps = dependencyService.findSuccessors(nodeId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать зависимость между узлами WBS")
    public ResponseEntity<ApiResponse<WbsDependencyResponse>> create(
            @Valid @RequestBody CreateWbsDependencyRequest request) {
        WbsDependencyResponse response = dependencyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить зависимость WBS")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        dependencyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
