package com.privod.platform.modules.ai.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.ai.domain.AiContextType;
import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.AiConversationContext;
import com.privod.platform.modules.ai.domain.AiMessage;
import com.privod.platform.modules.ai.domain.AiModelConfig;
import com.privod.platform.modules.ai.domain.AiPromptCategory;
import com.privod.platform.modules.ai.domain.AiPromptTemplate;
import com.privod.platform.modules.ai.domain.AiUsageLog;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.domain.MessageRole;
import com.privod.platform.modules.ai.repository.AiConversationContextRepository;
import com.privod.platform.modules.ai.repository.AiConversationRepository;
import com.privod.platform.modules.ai.repository.AiMessageRepository;
import com.privod.platform.modules.ai.repository.AiModelConfigRepository;
import com.privod.platform.modules.ai.repository.AiPromptTemplateRepository;
import com.privod.platform.modules.ai.repository.AiUsageLogRepository;
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
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantEnhancedService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiConversationContextRepository contextRepository;
    private final AiModelConfigRepository modelConfigRepository;
    private final AiPromptTemplateRepository promptTemplateRepository;
    private final AiUsageLogRepository usageLogRepository;
    private final AiAssistantService aiAssistantService;
    private final AiContextService aiContextService;
    private final AuditService auditService;

    // ========================================================================
    // Chat with enhanced context
    // ========================================================================

    @Transactional
    public EnhancedAiChatResponse chat(EnhancedAiChatRequest request, UUID userId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        long startTime = System.currentTimeMillis();

        // Resolve or create conversation with org scope
        AiConversation conversation = getOrCreateConversation(request.conversationId(), userId, request.message());

        // Bind context if provided
        if (request.contextType() != null) {
            addContextInternal(conversation.getId(), orgId, request.contextType(), request.entityId(), null);
        }

        // Build enhanced system prompt from context
        String contextPrompt = buildSystemPrompt(conversation.getId());

        // Delegate to existing AI assistant for actual LLM call
        com.privod.platform.modules.ai.web.dto.AiChatRequest chatRequest =
                new com.privod.platform.modules.ai.web.dto.AiChatRequest(request.message(), conversation.getId());
        com.privod.platform.modules.ai.web.dto.AiChatResponse chatResponse = aiAssistantService.chat(chatRequest, userId);

        long responseTimeMs = System.currentTimeMillis() - startTime;

        // Get default model config for the org (if any)
        AiModelConfig defaultConfig = getDefaultModelConfigInternal(orgId);

        // Log enhanced usage
        AiUsageLog usageLog = AiUsageLog.builder()
                .organizationId(orgId)
                .userId(userId)
                .conversationId(conversation.getId())
                .modelConfigId(defaultConfig != null ? defaultConfig.getId() : null)
                .feature("AI_ENHANCED_CHAT")
                .tokensInput(chatResponse.tokensUsed() / 2)
                .tokensOutput(chatResponse.tokensUsed() - chatResponse.tokensUsed() / 2)
                .cost(0.0)
                .costRub(calculateCostRub(chatResponse.tokensUsed(), defaultConfig))
                .responseTimeMs(responseTimeMs)
                .wasSuccessful(true)
                .build();
        usageLogRepository.save(usageLog);

        String provider = defaultConfig != null ? defaultConfig.getProvider().getDisplayName() : "OpenAI";
        String model = chatResponse.model() != null ? chatResponse.model() : "default";

        log.info("Enhanced AI chat completed: conversationId={}, tokensUsed={}, responseTimeMs={}, provider={}",
                conversation.getId(), chatResponse.tokensUsed(), responseTimeMs, provider);

        return new EnhancedAiChatResponse(
                chatResponse.reply(),
                conversation.getId(),
                chatResponse.tokensUsed(),
                responseTimeMs,
                model,
                provider
        );
    }

    // ========================================================================
    // System prompt builder with construction domain knowledge
    // ========================================================================

    public String buildSystemPrompt(UUID conversationId) {
        List<AiConversationContext> contexts = contextRepository.findByConversationIdAndDeletedFalse(conversationId);
        if (contexts.isEmpty()) {
            return getDefaultConstructionSystemPrompt();
        }

        StringBuilder prompt = new StringBuilder(getDefaultConstructionSystemPrompt());
        prompt.append("\n\n--- ПРИВЯЗАННЫЙ КОНТЕКСТ ---\n");

        for (AiConversationContext ctx : contexts) {
            prompt.append("Тип контекста: ").append(ctx.getContextType().getDisplayName()).append("\n");
            if (ctx.getEntityName() != null) {
                prompt.append("Объект: ").append(ctx.getEntityName()).append("\n");
            }
            if (ctx.getContextDataJson() != null && !ctx.getContextDataJson().isEmpty()) {
                prompt.append("Данные: ").append(ctx.getContextDataJson()).append("\n");
            }
            prompt.append("---\n");
        }

        return prompt.toString();
    }

    private String getDefaultConstructionSystemPrompt() {
        return """
                Ты — AI-ассистент строительной ERP-платформы ПРИВОД. Твоя задача — помогать пользователям \
                с управлением строительными проектами, документацией, сметами, финансами, охраной труда и \
                контролем качества.

                Правила:
                1. Отвечай на русском языке, если пользователь не просит иначе.
                2. Используй профессиональную строительную терминологию (СНиП, ГОСТ, СП).
                3. При работе с документами учитывай требования российского законодательства (ГрК РФ, 44-ФЗ, 214-ФЗ).
                4. Все персональные данные обрабатываются в соответствии с 152-ФЗ «О персональных данных».
                5. Не раскрывай конфиденциальные данные других организаций.
                6. При расчётах используй рубли (RUB) как основную валюту.
                7. Форматируй ответы структурированно: заголовки, списки, таблицы при необходимости.
                8. Если не уверен в данных, явно укажи это и предложи проверить в соответствующем модуле платформы.
                """;
    }

    // ========================================================================
    // Conversation lifecycle
    // ========================================================================

    @Transactional
    public AiConversation getOrCreateConversation(UUID conversationId, UUID userId, String firstMessage) {
        if (conversationId != null) {
            return conversationRepository.findByIdAndDeletedFalse(conversationId)
                    .orElseThrow(() -> new EntityNotFoundException("Диалог не найден: " + conversationId));
        }

        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        String title = firstMessage != null && firstMessage.length() > 100
                ? firstMessage.substring(0, 97) + "..."
                : firstMessage;

        AiConversation conversation = AiConversation.builder()
                .organizationId(orgId)
                .userId(userId)
                .title(title != null ? title : "Новый диалог")
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(Instant.now())
                .build();

        conversation = conversationRepository.save(conversation);
        auditService.logCreate("AiConversation", conversation.getId());
        log.info("Enhanced AI conversation created: id={}, userId={}, orgId={}", conversation.getId(), userId, orgId);
        return conversation;
    }

    @Transactional(readOnly = true)
    public AiConversationResponse getConversationWithContext(UUID conversationId) {
        AiConversation conversation = conversationRepository.findByIdAndDeletedFalse(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Диалог не найден: " + conversationId));
        return AiConversationResponse.fromEntity(conversation);
    }

    // ========================================================================
    // Context management
    // ========================================================================

    @Transactional
    public AiConversationContextResponse addContext(UUID conversationId, AddContextRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Verify conversation exists
        conversationRepository.findByIdAndDeletedFalse(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Диалог не найден: " + conversationId));

        AiConversationContext context = addContextInternal(
                conversationId, orgId, request.contextType(), request.entityId(), request.entityName());
        return AiConversationContextResponse.fromEntity(context);
    }

    @Transactional(readOnly = true)
    public List<AiConversationContextResponse> getContexts(UUID conversationId) {
        return contextRepository.findByConversationIdAndDeletedFalse(conversationId)
                .stream()
                .map(AiConversationContextResponse::fromEntity)
                .toList();
    }

    private AiConversationContext addContextInternal(UUID conversationId, UUID orgId,
                                                      AiContextType contextType, UUID entityId, String entityName) {
        // Check if context of this type already exists for the conversation
        var existing = contextRepository.findByConversationIdAndContextTypeAndDeletedFalse(conversationId, contextType);
        if (existing.isPresent()) {
            AiConversationContext ctx = existing.get();
            ctx.setEntityId(entityId);
            ctx.setEntityName(entityName);
            return contextRepository.save(ctx);
        }

        AiConversationContext context = AiConversationContext.builder()
                .organizationId(orgId)
                .conversationId(conversationId)
                .contextType(contextType)
                .entityId(entityId)
                .entityName(entityName)
                .build();

        context = contextRepository.save(context);
        auditService.logCreate("AiConversationContext", context.getId());
        return context;
    }

    // ========================================================================
    // Model config CRUD
    // ========================================================================

    @Transactional
    public AiModelConfigResponse createModelConfig(CreateAiModelConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(request.isDefault())) {
            modelConfigRepository.findByOrganizationIdAndIsDefaultTrueAndDeletedFalse(orgId)
                    .ifPresent(existing -> {
                        existing.setIsDefault(false);
                        modelConfigRepository.save(existing);
                    });
        }

        AiModelConfig config = AiModelConfig.builder()
                .organizationId(orgId)
                .provider(request.provider())
                .apiUrl(request.apiUrl())
                .apiKeyEncrypted(request.apiKeyEncrypted())
                .modelName(request.modelName())
                .maxTokens(request.maxTokens() != null ? request.maxTokens() : 4096)
                .temperature(request.temperature() != null ? request.temperature() : 0.7)
                .isActive(true)
                .isDefault(Boolean.TRUE.equals(request.isDefault()))
                .dataProcessingAgreementSigned(Boolean.TRUE.equals(request.dataProcessingAgreementSigned()))
                .build();

        config = modelConfigRepository.save(config);
        auditService.logCreate("AiModelConfig", config.getId());
        log.info("AI model config created: id={}, provider={}, model={}", config.getId(), config.getProvider(), config.getModelName());
        return AiModelConfigResponse.fromEntity(config);
    }

    @Transactional(readOnly = true)
    public Page<AiModelConfigResponse> listModelConfigs(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return modelConfigRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(AiModelConfigResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AiModelConfigResponse getModelConfig(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiModelConfig config = modelConfigRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация модели не найдена: " + id));
        return AiModelConfigResponse.fromEntity(config);
    }

    @Transactional
    public AiModelConfigResponse updateModelConfig(UUID id, CreateAiModelConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiModelConfig config = modelConfigRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация модели не найдена: " + id));

        // If setting as default, unset other defaults
        if (Boolean.TRUE.equals(request.isDefault()) && !Boolean.TRUE.equals(config.getIsDefault())) {
            modelConfigRepository.findByOrganizationIdAndIsDefaultTrueAndDeletedFalse(orgId)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            existing.setIsDefault(false);
                            modelConfigRepository.save(existing);
                        }
                    });
        }

        config.setProvider(request.provider());
        config.setApiUrl(request.apiUrl());
        if (request.apiKeyEncrypted() != null) {
            config.setApiKeyEncrypted(request.apiKeyEncrypted());
        }
        config.setModelName(request.modelName());
        if (request.maxTokens() != null) config.setMaxTokens(request.maxTokens());
        if (request.temperature() != null) config.setTemperature(request.temperature());
        config.setIsDefault(Boolean.TRUE.equals(request.isDefault()));
        if (request.dataProcessingAgreementSigned() != null) {
            config.setDataProcessingAgreementSigned(request.dataProcessingAgreementSigned());
        }

        config = modelConfigRepository.save(config);
        auditService.logUpdate("AiModelConfig", config.getId(), "config", null, config.getProvider().name());
        return AiModelConfigResponse.fromEntity(config);
    }

    @Transactional
    public void deleteModelConfig(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiModelConfig config = modelConfigRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация модели не найдена: " + id));
        config.softDelete();
        modelConfigRepository.save(config);
        auditService.logDelete("AiModelConfig", id);
    }

    @Transactional(readOnly = true)
    public AiModelConfigResponse getDefaultModelConfig() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiModelConfig config = getDefaultModelConfigInternal(orgId);
        if (config == null) {
            throw new EntityNotFoundException("Конфигурация модели по умолчанию не найдена для организации");
        }
        return AiModelConfigResponse.fromEntity(config);
    }

    private AiModelConfig getDefaultModelConfigInternal(UUID orgId) {
        return modelConfigRepository.findByOrganizationIdAndIsDefaultTrueAndDeletedFalse(orgId)
                .orElse(null);
    }

    // ========================================================================
    // Prompt template CRUD
    // ========================================================================

    @Transactional
    public AiPromptTemplateResponse createPromptTemplate(CreatePromptTemplateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        AiPromptTemplate template = AiPromptTemplate.builder()
                .organizationId(orgId)
                .name(request.name())
                .category(request.category())
                .promptTextRu(request.promptTextRu())
                .promptTextEn(request.promptTextEn())
                .variablesJson(request.variablesJson())
                .isSystem(Boolean.TRUE.equals(request.isSystem()))
                .build();

        template = promptTemplateRepository.save(template);
        auditService.logCreate("AiPromptTemplate", template.getId());
        log.info("AI prompt template created: id={}, name={}, category={}", template.getId(), template.getName(), template.getCategory());
        return AiPromptTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public Page<AiPromptTemplateResponse> listPromptTemplates(AiPromptCategory category, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (category != null) {
            List<AiPromptTemplate> filtered = promptTemplateRepository
                    .findByOrganizationIdAndCategoryAndDeletedFalse(orgId, category);
            Page<AiPromptTemplate> page = new org.springframework.data.domain.PageImpl<>(
                    filtered, pageable, filtered.size());
            return page.map(AiPromptTemplateResponse::fromEntity);
        }
        return promptTemplateRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(AiPromptTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AiPromptTemplateResponse getPromptTemplate(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiPromptTemplate template = promptTemplateRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон промпта не найден: " + id));
        return AiPromptTemplateResponse.fromEntity(template);
    }

    @Transactional
    public AiPromptTemplateResponse updatePromptTemplate(UUID id, CreatePromptTemplateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiPromptTemplate template = promptTemplateRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон промпта не найден: " + id));

        template.setName(request.name());
        template.setCategory(request.category());
        template.setPromptTextRu(request.promptTextRu());
        template.setPromptTextEn(request.promptTextEn());
        template.setVariablesJson(request.variablesJson());
        if (request.isSystem() != null) {
            template.setIsSystem(request.isSystem());
        }

        template = promptTemplateRepository.save(template);
        auditService.logUpdate("AiPromptTemplate", template.getId(), "template", null, template.getName());
        return AiPromptTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deletePromptTemplate(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AiPromptTemplate template = promptTemplateRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон промпта не найден: " + id));
        template.softDelete();
        promptTemplateRepository.save(template);
        auditService.logDelete("AiPromptTemplate", id);
    }

    // ========================================================================
    // Usage analytics
    // ========================================================================

    @Transactional(readOnly = true)
    public AiUsageSummaryResponse getUsageSummary(LocalDate from, LocalDate to) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toInstant = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        long totalConversations = usageLogRepository.countDistinctConversationsByOrgAndPeriod(orgId, fromInstant, toInstant);
        long totalTokens = usageLogRepository.sumTokensByOrgAndPeriod(orgId, fromInstant, toInstant);
        double totalCostRub = usageLogRepository.sumCostRubByOrgAndPeriod(orgId, fromInstant, toInstant);
        double avgResponseTimeMs = usageLogRepository.avgResponseTimeMsByOrgAndPeriod(orgId, fromInstant, toInstant);

        return new AiUsageSummaryResponse(totalConversations, totalTokens, totalCostRub, avgResponseTimeMs);
    }

    @Transactional(readOnly = true)
    public Page<AiUsageLogResponse> getUsageLogs(LocalDate from, LocalDate to, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (from != null && to != null) {
            Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
            Instant toInstant = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            return usageLogRepository.findByOrganizationIdAndCreatedAtBetweenAndDeletedFalse(
                    orgId, fromInstant, toInstant, pageable).map(AiUsageLogResponse::fromEntity);
        }
        return usageLogRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(AiUsageLogResponse::fromEntity);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private double calculateCostRub(int totalTokens, AiModelConfig config) {
        // Approximate cost in RUB based on provider
        // Yandex GPT: ~0.20 RUB per 1K tokens
        // GigaChat: ~0.15 RUB per 1K tokens
        // OpenAI: ~0.01 USD * 90 RUB = ~0.90 RUB per 1K tokens (gpt-4o-mini)
        if (config == null) {
            return totalTokens * 0.0009; // default OpenAI pricing in RUB
        }
        return switch (config.getProvider()) {
            case YANDEX_GPT -> totalTokens * 0.0002;
            case GIGACHAT -> totalTokens * 0.00015;
            case SELF_HOSTED -> 0.0;
            case OPENAI -> totalTokens * 0.0009;
        };
    }
}
