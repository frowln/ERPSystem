package com.privod.platform.modules.ai.web;

import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ai.domain.AnalysisStatus;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.service.AiAssistantService;
import com.privod.platform.modules.ai.service.AiConversationService;
import com.privod.platform.modules.ai.service.AiDocumentAnalysisService;
import com.privod.platform.modules.ai.web.dto.AiChatRequest;
import com.privod.platform.modules.ai.web.dto.AiChatResponse;
import com.privod.platform.modules.ai.web.dto.AiConversationResponse;
import com.privod.platform.modules.ai.web.dto.AiDocumentAnalysisResponse;
import com.privod.platform.modules.ai.web.dto.AiMessageResponse;
import com.privod.platform.modules.ai.web.dto.AiStatusResponse;
import com.privod.platform.modules.ai.web.dto.CreateConversationRequest;
import com.privod.platform.modules.ai.web.dto.CreateDocumentAnalysisRequest;
import com.privod.platform.modules.ai.web.dto.SendMessageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI/ML assistant endpoints")
@Slf4j
@PreAuthorize("isAuthenticated()")
public class AiController {

    private final AiConversationService conversationService;
    private final AiDocumentAnalysisService documentAnalysisService;
    private final AiAssistantService aiAssistantService;

    // ---- AI Chat (main endpoint) ----

    @PostMapping("/chat")
    @Operation(summary = "Send a message to the AI assistant and get a response",
            description = "Sends a message, optionally within an existing conversation. " +
                    "If no conversationId is provided, a new conversation is created automatically. " +
                    "The AI uses context from the platform database to answer data-related questions.")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @Valid @RequestBody AiChatRequest request) {
        UUID userId = getCurrentUserId();
        AiChatResponse response = aiAssistantService.chat(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Send a message and get a streaming response via SSE",
            description = "Streams the AI response token by token using Server-Sent Events. " +
                    "Events: 'conversation' (with conversationId), 'message' (content chunks), " +
                    "'done' (completion signal), 'error' (error message).")
    public SseEmitter chatStream(@Valid @RequestBody AiChatRequest request) {
        UUID userId = getCurrentUserId();
        return aiAssistantService.chatStream(request, userId);
    }

    @GetMapping("/status")
    @Operation(summary = "Check if the AI assistant is configured and available")
    public ResponseEntity<ApiResponse<AiStatusResponse>> getStatus() {
        AiStatusResponse status = aiAssistantService.getStatus();
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    // ---- Conversations ----

    @GetMapping("/conversations")
    @Operation(summary = "List conversations for the current user")
    public ResponseEntity<ApiResponse<PageResponse<AiConversationResponse>>> listConversations(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) ConversationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = getCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access conversations for another user");
        }
        Page<AiConversationResponse> page = conversationService.findByUser(currentUserId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Get conversation by ID")
    public ResponseEntity<ApiResponse<AiConversationResponse>> getConversation(@PathVariable UUID id) {
        AiConversationResponse response = conversationService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/conversations")
    @Operation(summary = "Create a new AI conversation")
    public ResponseEntity<ApiResponse<AiConversationResponse>> createConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        AiConversationResponse response = conversationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/conversations/{id}/messages")
    @Operation(summary = "Send a message in a conversation (with AI response)",
            description = "Sends a user message and returns the AI assistant's response. " +
                    "The AI processes the message with full conversation history and database context.")
    public ResponseEntity<ApiResponse<AiMessageResponse>> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request) {
        AiMessageResponse response = conversationService.sendMessage(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/conversations/{id}/messages")
    @Operation(summary = "Get all messages in a conversation")
    public ResponseEntity<ApiResponse<List<AiMessageResponse>>> getMessages(@PathVariable UUID id) {
        List<AiMessageResponse> messages = conversationService.getMessages(id);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PatchMapping("/conversations/{id}/archive")
    @Operation(summary = "Archive a conversation")
    public ResponseEntity<ApiResponse<AiConversationResponse>> archiveConversation(@PathVariable UUID id) {
        AiConversationResponse response = conversationService.archive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/conversations/{id}")
    @Operation(summary = "Delete a conversation (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable UUID id) {
        conversationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Document Analysis ----

    @PostMapping("/document-analyses")
    @Operation(summary = "Create a document analysis request")
    public ResponseEntity<ApiResponse<AiDocumentAnalysisResponse>> createDocumentAnalysis(
            @Valid @RequestBody CreateDocumentAnalysisRequest request) {
        AiDocumentAnalysisResponse response = documentAnalysisService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/document-analyses/{id}")
    @Operation(summary = "Get document analysis by ID")
    public ResponseEntity<ApiResponse<AiDocumentAnalysisResponse>> getDocumentAnalysis(@PathVariable UUID id) {
        AiDocumentAnalysisResponse response = documentAnalysisService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/document-analyses")
    @Operation(summary = "List document analyses by status")
    public ResponseEntity<ApiResponse<PageResponse<AiDocumentAnalysisResponse>>> listDocumentAnalyses(
            @RequestParam(required = false) AnalysisStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiDocumentAnalysisResponse> page = documentAnalysisService.findByStatus(
                status != null ? status : AnalysisStatus.PENDING, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Helper ----

    /**
     * Extract the current authenticated user's ID from the SecurityContext.
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        throw new IllegalStateException("No authenticated user found in SecurityContext");
    }
}
