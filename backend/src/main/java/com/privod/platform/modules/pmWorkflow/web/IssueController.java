package com.privod.platform.modules.pmWorkflow.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.service.IssueService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeIssueStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueCommentRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueCommentResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateIssueRequest;
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
@RequestMapping("/api/pm/issues")
@RequiredArgsConstructor
@Tag(name = "Issues", description = "Управление проблемами и замечаниями проекта")
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    @Operation(summary = "Список проблем с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<IssueResponseDto>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) IssueStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IssueResponseDto> page = issueService.listIssues(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить проблему по ID")
    public ResponseEntity<ApiResponse<IssueResponseDto>> getById(@PathVariable UUID id) {
        IssueResponseDto response = issueService.getIssue(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новую проблему")
    public ResponseEntity<ApiResponse<IssueResponseDto>> create(
            @Valid @RequestBody CreateIssueRequest request) {
        IssueResponseDto response = issueService.createIssue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить проблему")
    public ResponseEntity<ApiResponse<IssueResponseDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIssueRequest request) {
        IssueResponseDto response = issueService.updateIssue(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус проблемы")
    public ResponseEntity<ApiResponse<IssueResponseDto>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeIssueStatusRequest request) {
        IssueResponseDto response = issueService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить проблему (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Issue Comments ========================

    @GetMapping("/{issueId}/comments")
    @Operation(summary = "Список комментариев к проблеме")
    public ResponseEntity<ApiResponse<PageResponse<IssueCommentResponseDto>>> listComments(
            @PathVariable UUID issueId,
            @PageableDefault(size = 20, sort = "postedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IssueCommentResponseDto> page = issueService.listComments(issueId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{issueId}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить комментарий к проблеме")
    public ResponseEntity<ApiResponse<IssueCommentResponseDto>> addComment(
            @PathVariable UUID issueId,
            @Valid @RequestBody CreateIssueCommentRequest request) {
        IssueCommentResponseDto response = issueService.addComment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // ======================== Overdue / SLA ========================

    @GetMapping("/overdue")
    @Operation(summary = "Список просроченных проблем")
    public ResponseEntity<ApiResponse<List<IssueResponseDto>>> findOverdue(
            @RequestParam(required = false) UUID projectId) {
        List<IssueResponseDto> overdue = issueService.findOverdueIssues(projectId);
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }
}
