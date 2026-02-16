package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.PermissionGroup;
import com.privod.platform.modules.permission.repository.PermissionGroupRepository;
import com.privod.platform.modules.permission.web.dto.CreatePermissionGroupRequest;
import com.privod.platform.modules.permission.web.dto.PermissionGroupResponse;
import com.privod.platform.modules.permission.web.dto.UpdatePermissionGroupRequest;
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
public class PermissionGroupService {

    private final PermissionGroupRepository groupRepository;
    private final PermissionAuditService auditService;

    @Transactional(readOnly = true)
    public Page<PermissionGroupResponse> findAll(Pageable pageable) {
        return groupRepository.findByDeletedFalseOrderBySequence(pageable)
                .map(PermissionGroupResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> findAllActive() {
        return groupRepository.findAllActive().stream()
                .map(PermissionGroupResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PermissionGroupResponse findById(UUID id) {
        PermissionGroup group = getGroupOrThrow(id);
        return PermissionGroupResponse.fromEntity(group);
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> findByCategory(String category) {
        return groupRepository.findByCategoryAndDeletedFalseOrderBySequence(category).stream()
                .map(PermissionGroupResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> findChildren(UUID parentGroupId) {
        return groupRepository.findByParentGroupIdAndDeletedFalse(parentGroupId).stream()
                .map(PermissionGroupResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> getGroupHierarchy(UUID groupId) {
        List<PermissionGroupResponse> hierarchy = new ArrayList<>();
        UUID currentId = groupId;

        while (currentId != null) {
            PermissionGroup group = groupRepository.findById(currentId)
                    .filter(g -> !g.isDeleted())
                    .orElse(null);
            if (group == null) break;
            hierarchy.addFirst(PermissionGroupResponse.fromEntity(group));
            currentId = group.getParentGroupId();
        }

        return hierarchy;
    }

    @Transactional
    public PermissionGroupResponse create(CreatePermissionGroupRequest request) {
        if (groupRepository.existsByNameAndDeletedFalse(request.name())) {
            throw new IllegalArgumentException("Группа с именем '" + request.name() + "' уже существует");
        }

        if (request.parentGroupId() != null) {
            getGroupOrThrow(request.parentGroupId());
        }

        PermissionGroup group = PermissionGroup.builder()
                .name(request.name())
                .displayName(request.displayName())
                .description(request.description())
                .category(request.category())
                .parentGroupId(request.parentGroupId())
                .isActive(true)
                .sequence(request.sequence() != null ? request.sequence() : 10)
                .build();

        group = groupRepository.save(group);
        auditService.logGroupCreate(group.getId(), "Создана группа: " + group.getDisplayName());

        log.info("Permission group created: {} - {} ({})", group.getName(), group.getDisplayName(), group.getId());
        return PermissionGroupResponse.fromEntity(group);
    }

    @Transactional
    public PermissionGroupResponse update(UUID id, UpdatePermissionGroupRequest request) {
        PermissionGroup group = getGroupOrThrow(id);

        if (request.displayName() != null) {
            group.setDisplayName(request.displayName());
        }
        if (request.description() != null) {
            group.setDescription(request.description());
        }
        if (request.category() != null) {
            group.setCategory(request.category());
        }
        if (request.parentGroupId() != null) {
            if (request.parentGroupId().equals(id)) {
                throw new IllegalArgumentException("Группа не может быть родительской для самой себя");
            }
            getGroupOrThrow(request.parentGroupId());
            group.setParentGroupId(request.parentGroupId());
        }
        if (request.isActive() != null) {
            group.setActive(request.isActive());
        }
        if (request.sequence() != null) {
            group.setSequence(request.sequence());
        }

        group = groupRepository.save(group);
        auditService.logGroupUpdate(group.getId(), "Обновлена группа: " + group.getDisplayName());

        log.info("Permission group updated: {} ({})", group.getName(), group.getId());
        return PermissionGroupResponse.fromEntity(group);
    }

    @Transactional
    public void delete(UUID id) {
        PermissionGroup group = getGroupOrThrow(id);

        List<PermissionGroup> children = groupRepository.findByParentGroupIdAndDeletedFalse(id);
        if (!children.isEmpty()) {
            throw new IllegalStateException(
                    "Невозможно удалить группу с дочерними группами. Сначала удалите или переназначьте дочерние группы.");
        }

        group.softDelete();
        groupRepository.save(group);
        auditService.logGroupDelete(group.getId());

        log.info("Permission group deleted: {} ({})", group.getName(), id);
    }

    @Transactional(readOnly = true)
    public List<PermissionGroupResponse> search(String query) {
        return groupRepository.searchByNameOrDisplayName(query).stream()
                .map(PermissionGroupResponse::fromEntity)
                .toList();
    }

    PermissionGroup getGroupOrThrow(UUID id) {
        return groupRepository.findById(id)
                .filter(g -> !g.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Группа прав не найдена: " + id));
    }
}
