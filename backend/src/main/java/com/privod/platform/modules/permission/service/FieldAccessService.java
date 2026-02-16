package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.FieldAccess;
import com.privod.platform.modules.permission.repository.FieldAccessRepository;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.web.dto.FieldAccessResponse;
import com.privod.platform.modules.permission.web.dto.SetFieldAccessRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldAccessService {

    private final FieldAccessRepository fieldAccessRepository;
    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupService groupService;
    private final PermissionAuditService auditService;

    @Transactional
    public FieldAccessResponse setFieldAccess(SetFieldAccessRequest request) {
        groupService.getGroupOrThrow(request.groupId());

        FieldAccess access = fieldAccessRepository
                .findByModelNameAndFieldNameAndGroupIdAndDeletedFalse(
                        request.modelName(), request.fieldName(), request.groupId())
                .orElse(null);

        if (access == null) {
            access = FieldAccess.builder()
                    .modelName(request.modelName())
                    .fieldName(request.fieldName())
                    .groupId(request.groupId())
                    .build();
        }

        access.setCanRead(request.canRead());
        access.setCanWrite(request.canWrite());

        access = fieldAccessRepository.save(access);

        auditService.logAction(
                com.privod.platform.modules.permission.domain.PermissionAuditAction.SET_FIELD_ACCESS,
                null, request.groupId(),
                String.format("Поле: %s.%s, R:%s W:%s",
                        request.modelName(), request.fieldName(), request.canRead(), request.canWrite()));

        log.info("Field access set: {}.{} for group {}, R:{} W:{}",
                request.modelName(), request.fieldName(), request.groupId(),
                request.canRead(), request.canWrite());

        return FieldAccessResponse.fromEntity(access);
    }

    @Transactional(readOnly = true)
    public boolean checkFieldAccess(UUID userId, String modelName, String fieldName, boolean write) {
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);
        if (groupIds.isEmpty()) {
            // No groups assigned — no explicit field restrictions defined, allow by default
            return true;
        }

        List<FieldAccess> rules = fieldAccessRepository
                .findByModelNameAndFieldNameAndGroupIdIn(modelName, fieldName, groupIds);

        if (rules.isEmpty()) {
            // No field-level restrictions defined for this field — allow by default
            return true;
        }

        // Union semantics: if ANY group grants the access, user has it
        if (write) {
            return rules.stream().anyMatch(FieldAccess::isCanWrite);
        } else {
            return rules.stream().anyMatch(FieldAccess::isCanRead);
        }
    }

    @Transactional(readOnly = true)
    public List<FieldAccessResponse> getByModelAndField(String modelName, String fieldName) {
        return fieldAccessRepository.findByModelNameAndFieldNameAndDeletedFalse(modelName, fieldName).stream()
                .map(FieldAccessResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FieldAccessResponse> getByModelAndGroup(String modelName, UUID groupId) {
        return fieldAccessRepository.findByModelNameAndGroupIdAndDeletedFalse(modelName, groupId).stream()
                .map(FieldAccessResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FieldAccessResponse> getByGroup(UUID groupId) {
        return fieldAccessRepository.findByGroupIdAndDeletedFalse(groupId).stream()
                .map(FieldAccessResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteFieldAccess(UUID id) {
        FieldAccess access = fieldAccessRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Правило доступа к полю не найдено: " + id));

        access.softDelete();
        fieldAccessRepository.save(access);
        log.info("Field access deleted: {}.{} ({})", access.getModelName(), access.getFieldName(), id);
    }
}
