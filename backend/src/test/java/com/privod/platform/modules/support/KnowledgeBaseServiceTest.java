package com.privod.platform.modules.support;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.support.domain.Faq;
import com.privod.platform.modules.support.domain.KnowledgeBase;
import com.privod.platform.modules.support.domain.TicketCategory;
import com.privod.platform.modules.support.repository.FaqRepository;
import com.privod.platform.modules.support.repository.KnowledgeBaseRepository;
import com.privod.platform.modules.support.repository.TicketCategoryRepository;
import com.privod.platform.modules.support.service.KnowledgeBaseService;
import com.privod.platform.modules.support.web.dto.CreateFaqRequest;
import com.privod.platform.modules.support.web.dto.CreateKnowledgeBaseRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCategoryRequest;
import com.privod.platform.modules.support.web.dto.FaqResponse;
import com.privod.platform.modules.support.web.dto.KnowledgeBaseResponse;
import com.privod.platform.modules.support.web.dto.TicketCategoryResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class KnowledgeBaseServiceTest {

    @Mock
    private KnowledgeBaseRepository kbRepository;

    @Mock
    private FaqRepository faqRepository;

    @Mock
    private TicketCategoryRepository categoryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private KnowledgeBaseService kbService;

    @Nested
    @DisplayName("Categories")
    class CategoryTests {

        @Test
        @DisplayName("Should create ticket category")
        void createCategory_Success() {
            CreateTicketCategoryRequest request = new CreateTicketCategoryRequest(
                    "TECH", "Техническая поддержка",
                    "Технические вопросы", UUID.randomUUID(), 24);

            when(categoryRepository.save(any(TicketCategory.class))).thenAnswer(invocation -> {
                TicketCategory c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            TicketCategoryResponse response = kbService.createCategory(request);

            assertThat(response.code()).isEqualTo("TECH");
            assertThat(response.name()).isEqualTo("Техническая поддержка");
            assertThat(response.slaHours()).isEqualTo(24);
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("TicketCategory"), any(UUID.class));
        }

        @Test
        @DisplayName("Should list active categories")
        void listActiveCategories_Success() {
            TicketCategory cat1 = TicketCategory.builder()
                    .code("TECH").name("Техническая").isActive(true).build();
            cat1.setId(UUID.randomUUID());
            cat1.setCreatedAt(Instant.now());

            TicketCategory cat2 = TicketCategory.builder()
                    .code("BIZ").name("Бизнес").isActive(true).build();
            cat2.setId(UUID.randomUUID());
            cat2.setCreatedAt(Instant.now());

            when(categoryRepository.findByIsActiveTrueAndDeletedFalse()).thenReturn(List.of(cat1, cat2));

            List<TicketCategoryResponse> result = kbService.listActiveCategories();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).code()).isEqualTo("TECH");
        }
    }

    @Nested
    @DisplayName("Knowledge Base")
    class KBTests {

        @Test
        @DisplayName("Should create knowledge base article as unpublished")
        void createArticle_Success() {
            CreateKnowledgeBaseRequest request = new CreateKnowledgeBaseRequest(
                    "Как настроить авторизацию",
                    "Пошаговая инструкция по настройке...",
                    UUID.randomUUID(), "[\"auth\",\"setup\"]", UUID.randomUUID());

            when(kbRepository.save(any(KnowledgeBase.class))).thenAnswer(invocation -> {
                KnowledgeBase kb = invocation.getArgument(0);
                kb.setId(UUID.randomUUID());
                kb.setCreatedAt(Instant.now());
                return kb;
            });

            KnowledgeBaseResponse response = kbService.createArticle(request);

            assertThat(response.title()).isEqualTo("Как настроить авторизацию");
            assertThat(response.isPublished()).isFalse();
            assertThat(response.views()).isEqualTo(0);
            verify(auditService).logCreate(eq("KnowledgeBase"), any(UUID.class));
        }

        @Test
        @DisplayName("Should publish article")
        void publishArticle_Success() {
            UUID kbId = UUID.randomUUID();
            KnowledgeBase kb = KnowledgeBase.builder()
                    .title("Инструкция")
                    .content("Содержание")
                    .isPublished(false)
                    .views(0)
                    .build();
            kb.setId(kbId);
            kb.setCreatedAt(Instant.now());

            when(kbRepository.findById(kbId)).thenReturn(Optional.of(kb));
            when(kbRepository.save(any(KnowledgeBase.class))).thenAnswer(inv -> inv.getArgument(0));

            KnowledgeBaseResponse response = kbService.publishArticle(kbId);

            assertThat(response.isPublished()).isTrue();
            verify(auditService).logUpdate("KnowledgeBase", kbId, "isPublished", "false", "true");
        }

        @Test
        @DisplayName("Should increment views when getting article")
        void getArticle_IncrementsViews() {
            UUID kbId = UUID.randomUUID();
            KnowledgeBase kb = KnowledgeBase.builder()
                    .title("Статья")
                    .content("Содержание")
                    .isPublished(true)
                    .views(5)
                    .build();
            kb.setId(kbId);
            kb.setCreatedAt(Instant.now());

            when(kbRepository.findById(kbId)).thenReturn(Optional.of(kb));
            when(kbRepository.save(any(KnowledgeBase.class))).thenAnswer(inv -> inv.getArgument(0));

            KnowledgeBaseResponse response = kbService.getArticle(kbId);

            assertThat(response.views()).isEqualTo(6);
        }

        @Test
        @DisplayName("Should throw when article not found")
        void getArticle_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(kbRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> kbService.getArticle(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Статья не найдена");
        }
    }

    @Nested
    @DisplayName("FAQ")
    class FaqTests {

        @Test
        @DisplayName("Should create FAQ entry")
        void createFaq_Success() {
            CreateFaqRequest request = new CreateFaqRequest(
                    "Как сбросить пароль?",
                    "Перейдите на страницу восстановления пароля...",
                    UUID.randomUUID(), 1);

            when(faqRepository.save(any(Faq.class))).thenAnswer(invocation -> {
                Faq f = invocation.getArgument(0);
                f.setId(UUID.randomUUID());
                f.setCreatedAt(Instant.now());
                return f;
            });

            FaqResponse response = kbService.createFaq(request);

            assertThat(response.question()).isEqualTo("Как сбросить пароль?");
            assertThat(response.sortOrder()).isEqualTo(1);
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("Faq"), any(UUID.class));
        }

        @Test
        @DisplayName("Should list active FAQs sorted by order")
        void listActiveFaqs_Success() {
            Faq faq1 = Faq.builder()
                    .question("Вопрос 1").answer("Ответ 1")
                    .sortOrder(1).isActive(true).build();
            faq1.setId(UUID.randomUUID());
            faq1.setCreatedAt(Instant.now());

            Faq faq2 = Faq.builder()
                    .question("Вопрос 2").answer("Ответ 2")
                    .sortOrder(2).isActive(true).build();
            faq2.setId(UUID.randomUUID());
            faq2.setCreatedAt(Instant.now());

            when(faqRepository.findByIsActiveTrueAndDeletedFalseOrderBySortOrderAsc())
                    .thenReturn(List.of(faq1, faq2));

            List<FaqResponse> result = kbService.listActiveFaqs();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).question()).isEqualTo("Вопрос 1");
            assertThat(result.get(1).sortOrder()).isEqualTo(2);
        }
    }
}
