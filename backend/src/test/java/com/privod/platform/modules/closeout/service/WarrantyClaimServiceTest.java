package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closeout.domain.WarrantyClaim;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import com.privod.platform.modules.closeout.repository.WarrantyClaimRepository;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyClaimResponse;
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
class WarrantyClaimServiceTest {

    @Mock
    private WarrantyClaimRepository warrantyRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WarrantyClaimService warrantyClaimService;

    private UUID claimId;
    private UUID projectId;
    private UUID handoverPackageId;
    private WarrantyClaim testClaim;

    @BeforeEach
    void setUp() {
        claimId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        handoverPackageId = UUID.randomUUID();

        testClaim = WarrantyClaim.builder()
                .projectId(projectId)
                .handoverPackageId(handoverPackageId)
                .claimNumber("WC-001")
                .title("Трещина в фундаменте")
                .description("Обнаружена трещина шириной 2мм в фундаменте корпуса А")
                .status(WarrantyClaimStatus.OPEN)
                .defectType("Структурный дефект")
                .location("Корпус А, секция 3")
                .reportedById(UUID.randomUUID())
                .reportedDate(LocalDate.of(2025, 9, 1))
                .warrantyExpiryDate(LocalDate.of(2027, 9, 1))
                .assignedToId(UUID.randomUUID())
                .costOfRepair(new BigDecimal("150000.00"))
                .build();
        testClaim.setId(claimId);
        testClaim.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Warranty Claim")
    class CreateTests {

        @Test
        @DisplayName("Should create warranty claim with OPEN status")
        void shouldCreateClaim_withOpenStatus() {
            CreateWarrantyClaimRequest request = new CreateWarrantyClaimRequest(
                    projectId, handoverPackageId, "WC-002",
                    "Протечка кровли", "Протечка в зоне примыкания",
                    "Гидроизоляция", "Корпус Б, этаж 5",
                    UUID.randomUUID(), LocalDate.of(2025, 10, 1),
                    LocalDate.of(2027, 10, 1), UUID.randomUUID(),
                    new BigDecimal("75000.00"), null);

            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> {
                WarrantyClaim c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            WarrantyClaimResponse response = warrantyClaimService.create(request);

            assertThat(response.status()).isEqualTo(WarrantyClaimStatus.OPEN);
            assertThat(response.title()).isEqualTo("Протечка кровли");
            assertThat(response.defectType()).isEqualTo("Гидроизоляция");
            assertThat(response.costOfRepair()).isEqualByComparingTo(new BigDecimal("75000.00"));
            verify(auditService).logCreate(eq("WarrantyClaim"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create warranty claim without handover package")
        void shouldCreateClaim_withoutHandoverPackage() {
            CreateWarrantyClaimRequest request = new CreateWarrantyClaimRequest(
                    projectId, null, "WC-003",
                    "Дефект без пакета", null,
                    null, null, null, null, null, null, null, null);

            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> {
                WarrantyClaim c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            WarrantyClaimResponse response = warrantyClaimService.create(request);

            assertThat(response.handoverPackageId()).isNull();
        }

        @Test
        @DisplayName("Should create warranty claim with attachment IDs")
        void shouldCreateClaim_withAttachments() {
            CreateWarrantyClaimRequest request = new CreateWarrantyClaimRequest(
                    projectId, handoverPackageId, "WC-004",
                    "Дефект с фото", "Описание",
                    "Визуальный дефект", "Фасад",
                    UUID.randomUUID(), LocalDate.now(),
                    LocalDate.now().plusYears(2), null,
                    null, "[\"photo1.jpg\",\"photo2.jpg\"]");

            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> {
                WarrantyClaim c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            WarrantyClaimResponse response = warrantyClaimService.create(request);

            assertThat(response.attachmentIds()).isEqualTo("[\"photo1.jpg\",\"photo2.jpg\"]");
        }
    }

    @Nested
    @DisplayName("Update Warranty Claim")
    class UpdateTests {

        @Test
        @DisplayName("Should update warranty claim title and description")
        void shouldUpdateClaim_whenValidInput() {
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWarrantyClaimRequest request = new UpdateWarrantyClaimRequest(
                    null, "Обновлённое название", "Обновлённое описание",
                    null, null, null, null, null, null, null, null);

            WarrantyClaimResponse response = warrantyClaimService.update(claimId, request);

            assertThat(response.title()).isEqualTo("Обновлённое название");
            assertThat(response.description()).isEqualTo("Обновлённое описание");
            verify(auditService).logUpdate(eq("WarrantyClaim"), eq(claimId), any(), any(), any());
        }

        @Test
        @DisplayName("Should change claim status and log transition")
        void shouldChangeStatus_andLogTransition() {
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWarrantyClaimRequest request = new UpdateWarrantyClaimRequest(
                    null, null, null, WarrantyClaimStatus.UNDER_REVIEW,
                    null, null, null, null, null, null, null);

            WarrantyClaimResponse response = warrantyClaimService.update(claimId, request);

            assertThat(response.status()).isEqualTo(WarrantyClaimStatus.UNDER_REVIEW);
            verify(auditService).logStatusChange("WarrantyClaim", claimId, "OPEN", "UNDER_REVIEW");
        }

        @Test
        @DisplayName("Should resolve claim with resolution description and resolved date")
        void shouldResolveClaim_withResolutionDetails() {
            testClaim.setStatus(WarrantyClaimStatus.IN_REPAIR);
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWarrantyClaimRequest request = new UpdateWarrantyClaimRequest(
                    null, null, null, WarrantyClaimStatus.RESOLVED,
                    null, null, null,
                    LocalDate.of(2025, 12, 1),
                    "Трещина заделана, усилен фундамент",
                    new BigDecimal("200000.00"), null);

            WarrantyClaimResponse response = warrantyClaimService.update(claimId, request);

            assertThat(response.status()).isEqualTo(WarrantyClaimStatus.RESOLVED);
            assertThat(response.resolvedDate()).isEqualTo(LocalDate.of(2025, 12, 1));
            assertThat(response.resolutionDescription()).isEqualTo("Трещина заделана, усилен фундамент");
            assertThat(response.costOfRepair()).isEqualByComparingTo(new BigDecimal("200000.00"));
        }

        @Test
        @DisplayName("Should update assigned person")
        void shouldUpdateAssignedTo() {
            UUID newAssignee = UUID.randomUUID();
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWarrantyClaimRequest request = new UpdateWarrantyClaimRequest(
                    null, null, null, null,
                    null, null, newAssignee,
                    null, null, null, null);

            WarrantyClaimResponse response = warrantyClaimService.update(claimId, request);

            assertThat(response.assignedToId()).isEqualTo(newAssignee);
        }
    }

    @Nested
    @DisplayName("Get and Delete")
    class GetAndDeleteTests {

        @Test
        @DisplayName("Should find warranty claim by ID")
        void shouldReturnClaim_whenExists() {
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));

            WarrantyClaimResponse response = warrantyClaimService.findById(claimId);

            assertThat(response).isNotNull();
            assertThat(response.claimNumber()).isEqualTo("WC-001");
            assertThat(response.title()).isEqualTo("Трещина в фундаменте");
            assertThat(response.statusDisplayName()).isEqualTo("Открыт");
        }

        @Test
        @DisplayName("Should throw when warranty claim not found")
        void shouldThrowException_whenClaimNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(warrantyRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> warrantyClaimService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Гарантийная рекламация не найдена");
        }

        @Test
        @DisplayName("Should soft delete warranty claim")
        void shouldSoftDelete_whenValidId() {
            when(warrantyRepository.findById(claimId)).thenReturn(Optional.of(testClaim));
            when(warrantyRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> inv.getArgument(0));

            warrantyClaimService.delete(claimId);

            assertThat(testClaim.isDeleted()).isTrue();
            verify(auditService).logDelete("WarrantyClaim", claimId);
        }

        @Test
        @DisplayName("Should throw on delete when claim not found")
        void shouldThrowException_whenDeleteNonExistent() {
            UUID nonExistent = UUID.randomUUID();
            when(warrantyRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> warrantyClaimService.delete(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Гарантийная рекламация не найдена");
        }
    }
}
