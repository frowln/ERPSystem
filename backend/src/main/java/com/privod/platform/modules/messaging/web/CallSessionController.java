package com.privod.platform.modules.messaging.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.messaging.service.CallSessionService;
import com.privod.platform.modules.messaging.web.dto.CallSessionResponse;
import com.privod.platform.modules.messaging.web.dto.CreateCallRequest;
import com.privod.platform.modules.messaging.web.dto.EndCallRequest;
import com.privod.platform.modules.messaging.web.dto.GuestJoinCallRequest;
import com.privod.platform.modules.messaging.web.dto.JoinCallRequest;
import com.privod.platform.modules.messaging.web.dto.LeaveCallRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/communication/calls")
@RequiredArgsConstructor
@Tag(name = "Communication Calls", description = "Audio/Video call sessions and signaling metadata")
public class CallSessionController {

    private final CallSessionService callSessionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Create call session")
    public ResponseEntity<ApiResponse<CallSessionResponse>> createCall(@Valid @RequestBody CreateCallRequest request) {
        CallSessionResponse response = callSessionService.createCall(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List recent call sessions")
    public ResponseEntity<ApiResponse<List<CallSessionResponse>>> listCalls(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID channelId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.listCalls(projectId, channelId)));
    }

    @GetMapping("/active")
    @Operation(summary = "List active calls")
    public ResponseEntity<ApiResponse<List<CallSessionResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.listActiveCalls()));
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Join call session")
    public ResponseEntity<ApiResponse<CallSessionResponse>> joinCall(
            @PathVariable UUID id,
            @Valid @RequestBody JoinCallRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.joinCall(id, request)));
    }

    @PostMapping("/{id}/leave")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Leave call session")
    public ResponseEntity<ApiResponse<CallSessionResponse>> leaveCall(
            @PathVariable UUID id,
            @Valid @RequestBody LeaveCallRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.leaveCall(id, request)));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "End call session")
    public ResponseEntity<ApiResponse<CallSessionResponse>> endCall(
            @PathVariable UUID id,
            @Valid @RequestBody EndCallRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.endCall(id, request)));
    }

    @PostMapping("/{id}/invite-link")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate invite link for call session")
    public ResponseEntity<ApiResponse<CallSessionResponse>> generateInviteLink(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.generateInviteLink(id)));
    }

    @GetMapping("/by-token/{token}")
    @Operation(summary = "Get call session by invite token (no auth required)")
    public ResponseEntity<ApiResponse<CallSessionResponse>> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.getByInviteToken(token)));
    }

    @PostMapping("/join-by-link/{token}")
    @Operation(summary = "Join call by invite link (no auth for guests)")
    public ResponseEntity<ApiResponse<CallSessionResponse>> joinByLink(
            @PathVariable String token,
            @Valid @RequestBody GuestJoinCallRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(callSessionService.joinByInviteToken(token, request.guestName())));
    }
}
