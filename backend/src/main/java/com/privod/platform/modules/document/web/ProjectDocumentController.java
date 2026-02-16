package com.privod.platform.modules.document.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.service.DocumentService;
import com.privod.platform.modules.document.web.dto.DocumentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/projects/{projectId}/documents")
@RequiredArgsConstructor
@Tag(name = "Project Documents", description = "Project-scoped document endpoints")
@PreAuthorize("isAuthenticated()")
public class ProjectDocumentController {

    private final DocumentService documentService;

    @GetMapping
    @Operation(summary = "Get documents for a specific project")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getProjectDocuments(
            @PathVariable UUID projectId,
            @RequestParam(required = false) DocumentCategory category) {
        List<DocumentResponse> documents = documentService.getProjectDocuments(projectId, category);
        return ResponseEntity.ok(ApiResponse.ok(documents));
    }
}
