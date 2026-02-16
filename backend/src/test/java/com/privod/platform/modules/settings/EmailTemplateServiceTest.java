package com.privod.platform.modules.settings;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.EmailTemplate;
import com.privod.platform.modules.settings.domain.EmailTemplateCategory;
import com.privod.platform.modules.settings.repository.EmailTemplateRepository;
import com.privod.platform.modules.settings.service.EmailTemplateService;
import com.privod.platform.modules.settings.web.dto.CreateEmailTemplateRequest;
import com.privod.platform.modules.settings.web.dto.EmailTemplateResponse;
import com.privod.platform.modules.settings.web.dto.RenderedTemplateResponse;
import com.privod.platform.modules.settings.web.dto.UpdateEmailTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {

    @Mock
    private EmailTemplateRepository emailTemplateRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EmailTemplateService emailTemplateService;

    private EmailTemplate taskAssignedTemplate;
    private UUID templateId;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();

        taskAssignedTemplate = EmailTemplate.builder()
                .code("task_assigned")
                .name("Назначение задачи")
                .subject("Вам назначена задача: {{task_title}}")
                .bodyHtml("<h2>Новая задача</h2><p>{{recipient_name}}, задача: {{task_title}}</p><p>Проект: {{project_name}}</p>")
                .bodyText("{{recipient_name}}, задача: {{task_title}}. Проект: {{project_name}}.")
                .category(EmailTemplateCategory.WORKFLOW)
                .variables(List.of("recipient_name", "task_title", "project_name", "due_date", "link"))
                .isActive(true)
                .build();
        taskAssignedTemplate.setId(templateId);
        taskAssignedTemplate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Template CRUD")
    class TemplateCrudTests {

        @Test
        @DisplayName("Should create email template")
        void createTemplate_Success() {
            when(emailTemplateRepository.existsByCodeAndDeletedFalse("new_template")).thenReturn(false);
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenAnswer(inv -> {
                EmailTemplate t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            CreateEmailTemplateRequest request = new CreateEmailTemplateRequest(
                    "new_template", "Новый шаблон", "Тема {{var}}",
                    "<p>{{var}}</p>", "{{var}}", EmailTemplateCategory.NOTIFICATION,
                    List.of("var")
            );

            EmailTemplateResponse result = emailTemplateService.createTemplate(request);

            assertThat(result.code()).isEqualTo("new_template");
            assertThat(result.name()).isEqualTo("Новый шаблон");
            verify(auditService).logCreate(eq("EmailTemplate"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate template code")
        void createTemplate_DuplicateCode() {
            when(emailTemplateRepository.existsByCodeAndDeletedFalse("task_assigned")).thenReturn(true);

            CreateEmailTemplateRequest request = new CreateEmailTemplateRequest(
                    "task_assigned", "Дубль", "Тема", null, null,
                    EmailTemplateCategory.WORKFLOW, null);

            assertThatThrownBy(() -> emailTemplateService.createTemplate(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }

        @Test
        @DisplayName("Should update email template")
        void updateTemplate_Success() {
            when(emailTemplateRepository.findById(templateId))
                    .thenReturn(Optional.of(taskAssignedTemplate));
            when(emailTemplateRepository.save(any(EmailTemplate.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UpdateEmailTemplateRequest request = new UpdateEmailTemplateRequest(
                    "Обновлённое назначение задачи", null, null, null, null, null, null);

            EmailTemplateResponse result = emailTemplateService.updateTemplate(templateId, request);

            assertThat(result.name()).isEqualTo("Обновлённое назначение задачи");
            verify(auditService).logUpdate("EmailTemplate", templateId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should soft-delete email template")
        void deleteTemplate_SoftDeletes() {
            when(emailTemplateRepository.findById(templateId))
                    .thenReturn(Optional.of(taskAssignedTemplate));
            when(emailTemplateRepository.save(any(EmailTemplate.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            emailTemplateService.deleteTemplate(templateId);

            assertThat(taskAssignedTemplate.isDeleted()).isTrue();
            verify(auditService).logDelete("EmailTemplate", templateId);
        }
    }

    @Nested
    @DisplayName("Template Rendering")
    class TemplateRenderingTests {

        @Test
        @DisplayName("Should render template with variable substitution")
        void renderTemplate_ReplacesVariables() {
            when(emailTemplateRepository.findByCodeAndDeletedFalse("task_assigned"))
                    .thenReturn(Optional.of(taskAssignedTemplate));

            Map<String, String> variables = Map.of(
                    "recipient_name", "Иванов Иван",
                    "task_title", "Подготовить КС-2",
                    "project_name", "ЖК Солнечный"
            );

            RenderedTemplateResponse result = emailTemplateService.renderTemplate("task_assigned", variables);

            assertThat(result.subject()).isEqualTo("Вам назначена задача: Подготовить КС-2");
            assertThat(result.bodyHtml()).contains("Иванов Иван");
            assertThat(result.bodyHtml()).contains("Подготовить КС-2");
            assertThat(result.bodyHtml()).contains("ЖК Солнечный");
            assertThat(result.bodyText()).contains("Иванов Иван");
        }

        @Test
        @DisplayName("Should throw when rendering inactive template")
        void renderTemplate_InactiveTemplate() {
            taskAssignedTemplate.setActive(false);
            when(emailTemplateRepository.findByCodeAndDeletedFalse("task_assigned"))
                    .thenReturn(Optional.of(taskAssignedTemplate));

            assertThatThrownBy(() -> emailTemplateService.renderTemplate("task_assigned", Map.of()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("неактивен");
        }

        @Test
        @DisplayName("Should throw when template not found")
        void renderTemplate_NotFound() {
            when(emailTemplateRepository.findByCodeAndDeletedFalse("nonexistent"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> emailTemplateService.renderTemplate("nonexistent", Map.of()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон email не найден");
        }
    }
}
