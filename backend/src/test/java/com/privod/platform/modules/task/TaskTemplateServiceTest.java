package com.privod.platform.modules.task;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskTemplate;
import com.privod.platform.modules.task.repository.TaskTemplateRepository;
import com.privod.platform.modules.task.service.TaskTemplateService;
import com.privod.platform.modules.task.web.dto.CreateTaskTemplateRequest;
import com.privod.platform.modules.task.web.dto.TaskTemplateResponse;
import com.privod.platform.modules.task.web.dto.UpdateTaskTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskTemplateServiceTest {

    @Mock
    private TaskTemplateRepository templateRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TaskTemplateService taskTemplateService;

    private UUID templateId;
    private TaskTemplate testTemplate;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();

        testTemplate = TaskTemplate.builder()
                .name("Шаблон монтажных работ")
                .description("Типовой шаблон для монтажных работ")
                .defaultPriority(TaskPriority.HIGH)
                .estimatedHours(new BigDecimal("40.00"))
                .category("Монтаж")
                .checklistTemplate("1. Подготовка\n2. Монтаж\n3. Проверка")
                .tags("монтаж,строительство")
                .isActive(true)
                .build();
        testTemplate.setId(templateId);
        testTemplate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Template")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should create template with all fields and default priority NORMAL when not specified")
        void createTemplate_WithNullPriority_SetsDefaultNormal() {
            CreateTaskTemplateRequest request = new CreateTaskTemplateRequest(
                    "Новый шаблон", "Описание", null,
                    new BigDecimal("20.00"), "Общие", null, "тег1,тег2");

            when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(invocation -> {
                TaskTemplate t = invocation.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            TaskTemplateResponse response = taskTemplateService.createTemplate(request);

            assertThat(response.name()).isEqualTo("Новый шаблон");
            assertThat(response.defaultPriority()).isEqualTo(TaskPriority.NORMAL);
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("TaskTemplate"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create template with explicit priority HIGH")
        void createTemplate_WithExplicitPriority_UsesProvidedValue() {
            CreateTaskTemplateRequest request = new CreateTaskTemplateRequest(
                    "Срочный шаблон", "Описание", TaskPriority.HIGH,
                    new BigDecimal("80.00"), "Аварийные", "чеклист", "срочно");

            when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(invocation -> {
                TaskTemplate t = invocation.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            TaskTemplateResponse response = taskTemplateService.createTemplate(request);

            assertThat(response.defaultPriority()).isEqualTo(TaskPriority.HIGH);
            assertThat(response.estimatedHours()).isEqualByComparingTo(new BigDecimal("80.00"));
            assertThat(response.category()).isEqualTo("Аварийные");
        }
    }

    @Nested
    @DisplayName("Get Template")
    class GetTemplateTests {

        @Test
        @DisplayName("Should return template when found and not deleted")
        void getTemplate_ExistingTemplate_ReturnsResponse() {
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));

            TaskTemplateResponse response = taskTemplateService.getTemplate(templateId);

            assertThat(response.id()).isEqualTo(templateId);
            assertThat(response.name()).isEqualTo("Шаблон монтажных работ");
            assertThat(response.defaultPriority()).isEqualTo(TaskPriority.HIGH);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for non-existing template")
        void getTemplate_NotFound_ThrowsException() {
            UUID missingId = UUID.randomUUID();
            when(templateRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskTemplateService.getTemplate(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон задачи не найден");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for soft-deleted template")
        void getTemplate_SoftDeleted_ThrowsException() {
            testTemplate.softDelete();
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));

            assertThatThrownBy(() -> taskTemplateService.getTemplate(templateId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон задачи не найден");
        }
    }

    @Nested
    @DisplayName("List Templates")
    class ListTemplatesTests {

        @Test
        @DisplayName("Should return only active templates when activeOnly is true")
        void listTemplates_ActiveOnly_CallsCorrectRepository() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<TaskTemplate> page = new PageImpl<>(List.of(testTemplate));
            when(templateRepository.findByDeletedFalseAndIsActiveTrue(pageable)).thenReturn(page);

            Page<TaskTemplateResponse> result = taskTemplateService.listTemplates(true, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("Шаблон монтажных работ");
        }

        @Test
        @DisplayName("Should return all non-deleted templates when activeOnly is false")
        void listTemplates_All_CallsFindByDeletedFalse() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<TaskTemplate> page = new PageImpl<>(List.of(testTemplate));
            when(templateRepository.findByDeletedFalse(pageable)).thenReturn(page);

            Page<TaskTemplateResponse> result = taskTemplateService.listTemplates(false, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Update Template")
    class UpdateTemplateTests {

        @Test
        @DisplayName("Should update only provided fields")
        void updateTemplate_PartialUpdate_OnlyChangesProvidedFields() {
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
            when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateTaskTemplateRequest request = new UpdateTaskTemplateRequest(
                    "Обновлённое название", null, null, null, null, null, null, null);

            TaskTemplateResponse response = taskTemplateService.updateTemplate(templateId, request);

            assertThat(response.name()).isEqualTo("Обновлённое название");
            assertThat(response.description()).isEqualTo("Типовой шаблон для монтажных работ");
            verify(auditService).logUpdate("TaskTemplate", templateId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should deactivate template when isActive is set to false")
        void updateTemplate_Deactivate_SetsIsActiveFalse() {
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
            when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateTaskTemplateRequest request = new UpdateTaskTemplateRequest(
                    null, null, null, null, null, null, null, false);

            TaskTemplateResponse response = taskTemplateService.updateTemplate(templateId, request);

            assertThat(response.isActive()).isFalse();
        }
    }

    @Nested
    @DisplayName("Delete Template")
    class DeleteTemplateTests {

        @Test
        @DisplayName("Should soft-delete template and log audit")
        void deleteTemplate_ExistingTemplate_SoftDeletes() {
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
            when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            taskTemplateService.deleteTemplate(templateId);

            assertThat(testTemplate.isDeleted()).isTrue();
            verify(templateRepository).save(testTemplate);
            verify(auditService).logDelete("TaskTemplate", templateId);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when deleting non-existing template")
        void deleteTemplate_NotFound_ThrowsException() {
            UUID missingId = UUID.randomUUID();
            when(templateRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskTemplateService.deleteTemplate(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон задачи не найден");
        }
    }
}
