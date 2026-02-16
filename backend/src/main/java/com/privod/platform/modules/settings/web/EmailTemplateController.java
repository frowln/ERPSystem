package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.settings.service.EmailTemplateService;
import com.privod.platform.modules.settings.web.dto.CreateEmailTemplateRequest;
import com.privod.platform.modules.settings.web.dto.EmailTemplateResponse;
import com.privod.platform.modules.settings.web.dto.RenderTemplateRequest;
import com.privod.platform.modules.settings.web.dto.RenderedTemplateResponse;
import com.privod.platform.modules.settings.web.dto.SendEmailRequest;
import com.privod.platform.modules.settings.web.dto.UpdateEmailTemplateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/email-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Email Templates", description = "Управление шаблонами email")
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping
    @Operation(summary = "Список шаблонов email с пагинацией и поиском")
    public ResponseEntity<ApiResponse<PageResponse<EmailTemplateResponse>>> list(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EmailTemplateResponse> page = emailTemplateService.listTemplates(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить шаблон email по ID")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getById(@PathVariable UUID id) {
        EmailTemplateResponse response = emailTemplateService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Получить шаблон email по коду")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getByCode(@PathVariable String code) {
        EmailTemplateResponse response = emailTemplateService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Создать новый шаблон email")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> create(
            @Valid @RequestBody CreateEmailTemplateRequest request) {
        EmailTemplateResponse response = emailTemplateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить шаблон email")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmailTemplateRequest request) {
        EmailTemplateResponse response = emailTemplateService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить шаблон email")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        emailTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/render")
    @Operation(summary = "Предпросмотр шаблона с подставленными переменными")
    public ResponseEntity<ApiResponse<RenderedTemplateResponse>> render(
            @Valid @RequestBody RenderTemplateRequest request) {
        RenderedTemplateResponse response = emailTemplateService.renderTemplate(
                request.code(), request.variables());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/send")
    @Operation(summary = "Отправить email по шаблону")
    public ResponseEntity<ApiResponse<Void>> send(@Valid @RequestBody SendEmailRequest request) {
        emailTemplateService.sendEmail(request.code(), request.recipientEmail(), request.variables());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
