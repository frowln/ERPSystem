package com.privod.platform.modules.pmWorkflow;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pmWorkflow.domain.Rfi;
import com.privod.platform.modules.pmWorkflow.domain.RfiPriority;
import com.privod.platform.modules.pmWorkflow.domain.RfiResponse;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import com.privod.platform.modules.pmWorkflow.repository.RfiRepository;
import com.privod.platform.modules.pmWorkflow.repository.RfiResponseRepository;
import com.privod.platform.modules.pmWorkflow.service.RfiService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeRfiStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateRfiResponseRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.RfiResponseEntryDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateRfiRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RfiServiceTest {

    @Mock
    private RfiRepository rfiRepository;

    @Mock
    private RfiResponseRepository rfiResponseRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RfiService rfiService;

    private UUID rfiId;
    private UUID projectId;
    private Rfi testRfi;

    @BeforeEach
    void setUp() {
        rfiId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testRfi = Rfi.builder()
                .projectId(projectId)
                .number("RFI-00001")
                .subject("Уточнение по фундаменту")
                .question("Какой тип фундамента применяется?")
                .status(RfiStatus.DRAFT)
                .priority(RfiPriority.NORMAL)
                .costImpact(false)
                .scheduleImpact(false)
                .build();
        testRfi.setId(rfiId);
        testRfi.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create RFI")
    class CreateRfiTests {

        @Test
        @DisplayName("Should create RFI with DRAFT status and auto-generated number")
        void createRfi_Success() {
            CreateRfiRequest request = new CreateRfiRequest(
                    projectId, "Уточнение по фундаменту", "Какой тип фундамента применяется?",
                    RfiPriority.HIGH, null, null, null, false, false, null, null, null, null, null);

            when(rfiRepository.findMaxNumberByProject(eq(projectId), eq("RFI-"))).thenReturn(null);
            when(rfiRepository.save(any(Rfi.class))).thenAnswer(inv -> {
                Rfi rfi = inv.getArgument(0);
                rfi.setId(UUID.randomUUID());
                rfi.setCreatedAt(Instant.now());
                return rfi;
            });

            RfiResponseDto response = rfiService.createRfi(request);

            assertThat(response.status()).isEqualTo(RfiStatus.DRAFT);
            assertThat(response.number()).isEqualTo("RFI-00001");
            assertThat(response.subject()).isEqualTo("Уточнение по фундаменту");
            assertThat(response.priority()).isEqualTo(RfiPriority.HIGH);
            verify(auditService).logCreate(eq("Rfi"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition from DRAFT to OPEN")
        void changeStatus_DraftToOpen() {
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));
            when(rfiRepository.save(any(Rfi.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeRfiStatusRequest request = new ChangeRfiStatusRequest(RfiStatus.OPEN);
            RfiResponseDto response = rfiService.changeStatus(rfiId, request);

            assertThat(response.status()).isEqualTo(RfiStatus.OPEN);
            verify(auditService).logStatusChange("Rfi", rfiId, "DRAFT", "OPEN");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> CLOSED")
        void changeStatus_InvalidTransition_DraftToClosed() {
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));

            ChangeRfiStatusRequest request = new ChangeRfiStatusRequest(RfiStatus.CLOSED);

            assertThatThrownBy(() -> rfiService.changeStatus(rfiId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести RFI");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> ANSWERED")
        void changeStatus_InvalidTransition_DraftToAnswered() {
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));

            ChangeRfiStatusRequest request = new ChangeRfiStatusRequest(RfiStatus.ANSWERED);

            assertThatThrownBy(() -> rfiService.changeStatus(rfiId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести RFI");
        }

        @Test
        @DisplayName("Should set answeredDate when transitioning to ANSWERED")
        void changeStatus_SetsAnsweredDate() {
            testRfi.setStatus(RfiStatus.ASSIGNED);
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));
            when(rfiRepository.save(any(Rfi.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeRfiStatusRequest request = new ChangeRfiStatusRequest(RfiStatus.ANSWERED);
            RfiResponseDto response = rfiService.changeStatus(rfiId, request);

            assertThat(response.status()).isEqualTo(RfiStatus.ANSWERED);
            assertThat(response.answeredDate()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get and Delete RFI")
    class GetDeleteTests {

        @Test
        @DisplayName("Should return RFI by ID")
        void getRfi_Success() {
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));

            RfiResponseDto response = rfiService.getRfi(rfiId);

            assertThat(response.id()).isEqualTo(rfiId);
            assertThat(response.subject()).isEqualTo("Уточнение по фундаменту");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for missing RFI")
        void getRfi_NotFound() {
            UUID missingId = UUID.randomUUID();
            when(rfiRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rfiService.getRfi(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("RFI не найден");
        }

        @Test
        @DisplayName("Should soft-delete RFI")
        void deleteRfi_Success() {
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));
            when(rfiRepository.save(any(Rfi.class))).thenAnswer(inv -> inv.getArgument(0));

            rfiService.deleteRfi(rfiId);

            assertThat(testRfi.isDeleted()).isTrue();
            verify(auditService).logDelete("Rfi", rfiId);
        }
    }

    @Nested
    @DisplayName("RFI Responses")
    class RfiResponseTests {

        @Test
        @DisplayName("Should add response to RFI")
        void addResponse_Success() {
            UUID responderId = UUID.randomUUID();
            when(rfiRepository.findById(rfiId)).thenReturn(Optional.of(testRfi));
            when(rfiResponseRepository.save(any(RfiResponse.class))).thenAnswer(inv -> {
                RfiResponse r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            CreateRfiResponseRequest request = new CreateRfiResponseRequest(
                    rfiId, responderId, "Применяется ленточный фундамент", null, true);

            RfiResponseEntryDto response = rfiService.addResponse(request);

            assertThat(response.rfiId()).isEqualTo(rfiId);
            assertThat(response.responseText()).isEqualTo("Применяется ленточный фундамент");
            assertThat(response.isOfficial()).isTrue();
            verify(auditService).logCreate(eq("RfiResponse"), any(UUID.class));
        }
    }
}
