package com.privod.platform.modules.support.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.support.domain.Faq;
import com.privod.platform.modules.support.domain.KnowledgeBase;
import com.privod.platform.modules.support.domain.TicketCategory;
import com.privod.platform.modules.support.repository.FaqRepository;
import com.privod.platform.modules.support.repository.KnowledgeBaseRepository;
import com.privod.platform.modules.support.repository.TicketCategoryRepository;
import com.privod.platform.modules.support.web.dto.CreateFaqRequest;
import com.privod.platform.modules.support.web.dto.CreateKnowledgeBaseRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCategoryRequest;
import com.privod.platform.modules.support.web.dto.FaqResponse;
import com.privod.platform.modules.support.web.dto.KnowledgeBaseResponse;
import com.privod.platform.modules.support.web.dto.TicketCategoryResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository kbRepository;
    private final FaqRepository faqRepository;
    private final TicketCategoryRepository categoryRepository;
    private final AuditService auditService;

    // ---- Categories ----

    @Transactional(readOnly = true)
    public List<TicketCategoryResponse> listActiveCategories() {
        return categoryRepository.findByIsActiveTrueAndDeletedFalse()
                .stream()
                .map(TicketCategoryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TicketCategoryResponse createCategory(CreateTicketCategoryRequest request) {
        TicketCategory category = TicketCategory.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .defaultAssigneeId(request.defaultAssigneeId())
                .slaHours(request.slaHours())
                .isActive(true)
                .build();

        category = categoryRepository.save(category);
        auditService.logCreate("TicketCategory", category.getId());

        log.info("Ticket category created: {} - {} ({})", category.getCode(),
                category.getName(), category.getId());
        return TicketCategoryResponse.fromEntity(category);
    }

    @Transactional
    public TicketCategoryResponse updateCategory(UUID id, CreateTicketCategoryRequest request) {
        TicketCategory category = categoryRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Категория не найдена: " + id));

        if (request.name() != null) category.setName(request.name());
        if (request.description() != null) category.setDescription(request.description());
        if (request.defaultAssigneeId() != null) category.setDefaultAssigneeId(request.defaultAssigneeId());
        if (request.slaHours() != null) category.setSlaHours(request.slaHours());

        category = categoryRepository.save(category);
        auditService.logUpdate("TicketCategory", category.getId(), "multiple", null, null);

        log.info("Ticket category updated: {} ({})", category.getName(), category.getId());
        return TicketCategoryResponse.fromEntity(category);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        TicketCategory category = categoryRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Категория не найдена: " + id));

        category.softDelete();
        categoryRepository.save(category);
        auditService.logDelete("TicketCategory", id);
        log.info("Ticket category deleted: {}", id);
    }

    // ---- Knowledge Base ----

    @Transactional(readOnly = true)
    public Page<KnowledgeBaseResponse> listPublishedArticles(Pageable pageable) {
        return kbRepository.findByIsPublishedTrueAndDeletedFalse(pageable)
                .map(KnowledgeBaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public KnowledgeBaseResponse getArticle(UUID id) {
        KnowledgeBase kb = kbRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья не найдена: " + id));

        // Increment views
        kb.setViews(kb.getViews() + 1);
        kbRepository.save(kb);

        return KnowledgeBaseResponse.fromEntity(kb);
    }

    @Transactional
    public KnowledgeBaseResponse createArticle(CreateKnowledgeBaseRequest request) {
        KnowledgeBase kb = KnowledgeBase.builder()
                .title(request.title())
                .content(request.content())
                .categoryId(request.categoryId())
                .tags(request.tags())
                .authorId(request.authorId())
                .views(0)
                .isPublished(false)
                .build();

        kb = kbRepository.save(kb);
        auditService.logCreate("KnowledgeBase", kb.getId());

        log.info("Knowledge base article created: {} ({})", kb.getTitle(), kb.getId());
        return KnowledgeBaseResponse.fromEntity(kb);
    }

    @Transactional
    public KnowledgeBaseResponse updateArticle(UUID id, CreateKnowledgeBaseRequest request) {
        KnowledgeBase kb = kbRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья не найдена: " + id));

        if (request.title() != null) kb.setTitle(request.title());
        if (request.content() != null) kb.setContent(request.content());
        if (request.categoryId() != null) kb.setCategoryId(request.categoryId());
        if (request.tags() != null) kb.setTags(request.tags());

        kb = kbRepository.save(kb);
        auditService.logUpdate("KnowledgeBase", kb.getId(), "multiple", null, null);

        log.info("Knowledge base article updated: {} ({})", kb.getTitle(), kb.getId());
        return KnowledgeBaseResponse.fromEntity(kb);
    }

    @Transactional
    public void deleteArticle(UUID id) {
        KnowledgeBase kb = kbRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья не найдена: " + id));

        kb.softDelete();
        kbRepository.save(kb);
        auditService.logDelete("KnowledgeBase", id);
        log.info("Knowledge base article deleted: {}", id);
    }

    @Transactional
    public KnowledgeBaseResponse publishArticle(UUID id) {
        KnowledgeBase kb = kbRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья не найдена: " + id));

        kb.setPublished(true);
        kb = kbRepository.save(kb);
        auditService.logUpdate("KnowledgeBase", kb.getId(), "isPublished", "false", "true");

        log.info("Knowledge base article published: {} ({})", kb.getTitle(), kb.getId());
        return KnowledgeBaseResponse.fromEntity(kb);
    }

    // ---- FAQ ----

    @Transactional(readOnly = true)
    public List<FaqResponse> listActiveFaqs() {
        return faqRepository.findByIsActiveTrueAndDeletedFalseOrderBySortOrderAsc()
                .stream()
                .map(FaqResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FaqResponse> listFaqsByCategory(UUID categoryId) {
        return faqRepository.findByCategoryIdAndIsActiveTrueAndDeletedFalseOrderBySortOrderAsc(categoryId)
                .stream()
                .map(FaqResponse::fromEntity)
                .toList();
    }

    @Transactional
    public FaqResponse updateFaq(UUID id, CreateFaqRequest request) {
        Faq faq = faqRepository.findById(id)
                .filter(f -> !f.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("FAQ не найден: " + id));

        if (request.question() != null) faq.setQuestion(request.question());
        if (request.answer() != null) faq.setAnswer(request.answer());
        if (request.categoryId() != null) faq.setCategoryId(request.categoryId());
        if (request.sortOrder() != null) faq.setSortOrder(request.sortOrder());

        faq = faqRepository.save(faq);
        auditService.logUpdate("Faq", faq.getId(), "multiple", null, null);

        log.info("FAQ updated: {} ({})", faq.getQuestion(), faq.getId());
        return FaqResponse.fromEntity(faq);
    }

    @Transactional
    public void deleteFaq(UUID id) {
        Faq faq = faqRepository.findById(id)
                .filter(f -> !f.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("FAQ не найден: " + id));

        faq.softDelete();
        faqRepository.save(faq);
        auditService.logDelete("Faq", id);
        log.info("FAQ deleted: {}", id);
    }

    @Transactional
    public FaqResponse createFaq(CreateFaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.question())
                .answer(request.answer())
                .categoryId(request.categoryId())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isActive(true)
                .build();

        faq = faqRepository.save(faq);
        auditService.logCreate("Faq", faq.getId());

        log.info("FAQ created: {} ({})", faq.getQuestion(), faq.getId());
        return FaqResponse.fromEntity(faq);
    }
}
