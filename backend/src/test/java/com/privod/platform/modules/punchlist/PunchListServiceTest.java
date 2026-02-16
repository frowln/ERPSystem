package com.privod.platform.modules.punchlist;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.punchlist.domain.PunchItem;
import com.privod.platform.modules.punchlist.domain.PunchItemComment;
import com.privod.platform.modules.punchlist.domain.PunchItemPriority;
import com.privod.platform.modules.punchlist.domain.PunchItemStatus;
import com.privod.platform.modules.punchlist.domain.PunchList;
import com.privod.platform.modules.punchlist.domain.PunchListStatus;
import com.privod.platform.modules.punchlist.repository.PunchItemCommentRepository;
import com.privod.platform.modules.punchlist.repository.PunchItemRepository;
import com.privod.platform.modules.punchlist.repository.PunchListRepository;
import com.privod.platform.modules.punchlist.service.PunchListService;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemCommentRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchItemRequest;
import com.privod.platform.modules.punchlist.web.dto.CreatePunchListRequest;
import com.privod.platform.modules.punchlist.web.dto.PunchItemCommentResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchItemResponse;
import com.privod.platform.modules.punchlist.web.dto.PunchListResponse;
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
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PunchListServiceTest {

    @Mock
    private PunchListRepository punchListRepository;

    @Mock
    private PunchItemRepository punchItemRepository;

    @Mock
    private PunchItemCommentRepository commentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PunchListService punchListService;

    private UUID punchListId;
    private UUID projectId;
    private PunchList testPunchList;

    @BeforeEach
    void setUp() {
        punchListId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPunchList = PunchList.builder()
                .code("PL-00001")
                .projectId(projectId)
                .name("Замечания по корпусу А")
                .status(PunchListStatus.OPEN)
                .completionPercent(0)
                .areaOrZone("Корпус А")
                .build();
        testPunchList.setId(punchListId);
        testPunchList.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Punch List")
    class CreatePunchListTests {

        @Test
        @DisplayName("Should create punch list with OPEN status and generated code")
        void createPunchList_Success() {
            CreatePunchListRequest request = new CreatePunchListRequest(
                    projectId, "Замечания по корпусу Б",
                    UUID.randomUUID(), LocalDate.of(2025, 6, 1), "Корпус Б");

            when(punchListRepository.getNextNumberSequence()).thenReturn(2L);
            when(punchListRepository.save(any(PunchList.class))).thenAnswer(invocation -> {
                PunchList pl = invocation.getArgument(0);
                pl.setId(UUID.randomUUID());
                pl.setCreatedAt(Instant.now());
                return pl;
            });

            PunchListResponse response = punchListService.createPunchList(request);

            assertThat(response.status()).isEqualTo(PunchListStatus.OPEN);
            assertThat(response.code()).isEqualTo("PL-00002");
            assertThat(response.completionPercent()).isEqualTo(0);
            verify(auditService).logCreate(eq("PunchList"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Complete Punch List")
    class CompletePunchListTests {

        @Test
        @DisplayName("Should complete punch list")
        void completePunchList_Success() {
            when(punchListRepository.findById(punchListId)).thenReturn(Optional.of(testPunchList));
            when(punchListRepository.save(any(PunchList.class))).thenAnswer(inv -> inv.getArgument(0));

            PunchListResponse response = punchListService.completePunchList(punchListId);

            assertThat(response.status()).isEqualTo(PunchListStatus.COMPLETED);
            assertThat(response.completionPercent()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should reject completing already completed list")
        void completePunchList_AlreadyCompleted() {
            testPunchList.setStatus(PunchListStatus.COMPLETED);
            when(punchListRepository.findById(punchListId)).thenReturn(Optional.of(testPunchList));

            assertThatThrownBy(() -> punchListService.completePunchList(punchListId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Список замечаний уже завершён");
        }
    }

    @Nested
    @DisplayName("Punch Items Workflow")
    class PunchItemWorkflowTests {

        private UUID itemId;
        private PunchItem testItem;

        @BeforeEach
        void setUpItem() {
            itemId = UUID.randomUUID();
            testItem = PunchItem.builder()
                    .punchListId(punchListId)
                    .number(1)
                    .description("Трещина в стене")
                    .priority(PunchItemPriority.HIGH)
                    .status(PunchItemStatus.OPEN)
                    .assignedToId(UUID.randomUUID())
                    .build();
            testItem.setId(itemId);
            testItem.setCreatedAt(Instant.now());
        }

        @Test
        @DisplayName("Should add item to punch list")
        void addItem_Success() {
            when(punchListRepository.findById(punchListId)).thenReturn(Optional.of(testPunchList));
            when(punchItemRepository.getMaxNumberForList(punchListId)).thenReturn(0);
            when(punchItemRepository.save(any(PunchItem.class))).thenAnswer(invocation -> {
                PunchItem item = invocation.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });
            when(punchItemRepository.countByPunchListId(punchListId)).thenReturn(1L);
            when(punchItemRepository.countCompletedByPunchListId(punchListId)).thenReturn(0L);

            CreatePunchItemRequest request = new CreatePunchItemRequest(
                    "Трещина в стене", "Этаж 3, кв. 15",
                    "structural", PunchItemPriority.HIGH,
                    UUID.randomUUID(), null, LocalDate.of(2025, 5, 1));

            PunchItemResponse response = punchListService.addItem(punchListId, request);

            assertThat(response.number()).isEqualTo(1);
            assertThat(response.status()).isEqualTo(PunchItemStatus.OPEN);
            assertThat(response.priority()).isEqualTo(PunchItemPriority.HIGH);
        }

        @Test
        @DisplayName("Should fix an open item")
        void fixItem_Success() {
            when(punchItemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
            when(punchItemRepository.save(any(PunchItem.class))).thenAnswer(inv -> inv.getArgument(0));
            when(punchListRepository.findById(punchListId)).thenReturn(Optional.of(testPunchList));
            when(punchItemRepository.countByPunchListId(punchListId)).thenReturn(1L);
            when(punchItemRepository.countCompletedByPunchListId(punchListId)).thenReturn(0L);

            PunchItemResponse response = punchListService.fixItem(itemId);

            assertThat(response.status()).isEqualTo(PunchItemStatus.FIXED);
            assertThat(response.fixedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should verify a fixed item")
        void verifyItem_Success() {
            testItem.setStatus(PunchItemStatus.FIXED);
            when(punchItemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
            when(punchItemRepository.save(any(PunchItem.class))).thenAnswer(inv -> inv.getArgument(0));
            when(punchListRepository.findById(punchListId)).thenReturn(Optional.of(testPunchList));
            when(punchItemRepository.countByPunchListId(punchListId)).thenReturn(1L);
            when(punchItemRepository.countCompletedByPunchListId(punchListId)).thenReturn(1L);

            UUID verifierId = UUID.randomUUID();
            PunchItemResponse response = punchListService.verifyItem(itemId, verifierId);

            assertThat(response.status()).isEqualTo(PunchItemStatus.VERIFIED);
            assertThat(response.verifiedById()).isEqualTo(verifierId);
        }

        @Test
        @DisplayName("Should reject verifying non-fixed item")
        void verifyItem_InvalidStatus() {
            when(punchItemRepository.findById(itemId)).thenReturn(Optional.of(testItem));

            assertThatThrownBy(() -> punchListService.verifyItem(itemId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Проверить можно только исправленное замечание");
        }
    }

    @Nested
    @DisplayName("Comments")
    class CommentTests {

        @Test
        @DisplayName("Should add comment to punch item")
        void addComment_Success() {
            UUID itemId = UUID.randomUUID();
            PunchItem item = PunchItem.builder()
                    .punchListId(punchListId)
                    .number(1)
                    .description("test")
                    .build();
            item.setId(itemId);

            when(punchItemRepository.findById(itemId)).thenReturn(Optional.of(item));
            when(commentRepository.save(any(PunchItemComment.class))).thenAnswer(invocation -> {
                PunchItemComment c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreatePunchItemCommentRequest request = new CreatePunchItemCommentRequest(
                    UUID.randomUUID(), "Нужно проверить повторно", null);

            PunchItemCommentResponse response = punchListService.addComment(itemId, request);

            assertThat(response.content()).isEqualTo("Нужно проверить повторно");
            verify(auditService).logCreate(eq("PunchItemComment"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Not Found")
    class NotFoundTests {

        @Test
        @DisplayName("Should throw when punch list not found")
        void getPunchList_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(punchListRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> punchListService.getPunchList(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Список замечаний не найден");
        }
    }
}
