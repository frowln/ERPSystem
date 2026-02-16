package com.privod.platform.modules.permission.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.permission.domain.RecordRule;
import com.privod.platform.modules.permission.repository.RecordRuleRepository;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.web.dto.CreateRecordRuleRequest;
import com.privod.platform.modules.permission.web.dto.RecordRuleResponse;
import com.privod.platform.modules.permission.web.dto.UpdateRecordRuleRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordRuleService {

    private final RecordRuleRepository recordRuleRepository;
    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupService groupService;
    private final PermissionAuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public RecordRuleResponse create(CreateRecordRuleRequest request) {
        if (request.groupId() != null) {
            groupService.getGroupOrThrow(request.groupId());
        }

        validateDomainFilter(request.domainFilter());

        RecordRule rule = RecordRule.builder()
                .name(request.name())
                .modelName(request.modelName())
                .groupId(request.groupId())
                .domainFilter(request.domainFilter())
                .permRead(request.permRead())
                .permWrite(request.permWrite())
                .permCreate(request.permCreate())
                .permUnlink(request.permUnlink())
                .isGlobal(request.isGlobal())
                .build();

        rule = recordRuleRepository.save(rule);
        auditService.logAction(
                com.privod.platform.modules.permission.domain.PermissionAuditAction.CREATE_RULE,
                null, request.groupId(),
                "Создано правило: " + request.name());

        log.info("Record rule created: {} for model {} ({})", rule.getName(), rule.getModelName(), rule.getId());
        return RecordRuleResponse.fromEntity(rule);
    }

    @Transactional
    public RecordRuleResponse update(UUID id, UpdateRecordRuleRequest request) {
        RecordRule rule = getRuleOrThrow(id);

        if (request.name() != null) {
            rule.setName(request.name());
        }
        if (request.domainFilter() != null) {
            validateDomainFilter(request.domainFilter());
            rule.setDomainFilter(request.domainFilter());
        }
        rule.setPermRead(request.permRead());
        rule.setPermWrite(request.permWrite());
        rule.setPermCreate(request.permCreate());
        rule.setPermUnlink(request.permUnlink());
        rule.setGlobal(request.isGlobal());

        rule = recordRuleRepository.save(rule);
        auditService.logAction(
                com.privod.platform.modules.permission.domain.PermissionAuditAction.UPDATE_RULE,
                null, rule.getGroupId(),
                "Обновлено правило: " + rule.getName());

        log.info("Record rule updated: {} ({})", rule.getName(), rule.getId());
        return RecordRuleResponse.fromEntity(rule);
    }

    @Transactional(readOnly = true)
    public RecordRuleResponse findById(UUID id) {
        return RecordRuleResponse.fromEntity(getRuleOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<RecordRuleResponse> findByModel(String modelName) {
        return recordRuleRepository.findByModelNameAndDeletedFalse(modelName).stream()
                .map(RecordRuleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecordRuleResponse> findByGroup(UUID groupId) {
        return recordRuleRepository.findByGroupIdAndDeletedFalse(groupId).stream()
                .map(RecordRuleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecordRuleResponse> getApplicableRules(UUID userId, String modelName) {
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);

        List<RecordRule> rules;
        if (groupIds.isEmpty()) {
            rules = recordRuleRepository.findGlobalRules(modelName);
        } else {
            rules = recordRuleRepository.findApplicableRules(modelName, groupIds);
        }

        return rules.stream()
                .map(RecordRuleResponse::fromEntity)
                .toList();
    }

    /**
     * Evaluates a domain filter JSON and resolves variable placeholders.
     * Returns a map with the resolved filter parameters.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> evaluateRule(RecordRule rule, String currentUserId, String currentUserOrganization) {
        Map<String, Object> result = new HashMap<>();

        try {
            JsonNode filter = objectMapper.readTree(rule.getDomainFilter());

            String field = filter.has("field") ? filter.get("field").asText() : null;
            String op = filter.has("op") ? filter.get("op").asText() : null;
            JsonNode valueNode = filter.has("value") ? filter.get("value") : null;

            if (field == null || op == null) {
                return result;
            }

            Object resolvedValue = resolveValue(valueNode, currentUserId, currentUserOrganization);

            result.put("field", field);
            result.put("operator", op);
            result.put("value", resolvedValue);

        } catch (JsonProcessingException e) {
            log.warn("Failed to parse domain filter for rule {}: {}", rule.getId(), e.getMessage());
        }

        return result;
    }

    @Transactional
    public void delete(UUID id) {
        RecordRule rule = getRuleOrThrow(id);
        rule.softDelete();
        recordRuleRepository.save(rule);
        auditService.logAction(
                com.privod.platform.modules.permission.domain.PermissionAuditAction.DELETE_RULE,
                null, rule.getGroupId(),
                "Удалено правило: " + rule.getName());
        log.info("Record rule deleted: {} ({})", rule.getName(), id);
    }

    private Object resolveValue(JsonNode valueNode, String currentUserId, String currentUserOrganization) {
        if (valueNode == null || valueNode.isNull()) {
            return null;
        }

        String textValue = valueNode.asText();
        return switch (textValue) {
            case "$currentUser" -> currentUserId;
            case "$currentUserOrganization" -> currentUserOrganization;
            default -> textValue;
        };
    }

    private void validateDomainFilter(String domainFilter) {
        try {
            objectMapper.readTree(domainFilter);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Некорректный JSON в фильтре домена: " + e.getMessage());
        }
    }

    private RecordRule getRuleOrThrow(UUID id) {
        return recordRuleRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Правило записи не найдено: " + id));
    }
}
