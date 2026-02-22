package com.privod.platform.modules.ai.web;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ai.domain.AiPromptCategory;
import com.privod.platform.modules.ai.service.AiAssistantEnhancedService;
import com.privod.platform.modules.ai.web.dto.AddContextRequest;
import com.privod.platform.modules.ai.web.dto.AiConversationContextResponse;
import com.privod.platform.modules.ai.web.dto.AiConversationResponse;
import com.privod.platform.modules.ai.web.dto.AiModelConfigResponse;
import com.privod.platform.modules.ai.web.dto.AiPromptTemplateResponse;
import com.privod.platform.modules.ai.web.dto.AiUsageLogResponse;
import com.privod.platform.modules.ai.web.dto.AiUsageSummaryResponse;
import com.privod.platform.modules.ai.web.dto.CreateAiModelConfigRequest;
import com.privod.platform.modules.ai.web.dto.CreatePromptTemplateRequest;
import com.privod.platform.modules.ai.web.dto.EnhancedAiChatRequest;
import com.privod.platform.modules.ai.web.dto.EnhancedAiChatResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/assistant")
@RequiredArgsConstructor
@Tag(name = "AI Assistant Enhanced", description = "Enhanced AI assistant with Russian LLM support and context management")
@Slf4j
@PreAuthorize("isAuthenticated()")
public class AiAssistantEnhancedController {

    private final AiAssistantEnhancedService enhancedService;

    // ---- Enhanced Chat ----

    @PostMapping("/chat")
    @Operation(summary = "Send a message to the enhanced AI assistant",
            description = "Processes user message with context binding, Russian LLM support, and usage tracking. "
                    + "Optionally binds conversation to a project, document, or other domain entity.")
    public ResponseEntity<ApiResponse<EnhancedAiChatResponse>> chat(
            @Valid @RequestBody EnhancedAiChatRequest request) {
        UUID userId = getCurrentUserId();
        EnhancedAiChatResponse response = enhancedService.chat(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Conversation Context ----

    @PostMapping("/conversations/{id}/context")
    @Operation(summary = "Add context to a conversation",
            description = "Binds a domain entity (project, document, estimate, etc.) to a conversation for contextual AI responses.")
    public ResponseEntity<ApiResponse<AiConversationContextResponse>> addContext(
            @PathVariable UUID id,
            @Valid @RequestBody AddContextRequest request) {
        AiConversationContextResponse response = enhancedService.addContext(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Get conversation with context")
    public ResponseEntity<ApiResponse<AiConversationResponse>> getConversation(@PathVariable UUID id) {
        AiConversationResponse response = enhancedService.getConversationWithContext(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/conversations/{id}/contexts")
    @Operation(summary = "Get all contexts bound to a conversation")
    public ResponseEntity<ApiResponse<List<AiConversationContextResponse>>> getContexts(@PathVariable UUID id) {
        List<AiConversationContextResponse> contexts = enhancedService.getContexts(id);
        return ResponseEntity.ok(ApiResponse.ok(contexts));
    }

    // ---- Model Configs ----

    @PostMapping("/model-configs")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Create AI model configuration",
            description = "Configure an LLM provider (Yandex GPT, GigaChat, self-hosted, OpenAI) for the organization.")
    public ResponseEntity<ApiResponse<AiModelConfigResponse>> createModelConfig(
            @Valid @RequestBody CreateAiModelConfigRequest request) {
        AiModelConfigResponse response = enhancedService.createModelConfig(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/model-configs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "List AI model configurations for the organization")
    public ResponseEntity<ApiResponse<PageResponse<AiModelConfigResponse>>> listModelConfigs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiModelConfigResponse> page = enhancedService.listModelConfigs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/model-configs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get AI model configuration by ID")
    public ResponseEntity<ApiResponse<AiModelConfigResponse>> getModelConfig(@PathVariable UUID id) {
        AiModelConfigResponse response = enhancedService.getModelConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/model-configs/default")
    @Operation(summary = "Get the default AI model configuration for the organization")
    public ResponseEntity<ApiResponse<AiModelConfigResponse>> getDefaultModelConfig() {
        AiModelConfigResponse response = enhancedService.getDefaultModelConfig();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/model-configs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Update AI model configuration")
    public ResponseEntity<ApiResponse<AiModelConfigResponse>> updateModelConfig(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAiModelConfigRequest request) {
        AiModelConfigResponse response = enhancedService.updateModelConfig(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/model-configs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete AI model configuration (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteModelConfig(@PathVariable UUID id) {
        enhancedService.deleteModelConfig(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Prompt Templates ----

    @PostMapping("/prompt-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Create a reusable prompt template",
            description = "Create a prompt template for the construction domain (document generation, reports, analysis, etc.)")
    public ResponseEntity<ApiResponse<AiPromptTemplateResponse>> createPromptTemplate(
            @Valid @RequestBody CreatePromptTemplateRequest request) {
        AiPromptTemplateResponse response = enhancedService.createPromptTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/prompt-templates")
    @Operation(summary = "List prompt templates for the organization")
    public ResponseEntity<ApiResponse<PageResponse<AiPromptTemplateResponse>>> listPromptTemplates(
            @RequestParam(required = false) AiPromptCategory category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiPromptTemplateResponse> page = enhancedService.listPromptTemplates(category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/prompt-templates/{id}")
    @Operation(summary = "Get prompt template by ID")
    public ResponseEntity<ApiResponse<AiPromptTemplateResponse>> getPromptTemplate(@PathVariable UUID id) {
        AiPromptTemplateResponse response = enhancedService.getPromptTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/prompt-templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Update a prompt template")
    public ResponseEntity<ApiResponse<AiPromptTemplateResponse>> updatePromptTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePromptTemplateRequest request) {
        AiPromptTemplateResponse response = enhancedService.updatePromptTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/prompt-templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete a prompt template (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePromptTemplate(@PathVariable UUID id) {
        enhancedService.deletePromptTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Usage Analytics ----

    @GetMapping("/usage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get AI usage summary for the organization",
            description = "Returns aggregated usage statistics: total conversations, tokens, cost in RUB, avg response time.")
    public ResponseEntity<ApiResponse<AiUsageSummaryResponse>> getUsageSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AiUsageSummaryResponse response = enhancedService.getUsageSummary(from, to);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/usage/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get detailed AI usage logs")
    public ResponseEntity<ApiResponse<PageResponse<AiUsageLogResponse>>> getUsageLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiUsageLogResponse> page = enhancedService.getUsageLogs(from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Helper ----

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        throw new IllegalStateException("No authenticated user found in SecurityContext");
    }
}
