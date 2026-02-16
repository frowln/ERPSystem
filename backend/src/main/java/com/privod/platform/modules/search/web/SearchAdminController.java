package com.privod.platform.modules.search.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.service.SearchIndexService;
import com.privod.platform.modules.search.web.dto.IndexEntityRequest;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/admin/search")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Search Admin", description = "Search index administration endpoints")
public class SearchAdminController {

    private final SearchIndexService searchIndexService;

    @PostMapping("/index")
    @Operation(summary = "Index an entity for search")
    public ResponseEntity<ApiResponse<SearchIndexResponse>> indexEntity(
            @Valid @RequestBody IndexEntityRequest request) {
        SearchIndexResponse response = searchIndexService.indexEntity(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/index/{entityType}/{entityId}")
    @Operation(summary = "Remove an entity from search index")
    public ResponseEntity<ApiResponse<Void>> removeEntity(
            @PathVariable SearchEntityType entityType,
            @PathVariable UUID entityId) {
        searchIndexService.removeEntity(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/rebuild-index")
    @Operation(summary = "Rebuild search index for a specific entity type or all")
    public ResponseEntity<ApiResponse<Void>> rebuildIndex(
            @RequestParam(required = false) SearchEntityType entityType) {
        if (entityType != null) {
            searchIndexService.rebuildIndex(entityType);
        } else {
            searchIndexService.rebuildAll();
        }
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/status")
    @Operation(summary = "Get search index status and statistics")
    public ResponseEntity<ApiResponse<SearchIndexStatusResponse>> getStatus() {
        SearchIndexStatusResponse status = searchIndexService.getStatus();
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}
