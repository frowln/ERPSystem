package com.privod.platform.modules.support;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.support.domain.SupportTicket;
import com.privod.platform.modules.support.domain.TicketComment;
import com.privod.platform.modules.support.domain.TicketPriority;
import com.privod.platform.modules.support.domain.TicketStatus;
import com.privod.platform.modules.support.repository.SupportTicketRepository;
import com.privod.platform.modules.support.repository.TicketCommentRepository;
import com.privod.platform.modules.support.service.SupportTicketService;
import com.privod.platform.modules.support.web.dto.CreateSupportTicketRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCommentRequest;
import com.privod.platform.modules.support.web.dto.SupportTicketResponse;
import com.privod.platform.modules.support.web.dto.TicketCommentResponse;
import com.privod.platform.modules.support.web.dto.TicketDashboardResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock
    private SupportTicketRepository ticketRepository;

    @Mock
    private TicketCommentRepository commentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SupportTicketService ticketService;

    private UUID ticketId;
    private SupportTicket testTicket;

    @BeforeEach
    void setUp() {
        ticketId = UUID.randomUUID();

        testTicket = SupportTicket.builder()
                .code("TKT-00001")
                .subject("Не работает авторизация")
                .description("При попытке входа возникает ошибка 500")
                .category("technical")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .reporterId(UUID.randomUUID())
                .build();
        testTicket.setId(ticketId);
        testTicket.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Ticket")
    class CreateTicketTests {

        @Test
        @DisplayName("Should create ticket with OPEN status and generated code")
        void createTicket_Success() {
            CreateSupportTicketRequest request = new CreateSupportTicketRequest(
                    "Проблема с отчётами", "Не загружается страница отчётов",
                    "technical", TicketPriority.MEDIUM,
                    UUID.randomUUID(), null);

            when(ticketRepository.getNextNumberSequence()).thenReturn(1L);
            when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(invocation -> {
                SupportTicket t = invocation.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            SupportTicketResponse response = ticketService.createTicket(request);

            assertThat(response.status()).isEqualTo(TicketStatus.OPEN);
            assertThat(response.code()).isEqualTo("TKT-00001");
            assertThat(response.priority()).isEqualTo(TicketPriority.MEDIUM);
            verify(auditService).logCreate(eq("SupportTicket"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Ticket Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should assign ticket")
        void assignTicket_Success() {
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
            when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID assigneeId = UUID.randomUUID();
            SupportTicketResponse response = ticketService.assignTicket(ticketId, assigneeId);

            assertThat(response.status()).isEqualTo(TicketStatus.ASSIGNED);
            assertThat(response.assigneeId()).isEqualTo(assigneeId);
            verify(auditService).logStatusChange("SupportTicket", ticketId,
                    "OPEN", "ASSIGNED");
        }

        @Test
        @DisplayName("Should start progress on assigned ticket")
        void startProgress_FromAssigned() {
            testTicket.setStatus(TicketStatus.ASSIGNED);
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
            when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

            SupportTicketResponse response = ticketService.startProgress(ticketId);

            assertThat(response.status()).isEqualTo(TicketStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("Should reject starting progress from RESOLVED")
        void startProgress_InvalidFromResolved() {
            testTicket.setStatus(TicketStatus.RESOLVED);
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));

            assertThatThrownBy(() -> ticketService.startProgress(ticketId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Начать работу можно только из статуса");
        }

        @Test
        @DisplayName("Should resolve ticket and set resolvedAt")
        void resolveTicket_Success() {
            testTicket.setStatus(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
            when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

            SupportTicketResponse response = ticketService.resolveTicket(ticketId);

            assertThat(response.status()).isEqualTo(TicketStatus.RESOLVED);
            assertThat(response.resolvedAt()).isNotNull();
            verify(auditService).logStatusChange("SupportTicket", ticketId,
                    "IN_PROGRESS", "RESOLVED");
        }

        @Test
        @DisplayName("Should close resolved ticket")
        void closeTicket_Success() {
            testTicket.setStatus(TicketStatus.RESOLVED);
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
            when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

            SupportTicketResponse response = ticketService.closeTicket(ticketId);

            assertThat(response.status()).isEqualTo(TicketStatus.CLOSED);
        }

        @Test
        @DisplayName("Should reject closing non-resolved ticket")
        void closeTicket_NotResolved() {
            testTicket.setStatus(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));

            assertThatThrownBy(() -> ticketService.closeTicket(ticketId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Закрыть можно только решённую заявку");
        }
    }

    @Nested
    @DisplayName("Comments")
    class CommentTests {

        @Test
        @DisplayName("Should add comment to ticket")
        void addComment_Success() {
            when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
            when(commentRepository.save(any(TicketComment.class))).thenAnswer(invocation -> {
                TicketComment c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateTicketCommentRequest request = new CreateTicketCommentRequest(
                    UUID.randomUUID(), "Проблема воспроизведена", false, null);

            TicketCommentResponse response = ticketService.addComment(ticketId, request);

            assertThat(response.content()).isEqualTo("Проблема воспроизведена");
            assertThat(response.isInternal()).isFalse();
            verify(auditService).logCreate(eq("TicketComment"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Should return ticket dashboard statistics")
        void getDashboard_ReturnsStats() {
            when(ticketRepository.countTotal()).thenReturn(15L);
            when(ticketRepository.countOpen()).thenReturn(7L);
            when(ticketRepository.countByStatus())
                    .thenReturn(List.of(
                            new Object[]{TicketStatus.OPEN, 3L},
                            new Object[]{TicketStatus.IN_PROGRESS, 4L},
                            new Object[]{TicketStatus.RESOLVED, 8L}
                    ));
            when(ticketRepository.countByPriority())
                    .thenReturn(List.of(
                            new Object[]{TicketPriority.HIGH, 5L},
                            new Object[]{TicketPriority.MEDIUM, 10L}
                    ));

            TicketDashboardResponse response = ticketService.getDashboard();

            assertThat(response.totalTickets()).isEqualTo(15L);
            assertThat(response.openTickets()).isEqualTo(7L);
            assertThat(response.statusCounts()).containsEntry("IN_PROGRESS", 4L);
            assertThat(response.priorityCounts()).containsEntry("HIGH", 5L);
        }
    }

    @Nested
    @DisplayName("Not Found")
    class NotFoundTests {

        @Test
        @DisplayName("Should throw when ticket not found")
        void getTicket_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(ticketRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ticketService.getTicket(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Заявка не найдена");
        }
    }
}
