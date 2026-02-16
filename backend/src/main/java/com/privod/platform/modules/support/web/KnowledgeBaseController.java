package com.privod.platform.modules.support.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.support.service.KnowledgeBaseService;
import com.privod.platform.modules.support.web.dto.CreateFaqRequest;
import com.privod.platform.modules.support.web.dto.CreateKnowledgeBaseRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCategoryRequest;
import com.privod.platform.modules.support.web.dto.FaqResponse;
import com.privod.platform.modules.support.web.dto.KnowledgeBaseResponse;
import com.privod.platform.modules.support.web.dto.TicketCategoryResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support/kb")
@RequiredArgsConstructor
@Tag(name = "Knowledge Base", description = "Knowledge base, categories, and FAQ management")
public class KnowledgeBaseController {

    private final KnowledgeBaseService kbService;

    // ---- Categories ----

    @GetMapping("/categories")
    @Operation(summary = "List active ticket categories")
    public ResponseEntity<ApiResponse<List<TicketCategoryResponse>>> listCategories() {
        List<TicketCategoryResponse> categories = kbService.listActiveCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Create a ticket category")
    public ResponseEntity<ApiResponse<TicketCategoryResponse>> createCategory(
            @Valid @RequestBody CreateTicketCategoryRequest request) {
        TicketCategoryResponse response = kbService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Update a ticket category")
    public ResponseEntity<ApiResponse<TicketCategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTicketCategoryRequest request) {
        TicketCategoryResponse response = kbService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Delete a ticket category (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        kbService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Knowledge Base Articles ----

    @GetMapping("/articles")
    @Operation(summary = "List published knowledge base articles")
    public ResponseEntity<ApiResponse<PageResponse<KnowledgeBaseResponse>>> listArticles(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<KnowledgeBaseResponse> page = kbService.listPublishedArticles(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/articles/{id}")
    @Operation(summary = "Get knowledge base article by ID (increments views)")
    public ResponseEntity<ApiResponse<KnowledgeBaseResponse>> getArticle(@PathVariable UUID id) {
        KnowledgeBaseResponse response = kbService.getArticle(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/articles")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Create a knowledge base article")
    public ResponseEntity<ApiResponse<KnowledgeBaseResponse>> createArticle(
            @Valid @RequestBody CreateKnowledgeBaseRequest request) {
        KnowledgeBaseResponse response = kbService.createArticle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Update a knowledge base article")
    public ResponseEntity<ApiResponse<KnowledgeBaseResponse>> updateArticle(
            @PathVariable UUID id,
            @Valid @RequestBody CreateKnowledgeBaseRequest request) {
        KnowledgeBaseResponse response = kbService.updateArticle(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Delete a knowledge base article (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable UUID id) {
        kbService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/articles/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Publish a knowledge base article")
    public ResponseEntity<ApiResponse<KnowledgeBaseResponse>> publishArticle(@PathVariable UUID id) {
        KnowledgeBaseResponse response = kbService.publishArticle(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- FAQ ----

    @GetMapping("/faqs")
    @Operation(summary = "List active FAQs")
    public ResponseEntity<ApiResponse<List<FaqResponse>>> listFaqs(
            @RequestParam(required = false) UUID categoryId) {
        List<FaqResponse> faqs;
        if (categoryId != null) {
            faqs = kbService.listFaqsByCategory(categoryId);
        } else {
            faqs = kbService.listActiveFaqs();
        }
        return ResponseEntity.ok(ApiResponse.ok(faqs));
    }

    @PostMapping("/faqs")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Create a FAQ entry")
    public ResponseEntity<ApiResponse<FaqResponse>> createFaq(
            @Valid @RequestBody CreateFaqRequest request) {
        FaqResponse response = kbService.createFaq(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/faqs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Update a FAQ entry")
    public ResponseEntity<ApiResponse<FaqResponse>> updateFaq(
            @PathVariable UUID id,
            @Valid @RequestBody CreateFaqRequest request) {
        FaqResponse response = kbService.updateFaq(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/faqs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_MANAGER')")
    @Operation(summary = "Delete a FAQ entry (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(@PathVariable UUID id) {
        kbService.deleteFaq(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
