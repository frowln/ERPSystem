package com.privod.platform.modules.document.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.document.service.DrawingMarkupService;
import com.privod.platform.modules.document.web.dto.CreateDrawingMarkupRequest;
import com.privod.platform.modules.document.web.dto.DrawingMarkupResponse;
import com.privod.platform.modules.document.web.dto.UpdateDrawingMarkupRequest;
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
@RequestMapping("/api/documents/{documentId}/markups")
@RequiredArgsConstructor
@Tag(name = "Drawing Markups", description = "Document annotation/markup endpoints")
public class DrawingMarkupController {

    private final DrawingMarkupService markupService;

    @GetMapping
    @Operation(summary = "List markups for a document (optional page filter)")
    public ResponseEntity<ApiResponse<List<DrawingMarkupResponse>>> list(
            @PathVariable UUID documentId,
            @RequestParam(required = false) Integer page) {
        List<DrawingMarkupResponse> markups = markupService.listMarkups(documentId, page);
        return ResponseEntity.ok(ApiResponse.ok(markups));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single markup by ID")
    public ResponseEntity<ApiResponse<DrawingMarkupResponse>> getById(
            @PathVariable UUID documentId,
            @PathVariable UUID id) {
        DrawingMarkupResponse response = markupService.getMarkup(documentId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new markup on the document")
    public ResponseEntity<ApiResponse<DrawingMarkupResponse>> create(
            @PathVariable UUID documentId,
            @Valid @RequestBody CreateDrawingMarkupRequest request) {
        DrawingMarkupResponse response = markupService.createMarkup(documentId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Update an existing markup")
    public ResponseEntity<ApiResponse<DrawingMarkupResponse>> update(
            @PathVariable UUID documentId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDrawingMarkupRequest request) {
        DrawingMarkupResponse response = markupService.updateMarkup(documentId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Soft-delete a markup")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID documentId,
            @PathVariable UUID id) {
        markupService.deleteMarkup(documentId, id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
