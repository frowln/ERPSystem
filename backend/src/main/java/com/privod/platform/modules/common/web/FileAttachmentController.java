package com.privod.platform.modules.common.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.common.service.FileAttachmentService;
import com.privod.platform.modules.common.web.dto.CreateFileAttachmentRequest;
import com.privod.platform.modules.common.web.dto.FileAttachmentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Tag(name = "File Attachments", description = "File attachment management endpoints")
public class FileAttachmentController {

    private final FileAttachmentService fileAttachmentService;

    @GetMapping
    @Operation(summary = "List attachments for an entity")
    public ResponseEntity<ApiResponse<List<FileAttachmentResponse>>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId) {
        List<FileAttachmentResponse> attachments = fileAttachmentService.listAttachments(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok(attachments));
    }

    @PostMapping
    @Operation(summary = "Create a new file attachment (metadata only)")
    public ResponseEntity<ApiResponse<FileAttachmentResponse>> create(
            @Valid @RequestBody CreateFileAttachmentRequest request) {
        FileAttachmentResponse response = fileAttachmentService.createAttachment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file attachment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FileAttachmentResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) String description) {
        FileAttachmentResponse response = fileAttachmentService.uploadAttachment(file, entityType, entityId, description);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/download-url")
    @Operation(summary = "Get a presigned download URL for a file attachment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(@PathVariable UUID id) {
        String url = fileAttachmentService.getDownloadUrl(id);
        return ResponseEntity.ok(ApiResponse.ok(url));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a file attachment")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        fileAttachmentService.deleteAttachment(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
