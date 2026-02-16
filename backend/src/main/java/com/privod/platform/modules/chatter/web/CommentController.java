package com.privod.platform.modules.chatter.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.chatter.service.CommentService;
import com.privod.platform.modules.chatter.web.dto.CommentResponse;
import com.privod.platform.modules.chatter.web.dto.CreateCommentRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/chatter/comments")
@RequiredArgsConstructor
@Tag(name = "Chatter - Comments", description = "Comment management for entity discussions")
@PreAuthorize("isAuthenticated()")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Create a comment on an entity")
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse response = commentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List comments for an entity")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) Boolean isInternal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CommentResponse> page = commentService.getComments(entityType, entityId, isInternal, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}/replies")
    @Operation(summary = "List replies to a comment")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> listReplies(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CommentResponse> page = commentService.getReplies(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a comment's content")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        CommentResponse response = commentService.update(id, body.get("content"));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        commentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
