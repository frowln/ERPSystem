package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.repository.ChangeEventRepository;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeEventStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventFromRfiRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeEventRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeEventRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChangeEventServiceTest {

    @Mock
    private ChangeEventRepository changeEventRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ChangeEventService changeEventService;

    private UUID eventId;
    private UUID projectId;
    private UUID identifiedById;
    private ChangeEvent testEvent;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        identifiedById = UUID.randomUUID();

        testEvent = ChangeEvent.builder()
                .projectId(projectId)
                .number("CE-00001")
                .title("Обнаружение скрытых коммуникаций")
                .description("При земляных работах обнаружены незадокументированные коммуникации")
                .source(ChangeEventSource.FIELD_CONDITION)
                .status(ChangeEventStatus.IDENTIFIED)
                .identifiedById(identifiedById)
                .identifiedDate(LocalDate.of(2025, 3, 15))
                .estimatedCostImpact(new BigDecimal("500000.00"))
                .estimatedScheduleImpact(14)
                .build();
        testEvent.setId(eventId);
        testEvent.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Change Event")
    class CreateChangeEventTests {

        @Test
        @DisplayName("Should create change event with IDENTIFIED status")
        void shouldCreateChangeEvent_whenValidInput() {
            CreateChangeEventRequest request = new CreateChangeEventRequest(
                    projectId, "Новое событие", "Описание",
                    ChangeEventSource.DESIGN_CHANGE, identifiedById,
                    LocalDate.of(2025, 3, 20),
                    new BigDecimal("1000000.00"), 7,
                    null, null, null, null);

            when(changeEventRepository.getNextNumberSequence()).thenReturn(1L);
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> {
                ChangeEvent e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            ChangeEventResponse response = changeEventService.createChangeEvent(request);

            assertThat(response.status()).isEqualTo(ChangeEventStatus.IDENTIFIED);
            assertThat(response.source()).isEqualTo(ChangeEventSource.DESIGN_CHANGE);
            assertThat(response.number()).isEqualTo("CE-00001");
            verify(auditService).logCreate(eq("ChangeEvent"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create change event from RFI with source=RFI and linked RFI ID")
        void shouldCreateFromRfi_whenRfiProvided() {
            UUID rfiId = UUID.randomUUID();

            CreateChangeEventFromRfiRequest request = new CreateChangeEventFromRfiRequest(
                    rfiId, projectId, "Изменение по RFI-001",
                    "Описание изменения", identifiedById,
                    LocalDate.of(2025, 4, 1),
                    new BigDecimal("250000.00"), 5, null);

            when(changeEventRepository.getNextNumberSequence()).thenReturn(2L);
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> {
                ChangeEvent e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            ChangeEventResponse response = changeEventService.createFromRfi(request);

            assertThat(response.source()).isEqualTo(ChangeEventSource.RFI);
            assertThat(response.linkedRfiId()).isEqualTo(rfiId);
            assertThat(response.title()).isEqualTo("Изменение по RFI-001");
            verify(auditService).logCreate(eq("ChangeEvent"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use default title when creating from RFI with null title")
        void shouldUseDefaultTitle_whenRfiTitleIsNull() {
            UUID rfiId = UUID.randomUUID();

            CreateChangeEventFromRfiRequest request = new CreateChangeEventFromRfiRequest(
                    rfiId, projectId, null,
                    "Описание", identifiedById,
                    LocalDate.of(2025, 4, 1),
                    null, null, null);

            when(changeEventRepository.getNextNumberSequence()).thenReturn(3L);
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> {
                ChangeEvent e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            ChangeEventResponse response = changeEventService.createFromRfi(request);

            assertThat(response.title()).isEqualTo("Событие изменения по RFI");
        }

        @Test
        @DisplayName("Should generate sequential number CE-00005 for 5th event")
        void shouldGenerateSequentialNumber_whenCreating() {
            CreateChangeEventRequest request = new CreateChangeEventRequest(
                    projectId, "Пятое событие", null,
                    ChangeEventSource.CLIENT_REQUEST, identifiedById,
                    LocalDate.now(), null, null, null, null, null, null);

            when(changeEventRepository.getNextNumberSequence()).thenReturn(5L);
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> {
                ChangeEvent e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            ChangeEventResponse response = changeEventService.createChangeEvent(request);

            assertThat(response.number()).isEqualTo("CE-00005");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should allow valid transition IDENTIFIED -> UNDER_REVIEW")
        void shouldChangeStatus_whenValidTransition() {
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeEventStatusRequest request = new ChangeEventStatusRequest(ChangeEventStatus.UNDER_REVIEW);
            ChangeEventResponse response = changeEventService.changeStatus(eventId, request);

            assertThat(response.status()).isEqualTo(ChangeEventStatus.UNDER_REVIEW);
            verify(auditService).logStatusChange("ChangeEvent", eventId, "IDENTIFIED", "UNDER_REVIEW");
        }

        @Test
        @DisplayName("Should reject invalid transition IDENTIFIED -> APPROVED")
        void shouldThrowException_whenInvalidTransition() {
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            ChangeEventStatusRequest request = new ChangeEventStatusRequest(ChangeEventStatus.APPROVED);

            assertThatThrownBy(() -> changeEventService.changeStatus(eventId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести событие изменения");
        }

        @Test
        @DisplayName("Should reject transition from terminal VOID status")
        void shouldThrowException_whenTransitionFromVoidStatus() {
            testEvent.setStatus(ChangeEventStatus.VOID);
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            ChangeEventStatusRequest request = new ChangeEventStatusRequest(ChangeEventStatus.IDENTIFIED);

            assertThatThrownBy(() -> changeEventService.changeStatus(eventId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести событие изменения");
        }
    }

    @Nested
    @DisplayName("Update Change Event")
    class UpdateChangeEventTests {

        @Test
        @DisplayName("Should update change event in IDENTIFIED status")
        void shouldUpdateChangeEvent_whenIdentifiedStatus() {
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateChangeEventRequest request = new UpdateChangeEventRequest(
                    "Обновлённое название", null, null,
                    new BigDecimal("750000.00"), null,
                    null, null, null, null, null, null);

            ChangeEventResponse response = changeEventService.updateChangeEvent(eventId, request);

            assertThat(response.title()).isEqualTo("Обновлённое название");
            assertThat(response.estimatedCostImpact()).isEqualByComparingTo(new BigDecimal("750000.00"));
        }

        @Test
        @DisplayName("Should reject update when event is APPROVED")
        void shouldThrowException_whenUpdateApprovedEvent() {
            testEvent.setStatus(ChangeEventStatus.APPROVED);
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            UpdateChangeEventRequest request = new UpdateChangeEventRequest(
                    "Попытка обновления", null, null,
                    null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> changeEventService.updateChangeEvent(eventId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование события изменения невозможно");
        }

        @Test
        @DisplayName("Should reject update when event is REJECTED")
        void shouldThrowException_whenUpdateRejectedEvent() {
            testEvent.setStatus(ChangeEventStatus.REJECTED);
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            UpdateChangeEventRequest request = new UpdateChangeEventRequest(
                    "Попытка", null, null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> changeEventService.updateChangeEvent(eventId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование события изменения невозможно");
        }
    }

    @Nested
    @DisplayName("Get and Delete")
    class GetAndDeleteTests {

        @Test
        @DisplayName("Should find change event by ID")
        void shouldReturnChangeEvent_whenExists() {
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            ChangeEventResponse response = changeEventService.getChangeEvent(eventId);

            assertThat(response).isNotNull();
            assertThat(response.number()).isEqualTo("CE-00001");
            assertThat(response.title()).isEqualTo("Обнаружение скрытых коммуникаций");
        }

        @Test
        @DisplayName("Should throw when change event not found")
        void shouldThrowException_whenChangeEventNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(changeEventRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> changeEventService.getChangeEvent(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Событие изменения не найдено");
        }

        @Test
        @DisplayName("Should soft delete change event")
        void shouldSoftDelete_whenValidId() {
            when(changeEventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(changeEventRepository.save(any(ChangeEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            changeEventService.deleteChangeEvent(eventId);

            assertThat(testEvent.isDeleted()).isTrue();
            verify(auditService).logDelete("ChangeEvent", eventId);
        }
    }
}
