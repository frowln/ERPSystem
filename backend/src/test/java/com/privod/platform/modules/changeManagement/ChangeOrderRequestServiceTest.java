package com.privod.platform.modules.changeManagement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRequestRepository;
import com.privod.platform.modules.changeManagement.service.ChangeEventService;
import com.privod.platform.modules.changeManagement.service.ChangeOrderRequestService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequestRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequestRequest;
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
class ChangeOrderRequestServiceTest {

    @Mock
    private ChangeOrderRequestRepository changeOrderRequestRepository;

    @Mock
    private ChangeEventService changeEventService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ChangeOrderRequestService changeOrderRequestService;

    private UUID corId;
    private UUID eventId;
    private UUID projectId;
    private ChangeEvent testEvent;
    private ChangeOrderRequest testCor;

    @BeforeEach
    void setUp() {
        corId = UUID.randomUUID();
        eventId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testEvent = ChangeEvent.builder()
                .projectId(projectId)
                .number("CE-00001")
                .title("Событие изменения")
                .source(ChangeEventSource.FIELD_CONDITION)
                .status(ChangeEventStatus.APPROVED_FOR_PRICING)
                .identifiedById(UUID.randomUUID())
                .identifiedDate(LocalDate.of(2025, 3, 15))
                .build();
        testEvent.setId(eventId);
        testEvent.setCreatedAt(Instant.now());

        testCor = ChangeOrderRequest.builder()
                .changeEventId(eventId)
                .projectId(projectId)
                .number("COR-00001")
                .title("Запрос на расценку подземных работ")
                .description("Требуется расценка для перекладки коммуникаций")
                .status(ChangeOrderRequestStatus.DRAFT)
                .requestedById(UUID.randomUUID())
                .requestedDate(LocalDate.of(2025, 3, 20))
                .proposedCost(new BigDecimal("450000.00"))
                .proposedScheduleChange(10)
                .justification("Обоснование необходимости работ")
                .build();
        testCor.setId(corId);
        testCor.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Change Order Request")
    class CreateTests {

        @Test
        @DisplayName("Should create COR when event is APPROVED_FOR_PRICING")
        void createChangeOrderRequest_EventApprovedForPricing() {
            when(changeEventService.getChangeEventOrThrow(eventId)).thenReturn(testEvent);
            when(changeOrderRequestRepository.getNextNumberSequence()).thenReturn(1L);
            when(changeOrderRequestRepository.save(any(ChangeOrderRequest.class))).thenAnswer(inv -> {
                ChangeOrderRequest r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            CreateChangeOrderRequestRequest request = new CreateChangeOrderRequestRequest(
                    eventId, projectId, "Запрос на расценку",
                    "Описание", UUID.randomUUID(), LocalDate.now(),
                    new BigDecimal("500000.00"), 7,
                    "Обоснование", null);

            ChangeOrderRequestResponse response = changeOrderRequestService.createChangeOrderRequest(request);

            assertThat(response.status()).isEqualTo(ChangeOrderRequestStatus.DRAFT);
            assertThat(response.number()).isEqualTo("COR-00001");
            verify(auditService).logCreate(eq("ChangeOrderRequest"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject COR creation when event is IDENTIFIED (not approved for pricing)")
        void createChangeOrderRequest_EventNotApprovedForPricing() {
            testEvent.setStatus(ChangeEventStatus.IDENTIFIED);
            when(changeEventService.getChangeEventOrThrow(eventId)).thenReturn(testEvent);

            CreateChangeOrderRequestRequest request = new CreateChangeOrderRequestRequest(
                    eventId, projectId, "Запрос на расценку",
                    null, null, null,
                    null, null, null, null);

            assertThatThrownBy(() -> changeOrderRequestService.createChangeOrderRequest(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Создать запрос на изменение можно только");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition DRAFT -> SUBMITTED")
        void changeStatus_DraftToSubmitted() {
            when(changeOrderRequestRepository.findById(corId)).thenReturn(Optional.of(testCor));
            when(changeOrderRequestRepository.save(any(ChangeOrderRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderRequestStatusRequest request = new ChangeOrderRequestStatusRequest(
                    ChangeOrderRequestStatus.SUBMITTED, null, null);
            ChangeOrderRequestResponse response = changeOrderRequestService.changeStatus(corId, request);

            assertThat(response.status()).isEqualTo(ChangeOrderRequestStatus.SUBMITTED);
            verify(auditService).logStatusChange("ChangeOrderRequest", corId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void changeStatus_InvalidTransition() {
            when(changeOrderRequestRepository.findById(corId)).thenReturn(Optional.of(testCor));

            ChangeOrderRequestStatusRequest request = new ChangeOrderRequestStatusRequest(
                    ChangeOrderRequestStatus.APPROVED, null, null);

            assertThatThrownBy(() -> changeOrderRequestService.changeStatus(corId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести запрос на изменение");
        }
    }

    @Test
    @DisplayName("Should update COR in DRAFT status")
    void updateChangeOrderRequest_DraftStatus() {
        when(changeOrderRequestRepository.findById(corId)).thenReturn(Optional.of(testCor));
        when(changeOrderRequestRepository.save(any(ChangeOrderRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateChangeOrderRequestRequest request = new UpdateChangeOrderRequestRequest(
                "Обновлённый запрос", null,
                new BigDecimal("600000.00"), 14, null, null);

        ChangeOrderRequestResponse response = changeOrderRequestService.updateChangeOrderRequest(corId, request);

        assertThat(response.title()).isEqualTo("Обновлённый запрос");
        assertThat(response.proposedCost()).isEqualByComparingTo(new BigDecimal("600000.00"));
    }

    @Test
    @DisplayName("Should reject update when COR is SUBMITTED")
    void updateChangeOrderRequest_SubmittedStatus() {
        testCor.setStatus(ChangeOrderRequestStatus.SUBMITTED);
        when(changeOrderRequestRepository.findById(corId)).thenReturn(Optional.of(testCor));

        UpdateChangeOrderRequestRequest request = new UpdateChangeOrderRequestRequest(
                "Попытка обновления", null, null, null, null, null);

        assertThatThrownBy(() -> changeOrderRequestService.updateChangeOrderRequest(corId, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Редактирование запроса возможно только");
    }
}
