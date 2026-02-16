package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closeout.domain.HandoverPackage;
import com.privod.platform.modules.closeout.domain.HandoverStatus;
import com.privod.platform.modules.closeout.repository.HandoverPackageRepository;
import com.privod.platform.modules.closeout.web.dto.CreateHandoverPackageRequest;
import com.privod.platform.modules.closeout.web.dto.HandoverPackageResponse;
import com.privod.platform.modules.closeout.web.dto.UpdateHandoverPackageRequest;
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
class HandoverPackageServiceTest {

    @Mock
    private HandoverPackageRepository handoverRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private HandoverPackageService handoverPackageService;

    private UUID packageId;
    private UUID projectId;
    private HandoverPackage testPackage;

    @BeforeEach
    void setUp() {
        packageId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPackage = HandoverPackage.builder()
                .projectId(projectId)
                .packageNumber("HP-001")
                .title("Пакет передачи корпуса А")
                .description("Полный комплект документации для корпуса А")
                .status(HandoverStatus.DRAFT)
                .recipientOrganization("ООО Заказчик")
                .recipientContactId(UUID.randomUUID())
                .preparedById(UUID.randomUUID())
                .preparedDate(LocalDate.of(2025, 6, 1))
                .handoverDate(LocalDate.of(2025, 7, 1))
                .build();
        testPackage.setId(packageId);
        testPackage.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Handover Package")
    class CreateTests {

        @Test
        @DisplayName("Should create handover package with DRAFT status")
        void shouldCreatePackage_withDraftStatus() {
            CreateHandoverPackageRequest request = new CreateHandoverPackageRequest(
                    projectId, "HP-002", "Пакет передачи корпуса Б",
                    "Описание", "ООО Заказчик", UUID.randomUUID(),
                    UUID.randomUUID(), LocalDate.of(2025, 7, 1),
                    LocalDate.of(2025, 8, 1), null, null, null, null);

            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> {
                HandoverPackage pkg = inv.getArgument(0);
                pkg.setId(UUID.randomUUID());
                pkg.setCreatedAt(Instant.now());
                return pkg;
            });

            HandoverPackageResponse response = handoverPackageService.create(request);

            assertThat(response.status()).isEqualTo(HandoverStatus.DRAFT);
            assertThat(response.title()).isEqualTo("Пакет передачи корпуса Б");
            assertThat(response.recipientOrganization()).isEqualTo("ООО Заказчик");
            verify(auditService).logCreate(eq("HandoverPackage"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create handover package with document and drawing IDs")
        void shouldCreatePackage_withDocumentIds() {
            CreateHandoverPackageRequest request = new CreateHandoverPackageRequest(
                    projectId, "HP-003", "Пакет с документами",
                    null, null, null, null, null, null,
                    "[\"doc1\",\"doc2\"]", "[\"dwg1\"]", "[\"cert1\"]", "[\"manual1\"]");

            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> {
                HandoverPackage pkg = inv.getArgument(0);
                pkg.setId(UUID.randomUUID());
                pkg.setCreatedAt(Instant.now());
                return pkg;
            });

            HandoverPackageResponse response = handoverPackageService.create(request);

            assertThat(response.documentIds()).isEqualTo("[\"doc1\",\"doc2\"]");
            assertThat(response.drawingIds()).isEqualTo("[\"dwg1\"]");
        }
    }

    @Nested
    @DisplayName("Update Handover Package")
    class UpdateTests {

        @Test
        @DisplayName("Should update handover package title")
        void shouldUpdatePackage_whenValidInput() {
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateHandoverPackageRequest request = new UpdateHandoverPackageRequest(
                    null, "Обновлённый пакет", null, null,
                    null, null, null, null, null, null, null,
                    null, null, null, null, null);

            HandoverPackageResponse response = handoverPackageService.update(packageId, request);

            assertThat(response.title()).isEqualTo("Обновлённый пакет");
            verify(auditService).logUpdate(eq("HandoverPackage"), eq(packageId), any(), any(), any());
        }

        @Test
        @DisplayName("Should update status and log status change")
        void shouldUpdateStatus_andLogChange() {
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateHandoverPackageRequest request = new UpdateHandoverPackageRequest(
                    null, null, null, HandoverStatus.IN_PREPARATION,
                    null, null, null, null, null, null, null,
                    null, null, null, null, null);

            HandoverPackageResponse response = handoverPackageService.update(packageId, request);

            assertThat(response.status()).isEqualTo(HandoverStatus.IN_PREPARATION);
            verify(auditService).logStatusChange("HandoverPackage", packageId, "DRAFT", "IN_PREPARATION");
        }

        @Test
        @DisplayName("Should update accepted info with accepted date and by")
        void shouldUpdateAcceptedInfo() {
            testPackage.setStatus(HandoverStatus.SUBMITTED);
            UUID acceptedById = UUID.randomUUID();
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateHandoverPackageRequest request = new UpdateHandoverPackageRequest(
                    null, null, null, HandoverStatus.ACCEPTED,
                    null, null, null, null, null,
                    LocalDate.of(2025, 8, 15), acceptedById,
                    null, null, null, null, null);

            HandoverPackageResponse response = handoverPackageService.update(packageId, request);

            assertThat(response.status()).isEqualTo(HandoverStatus.ACCEPTED);
            assertThat(response.acceptedDate()).isEqualTo(LocalDate.of(2025, 8, 15));
            assertThat(response.acceptedById()).isEqualTo(acceptedById);
        }

        @Test
        @DisplayName("Should set rejection reason on rejection")
        void shouldSetRejectionReason_whenRejected() {
            testPackage.setStatus(HandoverStatus.SUBMITTED);
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateHandoverPackageRequest request = new UpdateHandoverPackageRequest(
                    null, null, null, HandoverStatus.REJECTED,
                    null, null, null, null, null, null, null,
                    null, null, null, null, "Неполный комплект документации");

            HandoverPackageResponse response = handoverPackageService.update(packageId, request);

            assertThat(response.status()).isEqualTo(HandoverStatus.REJECTED);
            assertThat(response.rejectionReason()).isEqualTo("Неполный комплект документации");
        }
    }

    @Nested
    @DisplayName("Get and Delete")
    class GetAndDeleteTests {

        @Test
        @DisplayName("Should find handover package by ID")
        void shouldReturnPackage_whenExists() {
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));

            HandoverPackageResponse response = handoverPackageService.findById(packageId);

            assertThat(response).isNotNull();
            assertThat(response.title()).isEqualTo("Пакет передачи корпуса А");
            assertThat(response.statusDisplayName()).isEqualTo("Черновик");
        }

        @Test
        @DisplayName("Should throw when handover package not found")
        void shouldThrowException_whenPackageNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(handoverRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> handoverPackageService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Пакет передачи не найден");
        }

        @Test
        @DisplayName("Should soft delete handover package")
        void shouldSoftDelete_whenValidId() {
            when(handoverRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(handoverRepository.save(any(HandoverPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            handoverPackageService.delete(packageId);

            assertThat(testPackage.isDeleted()).isTrue();
            verify(auditService).logDelete("HandoverPackage", packageId);
        }

        @Test
        @DisplayName("Should throw on delete when package not found")
        void shouldThrowException_whenDeleteNonExistent() {
            UUID nonExistent = UUID.randomUUID();
            when(handoverRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> handoverPackageService.delete(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Пакет передачи не найден");
        }
    }
}
