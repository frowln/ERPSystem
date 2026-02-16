package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.service.PortalMessageService;
import com.privod.platform.modules.portal.web.dto.PortalMessageResponse;
import com.privod.platform.modules.portal.web.dto.SendPortalMessageRequest;
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
@RequestMapping("/api/portal/messages")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER', 'ADMIN', 'PROJECT_MANAGER')")
@Tag(name = "Portal Messages", description = "Portal messaging endpoints")
public class PortalMessageController {

    private final PortalMessageService portalMessageService;

    @PostMapping
    @Operation(summary = "Send a message")
    public ResponseEntity<ApiResponse<PortalMessageResponse>> send(
            @RequestParam(required = false) UUID fromPortalUserId,
            @RequestParam(required = false) UUID fromInternalUserId,
            @Valid @RequestBody SendPortalMessageRequest request) {
        PortalMessageResponse response = portalMessageService.send(fromPortalUserId, fromInternalUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/inbox")
    @Operation(summary = "Get inbox messages")
    public ResponseEntity<ApiResponse<PageResponse<PortalMessageResponse>>> getInbox(
            @RequestParam(required = false) UUID portalUserId,
            @RequestParam(required = false) UUID internalUserId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalMessageResponse> page = portalMessageService.getInbox(portalUserId, internalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/outbox")
    @Operation(summary = "Get outbox messages")
    public ResponseEntity<ApiResponse<PageResponse<PortalMessageResponse>>> getOutbox(
            @RequestParam(required = false) UUID portalUserId,
            @RequestParam(required = false) UUID internalUserId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalMessageResponse> page = portalMessageService.getOutbox(portalUserId, internalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<PortalMessageResponse>> markRead(@PathVariable UUID id) {
        PortalMessageResponse response = portalMessageService.markRead(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/thread")
    @Operation(summary = "Get message thread")
    public ResponseEntity<ApiResponse<List<PortalMessageResponse>>> getThread(@PathVariable UUID id) {
        List<PortalMessageResponse> thread = portalMessageService.getThread(id);
        return ResponseEntity.ok(ApiResponse.ok(thread));
    }
}
