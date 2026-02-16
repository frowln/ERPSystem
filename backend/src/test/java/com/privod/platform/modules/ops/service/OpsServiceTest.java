package com.privod.platform.modules.ops.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.DailyReport;
import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.domain.DefectSeverity;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.repository.DailyReportRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.repository.FieldInstructionRepository;
import com.privod.platform.modules.ops.repository.ShiftHandoverRepository;
import com.privod.platform.modules.ops.repository.WeatherRecordRepository;
import com.privod.platform.modules.ops.repository.WorkOrderRepository;
import com.privod.platform.modules.ops.web.dto.CreateDailyReportRequest;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.CreateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.DailyReportResponse;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
import com.privod.platform.modules.ops.web.dto.UpdateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.WorkOrderResponse;
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
class OpsServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private DailyReportRepository dailyReportRepository;

    @Mock
    private DefectRepository defectRepository;

    @Mock
    private FieldInstructionRepository fieldInstructionRepository;

    @Mock
    private WeatherRecordRepository weatherRecordRepository;

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OpsService opsService;

    private UUID workOrderId;
    private UUID projectId;
    private WorkOrder testWorkOrder;

    @BeforeEach
    void setUp() {
        workOrderId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testWorkOrder = WorkOrder.builder()
                .projectId(projectId)
                .code("НЗ-00001")
                .title("Земляные работы")
                .description("Выполнить земляные работы на участке 1")
                .workType("Земляные работы")
                .location("Площадка 1")
                .status(WorkOrderStatus.DRAFT)
                .priority(WorkOrderPriority.MEDIUM)
                .build();
        testWorkOrder.setId(workOrderId);
        testWorkOrder.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Work Order CRUD")
    class WorkOrderTests {

        @Test
        @DisplayName("Should create work order with DRAFT status")
        void shouldCreateWorkOrder_whenValidInput() {
            CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                    projectId, "Монтажные работы", "Описание", "Монтаж",
                    "Участок 2", null, null, LocalDate.now(), LocalDate.now().plusDays(7),
                    WorkOrderPriority.HIGH);

            when(workOrderRepository.getNextCodeSequence()).thenReturn(1L);
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> {
                WorkOrder wo = inv.getArgument(0);
                wo.setId(UUID.randomUUID());
                wo.setCreatedAt(Instant.now());
                return wo;
            });

            WorkOrderResponse response = opsService.createWorkOrder(request);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.DRAFT);
            assertThat(response.code()).isEqualTo("НЗ-00001");
            assertThat(response.priority()).isEqualTo(WorkOrderPriority.HIGH);
            verify(auditService).logCreate(eq("WorkOrder"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use MEDIUM priority by default")
        void shouldUseMediumPriority_whenNotSpecified() {
            CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                    projectId, "Работа", "Описание", "Тип",
                    "Участок", null, null, null, null, null);

            when(workOrderRepository.getNextCodeSequence()).thenReturn(2L);
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> {
                WorkOrder wo = inv.getArgument(0);
                wo.setId(UUID.randomUUID());
                wo.setCreatedAt(Instant.now());
                return wo;
            });

            WorkOrderResponse response = opsService.createWorkOrder(request);

            assertThat(response.priority()).isEqualTo(WorkOrderPriority.MEDIUM);
        }

        @Test
        @DisplayName("Should find work order by ID")
        void shouldReturnWorkOrder_whenExists() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));

            WorkOrderResponse response = opsService.getWorkOrder(workOrderId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("НЗ-00001");
        }

        @Test
        @DisplayName("Should throw when work order not found")
        void shouldThrowException_whenWorkOrderNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(workOrderRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> opsService.getWorkOrder(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Наряд-задание не найдено");
        }

        @Test
        @DisplayName("Should update work order fields")
        void shouldUpdateWorkOrder_whenValidInput() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWorkOrderRequest request = new UpdateWorkOrderRequest(
                    "Новое название", null, null, null, null, null,
                    null, null, WorkOrderPriority.CRITICAL, 50);

            WorkOrderResponse response = opsService.updateWorkOrder(workOrderId, request);

            assertThat(response.title()).isEqualTo("Новое название");
            assertThat(response.priority()).isEqualTo(WorkOrderPriority.CRITICAL);
            verify(auditService).logUpdate("WorkOrder", workOrderId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Work Order Status Transitions")
    class WorkOrderStatusTests {

        @Test
        @DisplayName("Should transition work order to IN_PROGRESS and set actualStart")
        void shouldSetActualStart_whenTransitionToInProgress() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkOrderResponse response = opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.IN_PROGRESS);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.IN_PROGRESS);
            assertThat(testWorkOrder.getActualStart()).isNotNull();
            verify(auditService).logStatusChange("WorkOrder", workOrderId, "DRAFT", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should set actualEnd and 100% when COMPLETED")
        void shouldSetActualEndAndCompletion_whenCompleted() {
            testWorkOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkOrderResponse response = opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.COMPLETED);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.COMPLETED);
            assertThat(testWorkOrder.getActualEnd()).isNotNull();
            assertThat(testWorkOrder.getCompletionPercent()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));

            assertThatThrownBy(() -> opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.COMPLETED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести наряд-задание");
        }
    }

    @Nested
    @DisplayName("Defect Management")
    class DefectTests {

        @Test
        @DisplayName("Should create defect with OPEN status")
        void shouldCreateDefect_whenValidInput() {
            CreateDefectRequest request = new CreateDefectRequest(
                    projectId, "Трещина в фундаменте", "Обнаружена трещина",
                    "Блок А", DefectSeverity.HIGH, List.of("photo1.jpg"),
                    UUID.randomUUID(), UUID.randomUUID(), LocalDate.now().plusDays(14));

            when(defectRepository.getNextCodeSequence()).thenReturn(1L);
            when(defectRepository.save(any(Defect.class))).thenAnswer(inv -> {
                Defect d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DefectResponse response = opsService.createDefect(request);

            assertThat(response.status()).isEqualTo(DefectStatus.OPEN);
            assertThat(response.code()).isEqualTo("ДЕФ-00001");
            assertThat(response.severity()).isEqualTo(DefectSeverity.HIGH);
        }

        @Test
        @DisplayName("Should reject invalid defect status transition")
        void shouldThrowException_whenInvalidDefectTransition() {
            Defect testDefect = Defect.builder()
                    .projectId(projectId)
                    .code("ДЕФ-00001")
                    .title("Дефект")
                    .status(DefectStatus.OPEN)
                    .severity(DefectSeverity.MEDIUM)
                    .build();
            testDefect.setId(UUID.randomUUID());
            testDefect.setCreatedAt(Instant.now());

            when(defectRepository.findById(testDefect.getId())).thenReturn(Optional.of(testDefect));

            assertThatThrownBy(() -> opsService.transitionDefectStatus(testDefect.getId(), DefectStatus.VERIFIED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести дефект");
        }
    }
}
