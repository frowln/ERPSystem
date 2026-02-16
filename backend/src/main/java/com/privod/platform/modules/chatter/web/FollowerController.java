package com.privod.platform.modules.chatter.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.chatter.service.FollowerService;
import com.privod.platform.modules.chatter.web.dto.AddFollowerRequest;
import com.privod.platform.modules.chatter.web.dto.FollowerResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/chatter/followers")
@RequiredArgsConstructor
@Tag(name = "Chatter - Followers", description = "Follower/subscription management for entities")
@PreAuthorize("isAuthenticated()")
public class FollowerController {

    private final FollowerService followerService;

    @PostMapping
    @Operation(summary = "Follow an entity")
    public ResponseEntity<ApiResponse<FollowerResponse>> follow(
            @Valid @RequestBody AddFollowerRequest request) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (request.userId() != null && !request.userId().equals(currentUserId)) {
            throw new AccessDeniedException("Cannot follow on behalf of another user");
        }
        FollowerResponse response = followerService.follow(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping
    @Operation(summary = "Unfollow an entity")
    public ResponseEntity<ApiResponse<Void>> unfollow(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot unfollow on behalf of another user");
        }
        followerService.unfollow(entityType, entityId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping
    @Operation(summary = "List followers of an entity")
    public ResponseEntity<ApiResponse<List<FollowerResponse>>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId) {
        List<FollowerResponse> followers = followerService.getFollowers(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok(followers));
    }

    @GetMapping("/is-following")
    @Operation(summary = "Check if user follows an entity")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot check following state for another user");
        }
        boolean following = followerService.isFollowing(entityType, entityId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(following));
    }
}
