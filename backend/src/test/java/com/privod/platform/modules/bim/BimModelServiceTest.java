package com.privod.platform.modules.bim;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.BimModelFormat;
import com.privod.platform.modules.bim.domain.BimModelStatus;
import com.privod.platform.modules.bim.domain.BimModelType;
import com.privod.platform.modules.bim.repository.BimModelRepository;
import com.privod.platform.modules.bim.service.BimModelService;
import com.privod.platform.modules.bim.web.dto.BimModelResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimModelRequest;
import com.privod.platform.modules.bim.web.dto.UpdateBimModelRequest;
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
class BimModelServiceTest {

    @Mock
    private BimModelRepository bimModelRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BimModelService bimModelService;

    private UUID modelId;
    private UUID projectId;
    private BimModel testModel;

    @BeforeEach
    void setUp() {
        modelId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testModel = BimModel.builder()
                .name("Архитектурная модель корпуса А")
                .projectId(projectId)
                .modelType(BimModelType.ARCHITECTURAL)
                .format(BimModelFormat.IFC)
                .fileUrl("/storage/models/corp-a.ifc")
                .fileSize(125_000_000L)
                .description("Основная архитектурная модель")
                .status(BimModelStatus.DRAFT)
                .uploadedById(UUID.randomUUID())
                .elementCount(0)
                .modelVersion(1)
                .build();
        testModel.setId(modelId);
        testModel.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание BIM модели")
    class CreateTests {

        @Test
        @DisplayName("Должна создать модель со статусом DRAFT")
        void createModel_SetsDefaults() {
            CreateBimModelRequest request = new CreateBimModelRequest(
                    "Конструктивная модель",
                    projectId,
                    BimModelType.STRUCTURAL,
                    BimModelFormat.IFC,
                    "/storage/models/struct.ifc",
                    80_000_000L,
                    "Конструктивная модель здания",
                    UUID.randomUUID()
            );

            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> {
                BimModel m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            BimModelResponse response = bimModelService.createModel(request);

            assertThat(response.status()).isEqualTo(BimModelStatus.DRAFT);
            assertThat(response.modelType()).isEqualTo(BimModelType.STRUCTURAL);
            assertThat(response.format()).isEqualTo(BimModelFormat.IFC);
            assertThat(response.name()).isEqualTo("Конструктивная модель");
            verify(auditService).logCreate(eq("BimModel"), any(UUID.class));
        }

        @Test
        @DisplayName("Должна создать модель MEP формата RVT")
        void createModel_MepRevit() {
            CreateBimModelRequest request = new CreateBimModelRequest(
                    "Инженерные системы",
                    projectId,
                    BimModelType.MEP,
                    BimModelFormat.RVT,
                    "/storage/models/mep.rvt",
                    200_000_000L,
                    null,
                    null
            );

            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> {
                BimModel m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            BimModelResponse response = bimModelService.createModel(request);

            assertThat(response.modelType()).isEqualTo(BimModelType.MEP);
            assertThat(response.format()).isEqualTo(BimModelFormat.RVT);
            assertThat(response.modelTypeDisplayName()).isEqualTo("Инженерные системы (MEP)");
            assertThat(response.formatDisplayName()).isEqualTo("Revit (RVT)");
        }
    }

    @Nested
    @DisplayName("Рабочий процесс BIM модели")
    class WorkflowTests {

        @Test
        @DisplayName("Должна перевести из DRAFT в IMPORTED")
        void importModel_ValidTransition() {
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));
            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> inv.getArgument(0));

            BimModelResponse response = bimModelService.importModel(modelId);

            assertThat(response.status()).isEqualTo(BimModelStatus.IMPORTED);
            verify(auditService).logStatusChange("BimModel", modelId, "DRAFT", "IMPORTED");
        }

        @Test
        @DisplayName("Должна перевести из IMPORTED в PROCESSED")
        void processModel_ValidTransition() {
            testModel.setStatus(BimModelStatus.IMPORTED);
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));
            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> inv.getArgument(0));

            BimModelResponse response = bimModelService.processModel(modelId);

            assertThat(response.status()).isEqualTo(BimModelStatus.PROCESSED);
            verify(auditService).logStatusChange("BimModel", modelId, "IMPORTED", "PROCESSED");
        }

        @Test
        @DisplayName("Должна отклонить импорт не из DRAFT")
        void importModel_InvalidTransition() {
            testModel.setStatus(BimModelStatus.PROCESSED);
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));

            assertThatThrownBy(() -> bimModelService.importModel(modelId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно импортировать модель");
        }

        @Test
        @DisplayName("Должна отклонить обработку не из IMPORTED")
        void processModel_InvalidTransition() {
            testModel.setStatus(BimModelStatus.DRAFT);
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));

            assertThatThrownBy(() -> bimModelService.processModel(modelId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно обработать модель");
        }
    }

    @Nested
    @DisplayName("Получение BIM модели")
    class GetTests {

        @Test
        @DisplayName("Должна найти модель по ID")
        void getModel_Success() {
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));

            BimModelResponse response = bimModelService.getModel(modelId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Архитектурная модель корпуса А");
            assertThat(response.statusDisplayName()).isEqualTo("Черновик");
        }

        @Test
        @DisplayName("Должна выбросить исключение если модель не найдена")
        void getModel_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(bimModelRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bimModelService.getModel(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("BIM модель не найдена");
        }
    }

    @Nested
    @DisplayName("Обновление BIM модели")
    class UpdateTests {

        @Test
        @DisplayName("Должна обновить название и описание")
        void updateModel_PartialUpdate() {
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));
            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBimModelRequest request = new UpdateBimModelRequest(
                    "Новое название модели",
                    null, null, null, null,
                    "Обновлённое описание",
                    null, null, null
            );

            BimModelResponse response = bimModelService.updateModel(modelId, request);

            assertThat(response.name()).isEqualTo("Новое название модели");
            assertThat(response.description()).isEqualTo("Обновлённое описание");
            verify(auditService).logUpdate(eq("BimModel"), eq(modelId), eq("multiple"), any(), any());
        }
    }

    @Nested
    @DisplayName("Удаление BIM модели")
    class DeleteTests {

        @Test
        @DisplayName("Должна мягко удалить модель")
        void deleteModel_Success() {
            when(bimModelRepository.findById(modelId)).thenReturn(Optional.of(testModel));
            when(bimModelRepository.save(any(BimModel.class))).thenAnswer(inv -> inv.getArgument(0));

            bimModelService.deleteModel(modelId);

            assertThat(testModel.isDeleted()).isTrue();
            verify(auditService).logDelete("BimModel", modelId);
        }
    }
}
