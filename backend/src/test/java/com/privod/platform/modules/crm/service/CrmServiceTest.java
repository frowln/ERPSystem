package com.privod.platform.modules.crm.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.crm.domain.CrmActivity;
import com.privod.platform.modules.crm.domain.CrmActivityType;
import com.privod.platform.modules.crm.domain.CrmLead;
import com.privod.platform.modules.crm.domain.CrmStage;
import com.privod.platform.modules.crm.domain.LeadPriority;
import com.privod.platform.modules.crm.domain.LeadStatus;
import com.privod.platform.modules.crm.repository.CrmActivityRepository;
import com.privod.platform.modules.crm.repository.CrmLeadRepository;
import com.privod.platform.modules.crm.repository.CrmStageRepository;
import com.privod.platform.modules.crm.repository.CrmTeamRepository;
import com.privod.platform.modules.crm.web.dto.ConvertToProjectRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmActivityRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmLeadRequest;
import com.privod.platform.modules.crm.web.dto.CrmActivityResponse;
import com.privod.platform.modules.crm.web.dto.CrmLeadResponse;
import com.privod.platform.modules.crm.web.dto.CrmPipelineResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
class CrmServiceTest {

    @Mock
    private CrmLeadRepository leadRepository;

    @Mock
    private CrmStageRepository stageRepository;

    @Mock
    private CrmTeamRepository teamRepository;

    @Mock
    private CrmActivityRepository activityRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CrmService crmService;

    private UUID leadId;
    private UUID stageId;
    private UUID assignedToId;
    private CrmLead testLead;

    @BeforeEach
    void setUp() {
        leadId = UUID.randomUUID();
        stageId = UUID.randomUUID();
        assignedToId = UUID.randomUUID();

        testLead = CrmLead.builder()
                .name("Строительство ЖК Солнечный")
                .partnerName("ООО СтройИнвест")
                .email("info@stroyinvest.ru")
                .phone("+7-495-123-4567")
                .companyName("ООО СтройИнвест")
                .source("website")
                .stageId(stageId)
                .assignedToId(assignedToId)
                .expectedRevenue(new BigDecimal("50000000.00"))
                .probability(30)
                .priority(LeadPriority.HIGH)
                .status(LeadStatus.QUALIFIED)
                .build();
        testLead.setId(leadId);
        testLead.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Lead")
    class CreateLeadTests {

        @Test
        @DisplayName("Should create lead with NEW status and defaults")
        void shouldCreateLead_whenValidInput() {
            CreateCrmLeadRequest request = new CreateCrmLeadRequest(
                    "Новый лид", "Партнёр", "test@mail.ru", "+79991234567",
                    "ООО Тест", "referral", "direct",
                    stageId, assignedToId, new BigDecimal("10000000.00"),
                    null, null, "Описание лида", null);

            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> {
                CrmLead l = inv.getArgument(0);
                l.setId(UUID.randomUUID());
                l.setCreatedAt(Instant.now());
                return l;
            });

            CrmLeadResponse response = crmService.createLead(request);

            assertThat(response.status()).isEqualTo(LeadStatus.NEW);
            assertThat(response.probability()).isZero();
            assertThat(response.priority()).isEqualTo(LeadPriority.NORMAL);
            assertThat(response.name()).isEqualTo("Новый лид");
            verify(auditService).logCreate(eq("CrmLead"), any(UUID.class));
        }

        @Test
        @DisplayName("Should preserve explicit probability and priority")
        void shouldPreserveExplicitValues_whenProvided() {
            CreateCrmLeadRequest request = new CreateCrmLeadRequest(
                    "Лид с параметрами", null, null, null,
                    "Компания", null, null, null, null,
                    null, 75, LeadPriority.HIGH, null, null);

            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> {
                CrmLead l = inv.getArgument(0);
                l.setId(UUID.randomUUID());
                l.setCreatedAt(Instant.now());
                return l;
            });

            CrmLeadResponse response = crmService.createLead(request);

            assertThat(response.probability()).isEqualTo(75);
            assertThat(response.priority()).isEqualTo(LeadPriority.HIGH);
        }
    }

    @Nested
    @DisplayName("Move Lead To Stage")
    class MoveToStageTests {

        @Test
        @DisplayName("Should move lead to new stage and update probability")
        void shouldMoveToStage_whenStageExists() {
            UUID newStageId = UUID.randomUUID();
            CrmStage stage = CrmStage.builder()
                    .name("Предложение")
                    .sequence(3)
                    .probability(60)
                    .closed(false)
                    .won(false)
                    .build();
            stage.setId(newStageId);

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(stageRepository.findById(newStageId)).thenReturn(Optional.of(stage));
            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> inv.getArgument(0));

            CrmLeadResponse response = crmService.moveToStage(leadId, newStageId);

            assertThat(response.stageId()).isEqualTo(newStageId);
            assertThat(response.probability()).isEqualTo(60);
            assertThat(response.status()).isEqualTo(LeadStatus.QUALIFIED);
        }

        @Test
        @DisplayName("Should mark as WON when moving to winning stage")
        void shouldMarkAsWon_whenMovingToWonStage() {
            UUID wonStageId = UUID.randomUUID();
            CrmStage wonStage = CrmStage.builder()
                    .name("Выигран")
                    .sequence(5)
                    .probability(100)
                    .closed(true)
                    .won(true)
                    .build();
            wonStage.setId(wonStageId);

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(stageRepository.findById(wonStageId)).thenReturn(Optional.of(wonStage));
            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> inv.getArgument(0));

            CrmLeadResponse response = crmService.moveToStage(leadId, wonStageId);

            assertThat(response.status()).isEqualTo(LeadStatus.WON);
            assertThat(response.wonDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should throw when stage not found")
        void shouldThrowException_whenStageNotFound() {
            UUID nonExistentStageId = UUID.randomUUID();

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(stageRepository.findById(nonExistentStageId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> crmService.moveToStage(leadId, nonExistentStageId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Этап CRM не найден");
        }
    }

    @Nested
    @DisplayName("Mark As Won / Lost")
    class WonLostTests {

        @Test
        @DisplayName("Should mark open lead as won")
        void shouldMarkAsWon_whenLeadIsOpen() {
            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> inv.getArgument(0));

            CrmLeadResponse response = crmService.markAsWon(leadId);

            assertThat(response.status()).isEqualTo(LeadStatus.WON);
            assertThat(response.probability()).isEqualTo(100);
            assertThat(response.wonDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("CrmLead", leadId, "QUALIFIED", "WON");
        }

        @Test
        @DisplayName("Should throw when marking already closed lead as won")
        void shouldThrowException_whenLeadAlreadyClosed() {
            testLead.setStatus(LeadStatus.LOST);
            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));

            assertThatThrownBy(() -> crmService.markAsWon(leadId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Лид уже закрыт");
        }

        @Test
        @DisplayName("Should mark open lead as lost with reason")
        void shouldMarkAsLost_whenLeadIsOpen() {
            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> inv.getArgument(0));

            CrmLeadResponse response = crmService.markAsLost(leadId, "Ушёл к конкуренту");

            assertThat(response.status()).isEqualTo(LeadStatus.LOST);
            assertThat(response.probability()).isZero();
            assertThat(response.lostReason()).isEqualTo("Ушёл к конкуренту");
            verify(auditService).logStatusChange("CrmLead", leadId, "QUALIFIED", "LOST");
        }

        @Test
        @DisplayName("Should throw when marking won lead as lost")
        void shouldThrowException_whenMarkingWonLeadAsLost() {
            testLead.setStatus(LeadStatus.WON);
            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));

            assertThatThrownBy(() -> crmService.markAsLost(leadId, "reason"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Лид уже закрыт");
        }
    }

    @Nested
    @DisplayName("Convert To Project")
    class ConvertToProjectTests {

        @Test
        @DisplayName("Should convert won lead to project")
        void shouldConvertToProject_whenLeadIsWon() {
            testLead.setStatus(LeadStatus.WON);
            testLead.setWonDate(LocalDate.now());
            UUID projectId = UUID.randomUUID();

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(leadRepository.save(any(CrmLead.class))).thenAnswer(inv -> inv.getArgument(0));

            CrmLeadResponse response = crmService.convertToProject(leadId, new ConvertToProjectRequest(projectId));

            assertThat(response.projectId()).isEqualTo(projectId);
            verify(auditService).logUpdate("CrmLead", leadId, "projectId", null, projectId.toString());
        }

        @Test
        @DisplayName("Should throw when converting non-won lead")
        void shouldThrowException_whenLeadNotWon() {
            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));

            assertThatThrownBy(() -> crmService.convertToProject(leadId, new ConvertToProjectRequest(UUID.randomUUID())))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Конвертировать в проект можно только выигранный лид");
        }

        @Test
        @DisplayName("Should throw when lead already linked to project")
        void shouldThrowException_whenAlreadyLinked() {
            testLead.setStatus(LeadStatus.WON);
            testLead.setProjectId(UUID.randomUUID());

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));

            assertThatThrownBy(() -> crmService.convertToProject(leadId, new ConvertToProjectRequest(UUID.randomUUID())))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Лид уже связан с проектом");
        }
    }

    @Nested
    @DisplayName("Pipeline Stats")
    class PipelineStatsTests {

        @Test
        @DisplayName("Should compute pipeline stats with correct counts and revenue")
        void shouldReturnPipelineStats_whenDataPresent() {
            List<Object[]> statusData = List.of(
                    new Object[]{LeadStatus.NEW, 10L},
                    new Object[]{LeadStatus.QUALIFIED, 5L},
                    new Object[]{LeadStatus.WON, 3L},
                    new Object[]{LeadStatus.LOST, 2L}
            );
            List<Object[]> stageData = List.of(
                    new Object[]{stageId, 15L}
            );

            when(leadRepository.countByStatus()).thenReturn(statusData);
            when(leadRepository.countByStage()).thenReturn(stageData);
            when(leadRepository.sumPipelineRevenue()).thenReturn(new BigDecimal("100000000.00"));
            when(leadRepository.sumWeightedPipelineRevenue()).thenReturn(new BigDecimal("40000000.00"));
            when(leadRepository.sumWonRevenue()).thenReturn(new BigDecimal("30000000.00"));

            CrmPipelineResponse response = crmService.getPipelineStats();

            assertThat(response.totalLeads()).isEqualTo(20);
            assertThat(response.openLeads()).isEqualTo(15);
            assertThat(response.wonLeads()).isEqualTo(3);
            assertThat(response.lostLeads()).isEqualTo(2);
            assertThat(response.pipelineRevenue()).isEqualByComparingTo(new BigDecimal("100000000.00"));
            assertThat(response.wonRevenue()).isEqualByComparingTo(new BigDecimal("30000000.00"));
        }
    }

    @Nested
    @DisplayName("Schedule Activity")
    class ActivityTests {

        @Test
        @DisplayName("Should create activity for existing lead")
        void shouldCreateActivity_whenLeadExists() {
            UUID userId = UUID.randomUUID();
            CreateCrmActivityRequest request = new CreateCrmActivityRequest(
                    leadId, CrmActivityType.CALL, userId,
                    "Звонок клиенту", "Обсудить условия", LocalDateTime.now().plusDays(1));

            when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
            when(activityRepository.save(any(CrmActivity.class))).thenAnswer(inv -> {
                CrmActivity a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            CrmActivityResponse response = crmService.createActivity(request);

            assertThat(response.activityType()).isEqualTo(CrmActivityType.CALL);
            assertThat(response.summary()).isEqualTo("Звонок клиенту");
            assertThat(response.completed()).isFalse();
            verify(auditService).logCreate(eq("CrmActivity"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when creating activity for non-existent lead")
        void shouldThrowException_whenLeadNotFound() {
            UUID nonExistentLeadId = UUID.randomUUID();
            CreateCrmActivityRequest request = new CreateCrmActivityRequest(
                    nonExistentLeadId, CrmActivityType.MEETING, UUID.randomUUID(),
                    "Встреча", null, null);

            when(leadRepository.findById(nonExistentLeadId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> crmService.createActivity(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Лид CRM не найден");
        }
    }
}
