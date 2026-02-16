package com.privod.platform.modules.punchlist.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.punchlist.service.PunchListService;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemCommentRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchListRequest;
import com.privod.platform.modules.punchlist.web.dto.PunchItemCommentResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchItemResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchListResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/punchlist")
@RequiredArgsConstructor
@Tag(name = "Punch Lists", description = "Punch list management endpoints")
public class PunchListController {

    private final PunchListService punchListService;

    // ---- Punch Lists ----

    @GetMapping
    @Operation(summary = "List punch lists with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<PunchListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PunchListResponse> page = punchListService.listPunchLists(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get punch list by ID")
    public ResponseEntity<ApiResponse<PunchListResponse>> getById(@PathVariable UUID id) {
        PunchListResponse response = punchListService.getPunchList(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Create a new punch list")
    public ResponseEntity<ApiResponse<PunchListResponse>> create(
            @Valid @RequestBody CreatePunchListRequest request) {
        PunchListResponse response = punchListService.createPunchList(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Update a punch list")
    public ResponseEntity<ApiResponse<PunchListResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePunchListRequest request) {
        PunchListResponse response = punchListService.updatePunchList(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a punch list (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        punchListService.deletePunchList(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER')")
    @Operation(summary = "Mark punch list as completed")
    public ResponseEntity<ApiResponse<PunchListResponse>> complete(@PathVariable UUID id) {
        PunchListResponse response = punchListService.completePunchList(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Items within Punch List ----

    @GetMapping("/{punchListId}/items")
    @Operation(summary = "Get all items in a punch list")
    public ResponseEntity<ApiResponse<List<PunchItemResponse>>> getItems(
            @PathVariable UUID punchListId) {
        List<PunchItemResponse> items = punchListService.getPunchListItems(punchListId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{punchListId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Add an item to a punch list")
    public ResponseEntity<ApiResponse<PunchItemResponse>> addItem(
            @PathVariable UUID punchListId,
            @Valid @RequestBody CreatePunchItemRequest request) {
        PunchItemResponse response = punchListService.addItem(punchListId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/items/{itemId}/fix")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Mark a punch item as fixed")
    public ResponseEntity<ApiResponse<PunchItemResponse>> fixItem(@PathVariable UUID itemId) {
        PunchItemResponse response = punchListService.fixItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/items/{itemId}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER')")
    @Operation(summary = "Verify a fixed punch item")
    public ResponseEntity<ApiResponse<PunchItemResponse>> verifyItem(
            @PathVariable UUID itemId,
            @RequestParam(required = false) UUID verifiedById) {
        PunchItemResponse response = punchListService.verifyItem(itemId, verifiedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/items/{itemId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER')")
    @Operation(summary = "Close a verified punch item")
    public ResponseEntity<ApiResponse<PunchItemResponse>> closeItem(@PathVariable UUID itemId) {
        PunchItemResponse response = punchListService.closeItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a punch item (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID itemId) {
        punchListService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Comments on Items ----

    @GetMapping("/items/{itemId}/comments")
    @Operation(summary = "Get comments for a punch item")
    public ResponseEntity<ApiResponse<List<PunchItemCommentResponse>>> getComments(
            @PathVariable UUID itemId) {
        List<PunchItemCommentResponse> comments = punchListService.getItemComments(itemId);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @PostMapping("/items/{itemId}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Add a comment to a punch item")
    public ResponseEntity<ApiResponse<PunchItemCommentResponse>> addComment(
            @PathVariable UUID itemId,
            @Valid @RequestBody CreatePunchItemCommentRequest request) {
        PunchItemCommentResponse response = punchListService.addComment(itemId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
