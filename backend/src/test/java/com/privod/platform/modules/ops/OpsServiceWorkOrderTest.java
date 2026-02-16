package com.privod.platform.modules.ops;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.domain.WorkType;
import com.privod.platform.modules.ops.repository.DailyReportRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.repository.FieldInstructionRepository;
import com.privod.platform.modules.ops.repository.ShiftHandoverRepository;
import com.privod.platform.modules.ops.repository.WeatherRecordRepository;
import com.privod.platform.modules.ops.repository.WorkOrderRepository;
import com.privod.platform.modules.ops.service.OpsService;
import com.privod.platform.modules.ops.web.dto.CreateWorkOrderRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsServiceWorkOrderTest {

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
                .title("Фундамент корпуса А")
                .description("Заливка фундамента")
                .workType(WorkType.FOUNDATION)
                .location("Корпус А, секция 1")
                .status(WorkOrderStatus.DRAFT)
                .priority(WorkOrderPriority.HIGH)
                .build();
        testWorkOrder.setId(workOrderId);
        testWorkOrder.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Work Order")
    class CreateTests {

        @Test
        @DisplayName("Should create work order with auto-generated code")
        void createWorkOrder_Success() {
            CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                    projectId, "Фундамент корпуса А", "Заливка фундамента",
                    WorkType.FOUNDATION, "Корпус А", null, null,
                    LocalDate.of(2025, 8, 1), LocalDate.of(2025, 8, 15),
                    WorkOrderPriority.HIGH);

            when(workOrderRepository.getNextCodeSequence()).thenReturn(1L);
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> {
                WorkOrder wo = invocation.getArgument(0);
                wo.setId(UUID.randomUUID());
                wo.setCreatedAt(Instant.now());
                return wo;
            });

            WorkOrderResponse response = opsService.createWorkOrder(request);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.DRAFT);
            assertThat(response.code()).isEqualTo("НЗ-00001");
            assertThat(response.priority()).isEqualTo(WorkOrderPriority.HIGH);
            assertThat(response.workType()).isEqualTo(WorkType.FOUNDATION);
            verify(auditService).logCreate(eq("WorkOrder"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create work order with default priority MEDIUM")
        void createWorkOrder_DefaultPriority() {
            CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                    projectId, "Стены", null,
                    WorkType.WALLS, null, null, null,
                    null, null, null);

            when(workOrderRepository.getNextCodeSequence()).thenReturn(2L);
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> {
                WorkOrder wo = invocation.getArgument(0);
                wo.setId(UUID.randomUUID());
                wo.setCreatedAt(Instant.now());
                return wo;
            });

            WorkOrderResponse response = opsService.createWorkOrder(request);

            assertThat(response.priority()).isEqualTo(WorkOrderPriority.MEDIUM);
        }
    }

    @Nested
    @DisplayName("Update Work Order")
    class UpdateTests {

        @Test
        @DisplayName("Should update work order fields")
        void updateWorkOrder_Success() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateWorkOrderRequest request = new UpdateWorkOrderRequest(
                    "Новое название", null, null, "Новая площадка",
                    null, null, null, null, WorkOrderPriority.CRITICAL, 25);

            WorkOrderResponse response = opsService.updateWorkOrder(workOrderId, request);

            assertThat(response.title()).isEqualTo("Новое название");
            assertThat(response.location()).isEqualTo("Новая площадка");
            assertThat(response.priority()).isEqualTo(WorkOrderPriority.CRITICAL);
            assertThat(response.completionPercent()).isEqualTo(25);
            verify(auditService).logUpdate(eq("WorkOrder"), eq(workOrderId), eq("multiple"), any(), any());
        }
    }

    @Nested
    @DisplayName("Work Order Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition from DRAFT to PLANNED")
        void planWorkOrder_Success() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkOrderResponse response = opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.PLANNED);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.PLANNED);
            verify(auditService).logStatusChange("WorkOrder", workOrderId, "DRAFT", "PLANNED");
        }

        @Test
        @DisplayName("Should transition from PLANNED to IN_PROGRESS and set actual start")
        void startWorkOrder_SetsActualStart() {
            testWorkOrder.setStatus(WorkOrderStatus.PLANNED);
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkOrderResponse response = opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.IN_PROGRESS);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.IN_PROGRESS);
            assertThat(testWorkOrder.getActualStart()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should complete work order and set 100% completion")
        void completeWorkOrder_SetsCompletion() {
            testWorkOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(inv -> inv.getArgument(0));

            WorkOrderResponse response = opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.COMPLETED);

            assertThat(response.status()).isEqualTo(WorkOrderStatus.COMPLETED);
            assertThat(response.completionPercent()).isEqualTo(100);
            assertThat(testWorkOrder.getActualEnd()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void invalidTransition() {
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(testWorkOrder));

            assertThatThrownBy(() -> opsService.transitionWorkOrderStatus(workOrderId, WorkOrderStatus.COMPLETED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести наряд-задание");
        }
    }

    @Test
    @DisplayName("Should throw when work order not found")
    void getWorkOrder_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(workOrderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> opsService.getWorkOrder(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Наряд-задание не найдено");
    }
}
