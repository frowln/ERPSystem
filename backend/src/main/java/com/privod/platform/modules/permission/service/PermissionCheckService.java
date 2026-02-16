package com.privod.platform.modules.permission.service;

import com.privod.platform.modules.permission.domain.AccessOperation;
import com.privod.platform.modules.permission.domain.RecordRule;
import com.privod.platform.modules.permission.repository.RecordRuleRepository;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Central permission check service. This is the main entry point for all permission checks.
 * Results are cached for performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionCheckService {

    private static final String CACHE_MODEL_ACCESS = "permissionModelAccess";
    private static final String CACHE_FIELD_ACCESS = "permissionFieldAccess";
    private static final String CACHE_RECORD_FILTER = "permissionRecordFilter";

    private final ModelAccessService modelAccessService;
    private final FieldAccessService fieldAccessService;
    private final RecordRuleService recordRuleService;
    private final RecordRuleRepository recordRuleRepository;
    private final UserGroupRepository userGroupRepository;

    /**
     * Checks if a user has model-level access for a given operation.
     * Uses cache for performance.
     */
    @Cacheable(value = CACHE_MODEL_ACCESS, key = "#userId + '_' + #modelName + '_' + #operation")
    @Transactional(readOnly = true)
    public boolean hasModelAccess(UUID userId, String modelName, AccessOperation operation) {
        boolean result = modelAccessService.checkAccess(userId, modelName, operation);
        log.debug("Model access check: user={}, model={}, op={}, result={}",
                userId, modelName, operation, result);
        return result;
    }

    /**
     * Gets the record-level filter for a user on a specific model.
     * Returns a list of filter conditions that should be applied to queries.
     */
    @Cacheable(value = CACHE_RECORD_FILTER, key = "#userId + '_' + #modelName")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecordFilter(UUID userId, String modelName) {
        return getRecordFilter(userId, modelName, null, null);
    }

    /**
     * Gets the record-level filter with context for variable resolution.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecordFilter(UUID userId, String modelName,
                                                      String currentUserId, String currentUserOrganization) {
        List<UUID> groupIds = userGroupRepository.findGroupIdsByUserId(userId);

        List<RecordRule> rules;
        if (groupIds.isEmpty()) {
            rules = recordRuleRepository.findGlobalRules(modelName);
        } else {
            rules = recordRuleRepository.findApplicableRules(modelName, groupIds);
        }

        List<Map<String, Object>> filters = new ArrayList<>();

        String resolvedUserId = currentUserId != null ? currentUserId : userId.toString();

        for (RecordRule rule : rules) {
            Map<String, Object> evaluated = recordRuleService.evaluateRule(
                    rule, resolvedUserId, currentUserOrganization);
            if (!evaluated.isEmpty()) {
                evaluated.put("ruleName", rule.getName());
                evaluated.put("ruleId", rule.getId().toString());
                evaluated.put("permRead", rule.isPermRead());
                evaluated.put("permWrite", rule.isPermWrite());
                evaluated.put("permCreate", rule.isPermCreate());
                evaluated.put("permUnlink", rule.isPermUnlink());
                filters.add(evaluated);
            }
        }

        log.debug("Record filter: user={}, model={}, filters={}", userId, modelName, filters.size());
        return filters;
    }

    /**
     * Checks if a user has access to a specific field.
     * Uses cache for performance.
     */
    @Cacheable(value = CACHE_FIELD_ACCESS, key = "#userId + '_' + #modelName + '_' + #fieldName")
    @Transactional(readOnly = true)
    public boolean hasFieldAccess(UUID userId, String modelName, String fieldName) {
        return hasFieldAccess(userId, modelName, fieldName, false);
    }

    /**
     * Checks if a user has read or write access to a specific field.
     */
    @Transactional(readOnly = true)
    public boolean hasFieldAccess(UUID userId, String modelName, String fieldName, boolean write) {
        boolean result = fieldAccessService.checkFieldAccess(userId, modelName, fieldName, write);
        log.debug("Field access check: user={}, model={}, field={}, write={}, result={}",
                userId, modelName, fieldName, write, result);
        return result;
    }

    /**
     * Returns a summary of all permissions for a user on a given model.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPermissionSummary(UUID userId, String modelName) {
        Map<String, Object> summary = new HashMap<>();

        summary.put("canRead", hasModelAccess(userId, modelName, AccessOperation.READ));
        summary.put("canCreate", hasModelAccess(userId, modelName, AccessOperation.CREATE));
        summary.put("canUpdate", hasModelAccess(userId, modelName, AccessOperation.UPDATE));
        summary.put("canDelete", hasModelAccess(userId, modelName, AccessOperation.DELETE));

        List<Map<String, Object>> recordFilters = getRecordFilter(userId, modelName);
        summary.put("recordFilters", recordFilters);
        summary.put("hasRecordRestrictions", !recordFilters.isEmpty());

        return summary;
    }

    /**
     * Evicts all permission caches for a specific user.
     * Should be called when user group assignments change.
     */
    @CacheEvict(value = {CACHE_MODEL_ACCESS, CACHE_FIELD_ACCESS, CACHE_RECORD_FILTER}, allEntries = true)
    public void evictCachesForUser(UUID userId) {
        log.info("Permission caches evicted for user: {}", userId);
    }

    /**
     * Evicts all permission caches.
     * Should be called when model access rules or record rules change.
     */
    @CacheEvict(value = {CACHE_MODEL_ACCESS, CACHE_FIELD_ACCESS, CACHE_RECORD_FILTER}, allEntries = true)
    public void evictAllCaches() {
        log.info("All permission caches evicted");
    }
}
