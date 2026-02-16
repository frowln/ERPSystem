package com.privod.platform.modules.russianDoc.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.russianDoc.service.OcrService;
import com.privod.platform.modules.russianDoc.web.dto.CreateOcrTaskRequest;
import com.privod.platform.modules.russianDoc.web.dto.OcrTaskResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
@Tag(name = "OCR", description = "Document recognition (OCR) task management")
public class OcrController {

    private final OcrService ocrService;

    @GetMapping("/tasks")
    @Operation(summary = "List OCR tasks with pagination")
    public ResponseEntity<ApiResponse<PageResponse<OcrTaskResponse>>> listTasks(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OcrTaskResponse> page = ocrService.listTasks(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/tasks/{id}")
    @Operation(summary = "Get OCR task by ID")
    public ResponseEntity<ApiResponse<OcrTaskResponse>> getTask(@PathVariable UUID id) {
        OcrTaskResponse response = ocrService.getTask(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new OCR task")
    public ResponseEntity<ApiResponse<OcrTaskResponse>> createTask(
            @Valid @RequestBody CreateOcrTaskRequest request) {
        OcrTaskResponse response = ocrService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/tasks/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Start processing an OCR task")
    public ResponseEntity<ApiResponse<OcrTaskResponse>> startProcessing(@PathVariable UUID id) {
        OcrTaskResponse response = ocrService.startProcessing(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/tasks/pending")
    @Operation(summary = "Get all pending OCR tasks")
    public ResponseEntity<ApiResponse<List<OcrTaskResponse>>> getPendingTasks() {
        List<OcrTaskResponse> tasks = ocrService.getPendingTasks();
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Delete an OCR task (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        ocrService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
