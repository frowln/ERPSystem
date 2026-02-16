package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.domain.PortalRole;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.domain.PortalUserStatus;
import com.privod.platform.modules.portal.repository.PortalUserRepository;
import com.privod.platform.modules.portal.service.PortalProjectService;
import com.privod.platform.modules.portal.web.dto.GrantPortalProjectAccessRequest;
import com.privod.platform.modules.portal.web.dto.PortalProjectResponse;
import com.privod.platform.modules.portal.web.dto.PortalUserResponse;
import com.privod.platform.modules.portal.web.dto.UpdatePortalUserStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/portal")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
@Tag(name = "Portal Admin", description = "Portal administration endpoints")
public class PortalAdminController {

    private final PortalUserRepository portalUserRepository;
    private final PortalProjectService portalProjectService;

    @GetMapping("/users")
    @Operation(summary = "List all portal users with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<PortalUserResponse>>> listUsers(
            @RequestParam(required = false) PortalUserStatus status,
            @RequestParam(required = false) PortalRole role,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PortalUserResponse> page;
        if (status != null) {
            page = portalUserRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(PortalUserResponse::fromEntity);
        } else if (role != null) {
            page = portalUserRepository.findByPortalRoleAndDeletedFalse(role, pageable)
                    .map(PortalUserResponse::fromEntity);
        } else {
            page = portalUserRepository.findByDeletedFalse(pageable)
                    .map(PortalUserResponse::fromEntity);
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get portal user by ID")
    public ResponseEntity<ApiResponse<PortalUserResponse>> getUser(@PathVariable UUID id) {
        PortalUser user = portalUserRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пользователь портала не найден: " + id));
        return ResponseEntity.ok(ApiResponse.ok(PortalUserResponse.fromEntity(user)));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Update portal user status (activate, block)")
    public ResponseEntity<ApiResponse<PortalUserResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePortalUserStatusRequest request) {
        PortalUser user = portalUserRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пользователь портала не найден: " + id));

        user.setStatus(request.status());
        user = portalUserRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(PortalUserResponse.fromEntity(user)));
    }

    @PostMapping("/access")
    @Operation(summary = "Grant project access to portal user")
    public ResponseEntity<ApiResponse<PortalProjectResponse>> grantAccess(
            @Valid @RequestBody GrantPortalProjectAccessRequest request) {
        PortalProjectResponse response = portalProjectService.grantAccess(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/access/{portalUserId}/{projectId}")
    @Operation(summary = "Revoke project access from portal user")
    public ResponseEntity<ApiResponse<Void>> revokeAccess(
            @PathVariable UUID portalUserId,
            @PathVariable UUID projectId) {
        portalProjectService.revokeAccess(portalUserId, projectId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
