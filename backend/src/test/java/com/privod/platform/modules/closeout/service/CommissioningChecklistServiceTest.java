package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.domain.CommissioningChecklist;
import com.privod.platform.modules.closeout.repository.CommissioningChecklistRepository;
import com.privod.platform.modules.closeout.web.dto.CommissioningChecklistResponse;
import com.privod.platform.modules.closeout.web.dto.CreateCommissioningChecklistRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateCommissioningChecklistRequest;
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
class CommissioningChecklistServiceTest {

    @Mock
    private CommissioningChecklistRepository checklistRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CommissioningChecklistService checklistService;

    private UUID checklistId;
    private UUID projectId;
    private CommissioningChecklist testChecklist;

    @BeforeEach
    void setUp() {
        checklistId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testChecklist = CommissioningChecklist.builder()
                .projectId(projectId)
                .name("Проверка системы вентиляции")
                .system("HVAC")
                .status(ChecklistStatus.NOT_STARTED)
                .checkItems("[{\"item\":\"Проверка воздуховодов\",\"done\":false}]")
                .inspectorId(UUID.randomUUID())
                .inspectionDate(LocalDate.of(2025, 8, 1))
                .notes("Первичная проверка")
                .build();
        testChecklist.setId(checklistId);
        testChecklist.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Commissioning Checklist")
    class CreateTests {

        @Test
        @DisplayName("Should create checklist with NOT_STARTED status")
        void shouldCreateChecklist_withNotStartedStatus() {
            CreateCommissioningChecklistRequest request = new CreateCommissioningChecklistRequest(
                    projectId, "Проверка электросистемы", "Электрика",
                    "[{\"item\":\"Проверка заземления\",\"done\":false}]",
                    UUID.randomUUID(), LocalDate.of(2025, 9, 1),
                    "Заметки", null);

            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> {
                CommissioningChecklist cl = inv.getArgument(0);
                cl.setId(UUID.randomUUID());
                cl.setCreatedAt(Instant.now());
                return cl;
            });

            CommissioningChecklistResponse response = checklistService.create(request);

            assertThat(response.status()).isEqualTo(ChecklistStatus.NOT_STARTED);
            assertThat(response.name()).isEqualTo("Проверка электросистемы");
            assertThat(response.system()).isEqualTo("Электрика");
            verify(auditService).logCreate(eq("CommissioningChecklist"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create checklist with check items as JSON")
        void shouldCreateChecklist_withCheckItems() {
            String checkItems = "[{\"item\":\"Пункт 1\",\"done\":false},{\"item\":\"Пункт 2\",\"done\":false}]";
            CreateCommissioningChecklistRequest request = new CreateCommissioningChecklistRequest(
                    projectId, "Чек-лист", "Система", checkItems,
                    null, null, null, null);

            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> {
                CommissioningChecklist cl = inv.getArgument(0);
                cl.setId(UUID.randomUUID());
                cl.setCreatedAt(Instant.now());
                return cl;
            });

            CommissioningChecklistResponse response = checklistService.create(request);

            assertThat(response.checkItems()).isEqualTo(checkItems);
        }
    }

    @Nested
    @DisplayName("Update Commissioning Checklist")
    class UpdateTests {

        @Test
        @DisplayName("Should update checklist name and system")
        void shouldUpdateChecklist_whenValidInput() {
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                    "Обновлённый чек-лист", "Обновлённая система",
                    null, null, null, null, null, null, null);

            CommissioningChecklistResponse response = checklistService.update(checklistId, request);

            assertThat(response.name()).isEqualTo("Обновлённый чек-лист");
            assertThat(response.system()).isEqualTo("Обновлённая система");
            verify(auditService).logUpdate(eq("CommissioningChecklist"), eq(checklistId), any(), any(), any());
        }

        @Test
        @DisplayName("Should change status and log status transition")
        void shouldChangeStatus_andLogTransition() {
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                    null, null, ChecklistStatus.IN_PROGRESS, null,
                    null, null, null, null, null);

            CommissioningChecklistResponse response = checklistService.update(checklistId, request);

            assertThat(response.status()).isEqualTo(ChecklistStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("CommissioningChecklist", checklistId, "NOT_STARTED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should set signed off info when status is COMPLETED")
        void shouldSetSignedOffInfo_whenCompleted() {
            testChecklist.setStatus(ChecklistStatus.IN_PROGRESS);
            UUID signedOffById = UUID.randomUUID();
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                    null, null, ChecklistStatus.COMPLETED, null,
                    null, null, signedOffById, null, null);

            CommissioningChecklistResponse response = checklistService.update(checklistId, request);

            assertThat(response.status()).isEqualTo(ChecklistStatus.COMPLETED);
            assertThat(response.signedOffById()).isEqualTo(signedOffById);
            assertThat(response.signedOffAt()).isNotNull();
        }

        @Test
        @DisplayName("Should not set signed off info when status is FAILED")
        void shouldNotSetSignedOff_whenStatusIsFailed() {
            testChecklist.setStatus(ChecklistStatus.IN_PROGRESS);
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                    null, null, ChecklistStatus.FAILED, null,
                    null, null, null, null, null);

            CommissioningChecklistResponse response = checklistService.update(checklistId, request);

            assertThat(response.status()).isEqualTo(ChecklistStatus.FAILED);
            assertThat(response.signedOffById()).isNull();
        }

        @Test
        @DisplayName("Should update check items JSON")
        void shouldUpdateCheckItems() {
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            String updatedItems = "[{\"item\":\"Проверка воздуховодов\",\"done\":true}]";
            UpdateCommissioningChecklistRequest request = new UpdateCommissioningChecklistRequest(
                    null, null, null, updatedItems,
                    null, null, null, null, null);

            CommissioningChecklistResponse response = checklistService.update(checklistId, request);

            assertThat(response.checkItems()).isEqualTo(updatedItems);
        }
    }

    @Nested
    @DisplayName("Get and Delete")
    class GetAndDeleteTests {

        @Test
        @DisplayName("Should find checklist by ID")
        void shouldReturnChecklist_whenExists() {
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));

            CommissioningChecklistResponse response = checklistService.findById(checklistId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Проверка системы вентиляции");
            assertThat(response.statusDisplayName()).isEqualTo("Не начат");
        }

        @Test
        @DisplayName("Should throw when checklist not found")
        void shouldThrowException_whenChecklistNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(checklistRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> checklistService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Пусконаладочный чек-лист не найден");
        }

        @Test
        @DisplayName("Should soft delete checklist")
        void shouldSoftDelete_whenValidId() {
            when(checklistRepository.findById(checklistId)).thenReturn(Optional.of(testChecklist));
            when(checklistRepository.save(any(CommissioningChecklist.class))).thenAnswer(inv -> inv.getArgument(0));

            checklistService.delete(checklistId);

            assertThat(testChecklist.isDeleted()).isTrue();
            verify(auditService).logDelete("CommissioningChecklist", checklistId);
        }

        @Test
        @DisplayName("Should throw on delete when checklist not found")
        void shouldThrowException_whenDeleteNonExistent() {
            UUID nonExistent = UUID.randomUUID();
            when(checklistRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> checklistService.delete(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Пусконаладочный чек-лист не найден");
        }
    }
}
