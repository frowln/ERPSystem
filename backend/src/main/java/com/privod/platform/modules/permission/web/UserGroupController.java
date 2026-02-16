package com.privod.platform.modules.permission.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.permission.service.PermissionCheckService;
import com.privod.platform.modules.permission.service.UserGroupService;
import com.privod.platform.modules.permission.web.dto.AssignGroupRequest;
import com.privod.platform.modules.permission.web.dto.BulkAssignGroupRequest;
import com.privod.platform.modules.permission.web.dto.PermissionGroupResponse;
import com.privod.platform.modules.permission.web.dto.UserGroupResponse;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/user-groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Groups", description = "Управление назначением пользователей в группы прав")
public class UserGroupController {

    private final UserGroupService userGroupService;
    private final PermissionCheckService permissionCheckService;

    @GetMapping
    @Operation(summary = "Список всех назначений пользователей в группы")
    public ResponseEntity<ApiResponse<PageResponse<UserGroupResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserGroupResponse> page = userGroupService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping
    @Operation(summary = "Назначить пользователя в группу")
    public ResponseEntity<ApiResponse<UserGroupResponse>> assignGroup(
            @Valid @RequestBody AssignGroupRequest request) {
        UserGroupResponse response = userGroupService.assignGroup(request);
        permissionCheckService.evictCachesForUser(request.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/user/{userId}/group/{groupId}")
    @Operation(summary = "Удалить пользователя из группы")
    public ResponseEntity<ApiResponse<Void>> removeGroup(
            @PathVariable UUID userId,
            @PathVariable UUID groupId) {
        userGroupService.removeGroup(userId, groupId);
        permissionCheckService.evictCachesForUser(userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Получить все группы пользователя")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> getUserGroups(
            @PathVariable UUID userId) {
        List<PermissionGroupResponse> groups = userGroupService.getUserGroups(userId);
        return ResponseEntity.ok(ApiResponse.ok(groups));
    }

    @GetMapping("/group/{groupId}/users")
    @Operation(summary = "Получить всех пользователей группы")
    public ResponseEntity<ApiResponse<List<UserGroupResponse>>> getGroupUsers(
            @PathVariable UUID groupId) {
        List<UserGroupResponse> users = userGroupService.getGroupUsers(groupId);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/group/{groupId}/count")
    @Operation(summary = "Получить количество пользователей в группе")
    public ResponseEntity<ApiResponse<Long>> getGroupMemberCount(
            @PathVariable UUID groupId) {
        long count = userGroupService.getGroupMemberCount(groupId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PostMapping("/bulk-assign")
    @Operation(summary = "Массовое назначение пользователей в группу")
    public ResponseEntity<ApiResponse<List<UserGroupResponse>>> bulkAssign(
            @Valid @RequestBody BulkAssignGroupRequest request) {
        List<UserGroupResponse> results = userGroupService.bulkAssign(request);
        permissionCheckService.evictAllCaches();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(results));
    }

    @PostMapping("/bulk-revoke")
    @Operation(summary = "Массовый отзыв пользователей из группы")
    public ResponseEntity<ApiResponse<Void>> bulkRevoke(
            @Valid @RequestBody BulkAssignGroupRequest request) {
        userGroupService.bulkRevoke(request);
        permissionCheckService.evictAllCaches();
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/user/{userId}/permissions/{modelName}")
    @Operation(summary = "Получить сводку прав пользователя для модели")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPermissionSummary(
            @PathVariable UUID userId,
            @PathVariable String modelName) {
        Map<String, Object> summary = permissionCheckService.getPermissionSummary(userId, modelName);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
