package com.privod.platform.modules.auth.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.auth.service.UserAdminService;
import com.privod.platform.modules.auth.web.dto.CreateAdminUserRequest;
import com.privod.platform.modules.auth.web.dto.ResetPasswordResponse;
import com.privod.platform.modules.auth.web.dto.UpdateAdminUserRequest;
import com.privod.platform.modules.auth.web.dto.UserActivityLogResponse;
import com.privod.platform.modules.auth.web.dto.UserResponse;
import com.privod.platform.modules.auth.web.dto.UserSessionResponse;
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
@RequestMapping({"/api/admin/users", "/api/users"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Administration", description = "User management endpoints for administrators")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    @Operation(summary = "List users with optional search and pagination")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> list(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserResponse> page = userAdminService.listUsers(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable UUID id) {
        UserResponse response = userAdminService.getUser(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @Valid @RequestBody CreateAdminUserRequest request) {
        UserResponse response = userAdminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing user")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminUserRequest request) {
        UserResponse response = userAdminService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/block")
    @Operation(summary = "Block (disable) a user")
    public ResponseEntity<ApiResponse<Void>> block(@PathVariable UUID id) {
        userAdminService.blockUser(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/unblock")
    @Operation(summary = "Unblock (enable) a user")
    public ResponseEntity<ApiResponse<Void>> unblock(@PathVariable UUID id) {
        userAdminService.unblockUser(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Reset user password and return a temporary password")
    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(@PathVariable UUID id) {
        ResetPasswordResponse response = userAdminService.resetPassword(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/force-logout")
    @Operation(summary = "Force logout a user by deactivating all their sessions")
    public ResponseEntity<ApiResponse<Void>> forceLogout(@PathVariable UUID id) {
        userAdminService.forceLogout(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}/sessions")
    @Operation(summary = "Get active sessions for a user")
    public ResponseEntity<ApiResponse<List<UserSessionResponse>>> getSessions(@PathVariable UUID id) {
        List<UserSessionResponse> sessions = userAdminService.getUserSessions(id);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    @GetMapping("/{id}/activity")
    @Operation(summary = "Get activity log (login attempts) for a user")
    public ResponseEntity<ApiResponse<List<UserActivityLogResponse>>> getActivityLog(@PathVariable UUID id) {
        List<UserActivityLogResponse> activity = userAdminService.getUserActivityLog(id);
        return ResponseEntity.ok(ApiResponse.ok(activity));
    }
}
