package com.privod.platform.modules.permission;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.permission.domain.AccessOperation;
import com.privod.platform.modules.permission.domain.FieldAccess;
import com.privod.platform.modules.permission.domain.ModelAccess;
import com.privod.platform.modules.permission.domain.RecordRule;
import com.privod.platform.modules.permission.repository.FieldAccessRepository;
import com.privod.platform.modules.permission.repository.ModelAccessRepository;
import com.privod.platform.modules.permission.repository.RecordRuleRepository;
import com.privod.platform.modules.permission.repository.UserGroupRepository;
import com.privod.platform.modules.permission.service.FieldAccessService;
import com.privod.platform.modules.permission.service.ModelAccessService;
import com.privod.platform.modules.permission.service.PermissionAuditService;
import com.privod.platform.modules.permission.service.PermissionCheckService;
import com.privod.platform.modules.permission.service.PermissionGroupService;
import com.privod.platform.modules.permission.service.RecordRuleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionCheckServiceTest {

    @Mock
    private ModelAccessRepository modelAccessRepository;

    @Mock
    private FieldAccessRepository fieldAccessRepository;

    @Mock
    private RecordRuleRepository recordRuleRepository;

    @Mock
    private UserGroupRepository userGroupRepository;

    @Mock
    private PermissionGroupService permissionGroupService;

    @Mock
    private PermissionAuditService permissionAuditService;

    private ModelAccessService modelAccessService;
    private FieldAccessService fieldAccessService;
    private RecordRuleService recordRuleService;
    private PermissionCheckService permissionCheckService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID userId;
    private UUID adminGroupId;
    private UUID basicGroupId;
    private UUID managerGroupId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        adminGroupId = UUID.fromString("a0000000-0000-0000-0000-000000000008");
        basicGroupId = UUID.fromString("a0000000-0000-0000-0000-000000000001");
        managerGroupId = UUID.fromString("a0000000-0000-0000-0000-000000000002");

        modelAccessService = new ModelAccessService(
                modelAccessRepository, userGroupRepository, permissionGroupService, permissionAuditService);
        fieldAccessService = new FieldAccessService(
                fieldAccessRepository, userGroupRepository, permissionGroupService, permissionAuditService);
        recordRuleService = new RecordRuleService(
                recordRuleRepository, userGroupRepository, permissionGroupService, permissionAuditService, objectMapper);

        permissionCheckService = new PermissionCheckService(
                modelAccessService, fieldAccessService, recordRuleService,
                recordRuleRepository, userGroupRepository);
    }

    @Nested
    @DisplayName("Model Access Checks")
    class ModelAccessTests {

        @Test
        @DisplayName("Should grant READ access when user belongs to a group with read permission")
        void checkAccess_GrantRead_WhenGroupHasReadPermission() {
            ModelAccess access = ModelAccess.builder()
                    .modelName("project")
                    .groupId(basicGroupId)
                    .canRead(true)
                    .canCreate(false)
                    .canUpdate(false)
                    .canDelete(false)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId));
            when(modelAccessRepository.findByModelNameAndGroupIdIn("project", List.of(basicGroupId)))
                    .thenReturn(List.of(access));

            boolean result = permissionCheckService.hasModelAccess(userId, "project", AccessOperation.READ);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should deny CREATE access when user group only has read permission")
        void checkAccess_DenyCreate_WhenGroupOnlyHasRead() {
            ModelAccess access = ModelAccess.builder()
                    .modelName("project")
                    .groupId(basicGroupId)
                    .canRead(true)
                    .canCreate(false)
                    .canUpdate(false)
                    .canDelete(false)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId));
            when(modelAccessRepository.findByModelNameAndGroupIdIn("project", List.of(basicGroupId)))
                    .thenReturn(List.of(access));

            boolean result = permissionCheckService.hasModelAccess(userId, "project", AccessOperation.CREATE);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should deny access when user has no groups assigned")
        void checkAccess_DenyAccess_WhenNoGroupsAssigned() {
            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(Collections.emptyList());

            boolean result = permissionCheckService.hasModelAccess(userId, "project", AccessOperation.READ);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should grant access via union semantics — any group granting access is sufficient")
        void checkAccess_UnionSemantics_AnyGroupGrantsAccess() {
            ModelAccess basicAccess = ModelAccess.builder()
                    .modelName("project")
                    .groupId(basicGroupId)
                    .canRead(true)
                    .canCreate(false)
                    .canUpdate(false)
                    .canDelete(false)
                    .build();

            ModelAccess managerAccess = ModelAccess.builder()
                    .modelName("project")
                    .groupId(managerGroupId)
                    .canRead(true)
                    .canCreate(true)
                    .canUpdate(true)
                    .canDelete(false)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId, managerGroupId));
            when(modelAccessRepository.findByModelNameAndGroupIdIn("project", List.of(basicGroupId, managerGroupId)))
                    .thenReturn(List.of(basicAccess, managerAccess));

            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.CREATE)).isTrue();
            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.UPDATE)).isTrue();
            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.DELETE)).isFalse();
        }
    }

    @Nested
    @DisplayName("Group Hierarchy")
    class GroupHierarchyTests {

        @Test
        @DisplayName("Should grant admin full access to all operations")
        void checkAccess_AdminGroupHasFullAccess() {
            ModelAccess adminAccess = ModelAccess.builder()
                    .modelName("project")
                    .groupId(adminGroupId)
                    .canRead(true)
                    .canCreate(true)
                    .canUpdate(true)
                    .canDelete(true)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(adminGroupId));
            when(modelAccessRepository.findByModelNameAndGroupIdIn("project", List.of(adminGroupId)))
                    .thenReturn(List.of(adminAccess));

            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.READ)).isTrue();
            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.CREATE)).isTrue();
            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.UPDATE)).isTrue();
            assertThat(permissionCheckService.hasModelAccess(userId, "project", AccessOperation.DELETE)).isTrue();
        }
    }

    @Nested
    @DisplayName("Record Rule Evaluation")
    class RecordRuleTests {

        @Test
        @DisplayName("Should evaluate domain filter with $currentUser variable")
        void evaluateRule_ResolvesCurrentUserVariable() {
            RecordRule rule = RecordRule.builder()
                    .name("Видеть только свои проекты")
                    .modelName("project")
                    .groupId(basicGroupId)
                    .domainFilter("{\"field\": \"createdBy\", \"op\": \"=\", \"value\": \"$currentUser\"}")
                    .permRead(true)
                    .build();
            rule.setId(UUID.randomUUID());

            Map<String, Object> result = recordRuleService.evaluateRule(rule, "user@test.com", null);

            assertThat(result).containsEntry("field", "createdBy");
            assertThat(result).containsEntry("operator", "=");
            assertThat(result).containsEntry("value", "user@test.com");
        }

        @Test
        @DisplayName("Should evaluate domain filter with $currentUserOrganization variable")
        void evaluateRule_ResolvesOrganizationVariable() {
            RecordRule rule = RecordRule.builder()
                    .name("Проекты подразделения")
                    .modelName("project")
                    .groupId(managerGroupId)
                    .domainFilter("{\"field\": \"organizationId\", \"op\": \"=\", \"value\": \"$currentUserOrganization\"}")
                    .permRead(true)
                    .permWrite(true)
                    .build();
            rule.setId(UUID.randomUUID());

            String orgId = UUID.randomUUID().toString();
            Map<String, Object> result = recordRuleService.evaluateRule(rule, "manager@test.com", orgId);

            assertThat(result).containsEntry("field", "organizationId");
            assertThat(result).containsEntry("operator", "=");
            assertThat(result).containsEntry("value", orgId);
        }

        @Test
        @DisplayName("Should return applicable rules for user including global rules")
        void getRecordFilter_IncludesGlobalAndGroupRules() {
            RecordRule groupRule = RecordRule.builder()
                    .name("Свои проекты")
                    .modelName("project")
                    .groupId(basicGroupId)
                    .domainFilter("{\"field\": \"createdBy\", \"op\": \"=\", \"value\": \"$currentUser\"}")
                    .permRead(true)
                    .isGlobal(false)
                    .build();
            groupRule.setId(UUID.randomUUID());

            RecordRule globalRule = RecordRule.builder()
                    .name("Глобальное правило")
                    .modelName("project")
                    .groupId(null)
                    .domainFilter("{\"field\": \"id\", \"op\": \"!=\", \"value\": null}")
                    .permRead(true)
                    .isGlobal(true)
                    .build();
            globalRule.setId(UUID.randomUUID());

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId));
            when(recordRuleRepository.findApplicableRules("project", List.of(basicGroupId)))
                    .thenReturn(List.of(groupRule, globalRule));

            List<Map<String, Object>> filters = permissionCheckService.getRecordFilter(
                    userId, "project", userId.toString(), null);

            assertThat(filters).hasSize(2);
            assertThat(filters.get(0)).containsEntry("field", "createdBy");
        }
    }

    @Nested
    @DisplayName("Field Access Checks")
    class FieldAccessTests {

        @Test
        @DisplayName("Should deny field access when group explicitly restricts it")
        void checkFieldAccess_DenyWhenExplicitlyRestricted() {
            FieldAccess rule = FieldAccess.builder()
                    .modelName("project")
                    .fieldName("budgetAmount")
                    .groupId(basicGroupId)
                    .canRead(false)
                    .canWrite(false)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId));
            when(fieldAccessRepository.findByModelNameAndFieldNameAndGroupIdIn(
                    "project", "budgetAmount", List.of(basicGroupId)))
                    .thenReturn(List.of(rule));

            boolean result = permissionCheckService.hasFieldAccess(userId, "project", "budgetAmount");

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should allow field access when no explicit rules exist")
        void checkFieldAccess_AllowWhenNoRulesDefined() {
            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(basicGroupId));
            when(fieldAccessRepository.findByModelNameAndFieldNameAndGroupIdIn(
                    "project", "name", List.of(basicGroupId)))
                    .thenReturn(Collections.emptyList());

            boolean result = permissionCheckService.hasFieldAccess(userId, "project", "name");

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should grant field write access when group has canWrite=true")
        void checkFieldAccess_GrantWriteWhenGroupAllows() {
            FieldAccess rule = FieldAccess.builder()
                    .modelName("project")
                    .fieldName("budgetAmount")
                    .groupId(managerGroupId)
                    .canRead(true)
                    .canWrite(true)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(managerGroupId));
            when(fieldAccessRepository.findByModelNameAndFieldNameAndGroupIdIn(
                    "project", "budgetAmount", List.of(managerGroupId)))
                    .thenReturn(List.of(rule));

            boolean readResult = permissionCheckService.hasFieldAccess(userId, "project", "budgetAmount", false);
            boolean writeResult = permissionCheckService.hasFieldAccess(userId, "project", "budgetAmount", true);

            assertThat(readResult).isTrue();
            assertThat(writeResult).isTrue();
        }
    }

    @Nested
    @DisplayName("Permission Summary")
    class PermissionSummaryTests {

        @Test
        @DisplayName("Should return complete permission summary for user and model")
        void getPermissionSummary_ReturnsCompleteInfo() {
            ModelAccess access = ModelAccess.builder()
                    .modelName("project")
                    .groupId(managerGroupId)
                    .canRead(true)
                    .canCreate(true)
                    .canUpdate(true)
                    .canDelete(false)
                    .build();

            when(userGroupRepository.findGroupIdsByUserId(userId))
                    .thenReturn(List.of(managerGroupId));
            when(modelAccessRepository.findByModelNameAndGroupIdIn("project", List.of(managerGroupId)))
                    .thenReturn(List.of(access));
            when(recordRuleRepository.findApplicableRules(eq("project"), any()))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> summary = permissionCheckService.getPermissionSummary(userId, "project");

            assertThat(summary).containsEntry("canRead", true);
            assertThat(summary).containsEntry("canCreate", true);
            assertThat(summary).containsEntry("canUpdate", true);
            assertThat(summary).containsEntry("canDelete", false);
            assertThat(summary).containsEntry("hasRecordRestrictions", false);
        }
    }
}
