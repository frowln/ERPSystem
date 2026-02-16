package com.privod.platform.modules.support.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.support.domain.TicketStatus;
import com.privod.platform.modules.support.service.SupportTicketService;
import com.privod.platform.modules.support.web.dto.CreateSupportTicketRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCommentRequest;
import com.privod.platform.modules.support.web.dto.SupportTicketResponse;
import com.privod.platform.modules.support.web.dto.TicketCommentResponse;
import com.privod.platform.modules.support.web.dto.TicketDashboardResponse;
import com.privod.platform.modules.support.web.dto.UpdateSupportTicketRequest;
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
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
@Tag(name = "Support Tickets", description = "Support ticket management endpoints")
public class SupportTicketController {

    private final SupportTicketService ticketService;

    @GetMapping
    @Operation(summary = "List support tickets with optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<SupportTicketResponse>>> list(
            @RequestParam(required = false) TicketStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SupportTicketResponse> page = ticketService.listTickets(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get support ticket by ID")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> getById(@PathVariable UUID id) {
        SupportTicketResponse response = ticketService.getTicket(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create a new support ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> create(
            @Valid @RequestBody CreateSupportTicketRequest request) {
        SupportTicketResponse response = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Update a support ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupportTicketRequest request) {
        SupportTicketResponse response = ticketService.updateTicket(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Assign a ticket to a user")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> assign(
            @PathVariable UUID id,
            @RequestParam UUID assigneeId) {
        SupportTicketResponse response = ticketService.assignTicket(id, assigneeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Start working on a ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> start(@PathVariable UUID id) {
        SupportTicketResponse response = ticketService.startProgress(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Resolve a ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> resolve(@PathVariable UUID id) {
        SupportTicketResponse response = ticketService.resolveTicket(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Close a resolved ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> close(@PathVariable UUID id) {
        SupportTicketResponse response = ticketService.closeTicket(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Delete a support ticket (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Comments ----

    @GetMapping("/{ticketId}/comments")
    @Operation(summary = "Get comments for a ticket")
    public ResponseEntity<ApiResponse<List<TicketCommentResponse>>> getComments(
            @PathVariable UUID ticketId) {
        List<TicketCommentResponse> comments = ticketService.getTicketComments(ticketId);
        return ResponseEntity.ok(ApiResponse.ok(comments));
    }

    @PostMapping("/{ticketId}/comments")
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<ApiResponse<TicketCommentResponse>> addComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody CreateTicketCommentRequest request) {
        TicketCommentResponse response = ticketService.addComment(ticketId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    // ---- Dashboard & My Tickets ----

    @GetMapping("/dashboard")
    @Operation(summary = "Get ticket dashboard statistics")
    public ResponseEntity<ApiResponse<TicketDashboardResponse>> getDashboard() {
        TicketDashboardResponse response = ticketService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get tickets reported by current user")
    public ResponseEntity<ApiResponse<PageResponse<SupportTicketResponse>>> getMyTickets(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SupportTicketResponse> page = ticketService.getMyTickets(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/assigned")
    @Operation(summary = "Get tickets assigned to a user")
    public ResponseEntity<ApiResponse<PageResponse<SupportTicketResponse>>> getAssigned(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SupportTicketResponse> page = ticketService.getAssignedTickets(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
