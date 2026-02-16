package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.UserGroup;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.web.dto.AssignGroupRequest;
import com.privod.platform.modules.permission.web.dto.BulkAssignGroupRequest;
import com.privod.platform.modules.permission.web.dto.PermissionGroupResponse;
import com.privod.platform.modules.permission.web.dto.UserGroupResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserGroupService {

    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupService groupService;
    private final PermissionAuditService auditService;

    @Transactional(readOnly = true)
    public Page<UserGroupResponse> listAll(Pageable pageable) {
        return userGroupRepository.findByDeletedFalse(pageable)
                .map(UserGroupResponse::fromEntity);
    }

    @Transactional
    public UserGroupResponse assignGroup(AssignGroupRequest request) {
        groupService.getGroupOrThrow(request.groupId());

        if (userGroupRepository.existsByUserIdAndGroupIdAndDeletedFalse(request.userId(), request.groupId())) {
            throw new IllegalArgumentException("Пользователь уже состоит в этой группе");
        }

        UserGroup userGroup = UserGroup.builder()
                .userId(request.userId())
                .groupId(request.groupId())
                .build();

        userGroup = userGroupRepository.save(userGroup);
        auditService.logGrant(request.userId(), request.groupId());

        log.info("User {} assigned to group {}", request.userId(), request.groupId());
        return UserGroupResponse.fromEntity(userGroup);
    }

    @Transactional
    public void removeGroup(UUID userId, UUID groupId) {
        UserGroup userGroup = userGroupRepository.findByUserIdAndGroupIdAndDeletedFalse(userId, groupId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Пользователь не состоит в указанной группе"));

        userGroup.softDelete();
        userGroupRepository.save(userGroup);
        auditService.logRevoke(userId, groupId);

        log.info("User {} removed from group {}", userId, groupId);
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> getUserGroups(UUID userId) {
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);
        return groupIds.stream()
                .map(groupService::findById)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> getGroupUserIds(UUID groupId) {
        return userGroupRepository.findUserIdsByGroupId(groupId);
    }

    @Transactional(readOnly = true)
    public List<UserGroupResponse> getGroupUsers(UUID groupId) {
        return userGroupRepository.findByGroupIdAndDeletedFalse(groupId).stream()
                .map(UserGroupResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<UserGroupResponse> bulkAssign(BulkAssignGroupRequest request) {
        groupService.getGroupOrThrow(request.groupId());

        List<UserGroupResponse> results = new ArrayList<>();

        for (UUID userId : request.userIds()) {
            if (!userGroupRepository.existsByUserIdAndGroupIdAndDeletedFalse(userId, request.groupId())) {
                UserGroup userGroup = UserGroup.builder()
                        .userId(userId)
                        .groupId(request.groupId())
                        .build();

                userGroup = userGroupRepository.save(userGroup);
                results.add(UserGroupResponse.fromEntity(userGroup));
            }
        }

        auditService.logBulkAssign(request.groupId(),
                "Массовое назначение: " + request.userIds().size() + " пользователей");

        log.info("Bulk assign: {} users to group {}", request.userIds().size(), request.groupId());
        return results;
    }

    @Transactional
    public void bulkRevoke(BulkAssignGroupRequest request) {
        for (UUID userId : request.userIds()) {
            userGroupRepository.findByUserIdAndGroupIdAndDeletedFalse(userId, request.groupId())
                    .ifPresent(ug -> {
                        ug.softDelete();
                        userGroupRepository.save(ug);
                    });
        }

        auditService.logAction(
                com.privod.platform.modules.permission.domain.PermissionAuditAction.BULK_REVOKE,
                null, request.groupId(),
                "Массовый отзыв: " + request.userIds().size() + " пользователей");

        log.info("Bulk revoke: {} users from group {}", request.userIds().size(), request.groupId());
    }

    @Transactional(readOnly = true)
    public long getGroupMemberCount(UUID groupId) {
        return userGroupRepository.countByGroupId(groupId);
    }
}
