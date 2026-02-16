package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.AccessOperation;
import com.privod.platform.modules.permission.domain.ModelAccess;
import com.privod.platform.modules.permission.repository.ModelAccessRepository;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.web.dto.ModelAccessResponse;
import com.privod.platform.modules.permission.web.dto.SetModelAccessRequest;
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
public class ModelAccessService {

    private final ModelAccessRepository modelAccessRepository;
    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupService groupService;
    private final PermissionAuditService auditService;

    @Transactional
    public ModelAccessResponse setAccess(SetModelAccessRequest request) {
        // Validate group exists
        groupService.getGroupOrThrow(request.groupId());

        ModelAccess access = modelAccessRepository
                .findByModelNameAndGroupIdAndDeletedFalse(request.modelName(), request.groupId())
                .orElse(null);

        if (access == null) {
            access = ModelAccess.builder()
                    .modelName(request.modelName())
                    .groupId(request.groupId())
                    .build();
        }

        access.setCanRead(request.canRead());
        access.setCanCreate(request.canCreate());
        access.setCanUpdate(request.canUpdate());
        access.setCanDelete(request.canDelete());

        access = modelAccessRepository.save(access);

        auditService.logModelAccessChange(request.groupId(),
                String.format("Модель: %s, R:%s C:%s U:%s D:%s",
                        request.modelName(), request.canRead(), request.canCreate(),
                        request.canUpdate(), request.canDelete()));

        log.info("Model access set: model={}, group={}, R:{} C:{} U:{} D:{}",
                request.modelName(), request.groupId(),
                request.canRead(), request.canCreate(), request.canUpdate(), request.canDelete());

        return ModelAccessResponse.fromEntity(access);
    }

    @Transactional(readOnly = true)
    public ModelAccessResponse getAccess(String modelName, UUID groupId) {
        ModelAccess access = modelAccessRepository
                .findByModelNameAndGroupIdAndDeletedFalse(modelName, groupId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Правило доступа не найдено для модели '" + modelName + "' и группы " + groupId));
        return ModelAccessResponse.fromEntity(access);
    }

    @Transactional(readOnly = true)
    public List<ModelAccessResponse> getAccessByModel(String modelName) {
        return modelAccessRepository.findByModelNameAndDeletedFalse(modelName).stream()
                .map(ModelAccessResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ModelAccessResponse> getAccessByGroup(UUID groupId) {
        return modelAccessRepository.findByGroupIdAndDeletedFalse(groupId).stream()
                .map(ModelAccessResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean checkAccess(UUID userId, String modelName, AccessOperation operation) {
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);
        if (groupIds.isEmpty()) {
            return false;
        }

        List<ModelAccess> accessRules = modelAccessRepository
                .findByModelNameAndGroupIdIn(modelName, groupIds);

        // Union semantics: if ANY group grants the access, user has it
        return accessRules.stream()
                .anyMatch(rule -> rule.hasAccess(operation));
    }

    @Transactional(readOnly = true)
    public List<String> getAllModelNames() {
        return modelAccessRepository.findAllDistinctModelNames();
    }

    @Transactional
    public void deleteAccess(UUID id) {
        ModelAccess access = modelAccessRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Правило доступа к модели не найдено: " + id));

        access.softDelete();
        modelAccessRepository.save(access);
        log.info("Model access deleted: {} ({})", access.getModelName(), id);
    }
}
