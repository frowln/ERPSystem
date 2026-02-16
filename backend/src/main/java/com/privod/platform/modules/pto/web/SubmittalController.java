package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.service.SubmittalService;
import com.privod.platform.modules.pto.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalCommentRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pto.web.dto.SubmittalCommentResponse;
import com.privod.platform.modules.pto.web.dto.SubmittalResponse;
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
@RequestMapping("/api/pto/submittals")
@RequiredArgsConstructor
@Tag(name = "Submittals", description = "Управление передачей документации")
public class SubmittalController {

    private final SubmittalService submittalService;

    @GetMapping
    @Operation(summary = "Список передач документации")
    public ResponseEntity<ApiResponse<PageResponse<SubmittalResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) SubmittalStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SubmittalResponse> page = submittalService.listSubmittals(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить передачу по ID")
    public ResponseEntity<ApiResponse<SubmittalResponse>> getById(@PathVariable UUID id) {
        SubmittalResponse response = submittalService.getSubmittal(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать передачу документации")
    public ResponseEntity<ApiResponse<SubmittalResponse>> create(
            @Valid @RequestBody CreateSubmittalRequest request) {
        SubmittalResponse response = submittalService.createSubmittal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус передачи")
    public ResponseEntity<ApiResponse<SubmittalResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeSubmittalStatusRequest request) {
        SubmittalResponse response = submittalService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Получить комментарии к передаче")
    public ResponseEntity<ApiResponse<List<SubmittalCommentResponse>>> getComments(@PathVariable UUID id) {
        List<SubmittalCommentResponse> comments = submittalService.getComments(id);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить комментарий к передаче")
    public ResponseEntity<ApiResponse<SubmittalCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSubmittalCommentRequest request) {
        SubmittalCommentResponse response = submittalService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить передачу")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        submittalService.deleteSubmittal(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
