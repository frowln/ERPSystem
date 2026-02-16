package com.privod.platform.modules.bim;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.DesignDiscipline;
import com.privod.platform.modules.bim.domain.DesignPackage;
import com.privod.platform.modules.bim.domain.DesignPackageStatus;
import com.privod.platform.modules.bim.repository.DesignPackageRepository;
import com.privod.platform.modules.bim.service.DesignPackageService;
import com.privod.platform.modules.bim.web.dto.CreateDesignPackageRequest;
import com.privod.platform.modules.bim.web.dto.DesignPackageResponse;
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
class DesignPackageServiceTest {

    @Mock
    private DesignPackageRepository designPackageRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DesignPackageService designPackageService;

    private UUID packageId;
    private UUID projectId;
    private DesignPackage testPackage;

    @BeforeEach
    void setUp() {
        packageId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testPackage = DesignPackage.builder()
                .projectId(projectId)
                .code("DP-00001")
                .name("Раздел архитектурных решений")
                .discipline(DesignDiscipline.ARCHITECTURAL)
                .status(DesignPackageStatus.DRAFT)
                .packageVersion(1)
                .build();
        testPackage.setId(packageId);
        testPackage.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание проектного пакета")
    class CreateTests {

        @Test
        @DisplayName("Должен создать пакет со статусом DRAFT и сгенерированным кодом")
        void createPackage_SetsDefaults() {
            CreateDesignPackageRequest request = new CreateDesignPackageRequest(
                    projectId,
                    "Раздел конструктивных решений",
                    DesignDiscipline.STRUCTURAL
            );

            when(designPackageRepository.getNextNumberSequence()).thenReturn(42L);
            when(designPackageRepository.save(any(DesignPackage.class))).thenAnswer(inv -> {
                DesignPackage p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            DesignPackageResponse response = designPackageService.createPackage(request);

            assertThat(response.status()).isEqualTo(DesignPackageStatus.DRAFT);
            assertThat(response.code()).isEqualTo("DP-00042");
            assertThat(response.discipline()).isEqualTo(DesignDiscipline.STRUCTURAL);
            assertThat(response.disciplineDisplayName()).isEqualTo("Конструкции");
            verify(auditService).logCreate(eq("DesignPackage"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Рабочий процесс проектного пакета")
    class WorkflowTests {

        @Test
        @DisplayName("Должен перевести из DRAFT в IN_REVIEW")
        void submitForReview_ValidTransition() {
            when(designPackageRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(designPackageRepository.save(any(DesignPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            DesignPackageResponse response = designPackageService.submitForReview(packageId);

            assertThat(response.status()).isEqualTo(DesignPackageStatus.IN_REVIEW);
            verify(auditService).logStatusChange("DesignPackage", packageId, "DRAFT", "IN_REVIEW");
        }

        @Test
        @DisplayName("Должен утвердить пакет из IN_REVIEW")
        void approvePackage_ValidTransition() {
            testPackage.setStatus(DesignPackageStatus.IN_REVIEW);
            UUID approverId = UUID.randomUUID();
            when(designPackageRepository.findById(packageId)).thenReturn(Optional.of(testPackage));
            when(designPackageRepository.save(any(DesignPackage.class))).thenAnswer(inv -> inv.getArgument(0));

            DesignPackageResponse response = designPackageService.approvePackage(packageId, approverId);

            assertThat(response.status()).isEqualTo(DesignPackageStatus.APPROVED);
            assertThat(response.approvedById()).isEqualTo(approverId);
            assertThat(response.approvedAt()).isNotNull();
            verify(auditService).logStatusChange("DesignPackage", packageId, "IN_REVIEW", "APPROVED");
        }

        @Test
        @DisplayName("Должен отклонить отправку на проверку не из DRAFT")
        void submitForReview_InvalidTransition() {
            testPackage.setStatus(DesignPackageStatus.APPROVED);
            when(designPackageRepository.findById(packageId)).thenReturn(Optional.of(testPackage));

            assertThatThrownBy(() -> designPackageService.submitForReview(packageId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить на проверку");
        }

        @Test
        @DisplayName("Должен отклонить утверждение не из IN_REVIEW")
        void approvePackage_InvalidTransition() {
            testPackage.setStatus(DesignPackageStatus.DRAFT);
            when(designPackageRepository.findById(packageId)).thenReturn(Optional.of(testPackage));

            assertThatThrownBy(() -> designPackageService.approvePackage(packageId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утвердить можно только пакет на проверке");
        }
    }

    @Nested
    @DisplayName("Получение проектного пакета")
    class GetTests {

        @Test
        @DisplayName("Должен найти пакет по ID")
        void getPackage_Success() {
            when(designPackageRepository.findById(packageId)).thenReturn(Optional.of(testPackage));

            DesignPackageResponse response = designPackageService.getPackage(packageId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("DP-00001");
            assertThat(response.statusDisplayName()).isEqualTo("Черновик");
        }

        @Test
        @DisplayName("Должен выбросить исключение если пакет не найден")
        void getPackage_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(designPackageRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> designPackageService.getPackage(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Проектный пакет не найден");
        }
    }
}
