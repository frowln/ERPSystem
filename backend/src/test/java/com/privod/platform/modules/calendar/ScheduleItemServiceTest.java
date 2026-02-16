package com.privod.platform.modules.calendar;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.ConstructionSchedule;
import com.privod.platform.modules.calendar.domain.ScheduleItem;
import com.privod.platform.modules.calendar.domain.ScheduleStatus;
import com.privod.platform.modules.calendar.domain.WorkType;
import com.privod.platform.modules.calendar.repository.ConstructionScheduleRepository;
import com.privod.platform.modules.calendar.repository.ScheduleItemRepository;
import com.privod.platform.modules.calendar.service.ScheduleItemService;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleItemRequest;
import com.privod.platform.modules.calendar.web.dto.GanttItemResponse;
import com.privod.platform.modules.calendar.web.dto.ScheduleItemResponse;
import com.privod.platform.modules.calendar.web.dto.UpdateProgressRequest;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleItemServiceTest {

    @Mock
    private ScheduleItemRepository itemRepository;

    @Mock
    private ConstructionScheduleRepository scheduleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ScheduleItemService itemService;

    private UUID scheduleId;
    private UUID parentItemId;
    private UUID childItemId;
    private ScheduleItem parentItem;
    private ScheduleItem childItem;

    @BeforeEach
    void setUp() {
        scheduleId = UUID.randomUUID();
        parentItemId = UUID.randomUUID();
        childItemId = UUID.randomUUID();

        parentItem = ScheduleItem.builder()
                .scheduleId(scheduleId)
                .code("1")
                .name("Подготовительные работы")
                .workType(WorkType.PREPARATION)
                .plannedStartDate(LocalDate.of(2025, 3, 1))
                .plannedEndDate(LocalDate.of(2025, 3, 31))
                .duration(31)
                .progress(0)
                .isCriticalPath(true)
                .sortOrder(0)
                .build();
        parentItem.setId(parentItemId);
        parentItem.setCreatedAt(Instant.now());

        childItem = ScheduleItem.builder()
                .scheduleId(scheduleId)
                .parentItemId(parentItemId)
                .code("1.1")
                .name("Расчистка территории")
                .workType(WorkType.PREPARATION)
                .plannedStartDate(LocalDate.of(2025, 3, 1))
                .plannedEndDate(LocalDate.of(2025, 3, 10))
                .duration(10)
                .progress(50)
                .isCriticalPath(true)
                .sortOrder(1)
                .build();
        childItem.setId(childItemId);
        childItem.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Item")
    class CreateItemTests {

        @Test
        @DisplayName("Should create schedule item with auto sort order")
        void createItem_Success() {
            ConstructionSchedule schedule = ConstructionSchedule.builder()
                    .projectId(UUID.randomUUID())
                    .name("План")
                    .status(ScheduleStatus.DRAFT)
                    .build();
            schedule.setId(scheduleId);

            CreateScheduleItemRequest request = new CreateScheduleItemRequest(
                    null, "2", "Земляные работы", "Рытьё котлована",
                    WorkType.EARTHWORK,
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30),
                    30, 0, parentItemId, 5,
                    UUID.randomUUID(), "Рабочий А.Б.", false);

            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(schedule));
            when(itemRepository.findMaxSortOrder(scheduleId)).thenReturn(1);
            when(itemRepository.save(any(ScheduleItem.class))).thenAnswer(inv -> {
                ScheduleItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            ScheduleItemResponse response = itemService.createItem(scheduleId, request);

            assertThat(response.name()).isEqualTo("Земляные работы");
            assertThat(response.workType()).isEqualTo(WorkType.EARTHWORK);
            assertThat(response.sortOrder()).isEqualTo(2);
            assertThat(response.predecessorItemId()).isEqualTo(parentItemId);
            assertThat(response.lagDays()).isEqualTo(5);
            verify(auditService).logCreate(eq("ScheduleItem"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Gantt & Hierarchy")
    class GanttTests {

        @Test
        @DisplayName("Should build hierarchical Gantt tree")
        void getScheduleGantt_BuildsTree() {
            when(itemRepository.findByScheduleIdAndDeletedFalseOrderBySortOrder(scheduleId))
                    .thenReturn(List.of(parentItem, childItem));

            List<GanttItemResponse> gantt = itemService.getScheduleGantt(scheduleId);

            assertThat(gantt).hasSize(1); // only root item
            assertThat(gantt.get(0).name()).isEqualTo("Подготовительные работы");
            assertThat(gantt.get(0).children()).hasSize(1);
            assertThat(gantt.get(0).children().get(0).name()).isEqualTo("Расчистка территории");
        }

        @Test
        @DisplayName("Should return critical path items")
        void getCriticalPath_ReturnsCriticalItems() {
            when(itemRepository.findByScheduleIdAndIsCriticalPathTrueAndDeletedFalseOrderBySortOrder(scheduleId))
                    .thenReturn(List.of(parentItem, childItem));

            List<ScheduleItemResponse> criticalPath = itemService.getCriticalPath(scheduleId);

            assertThat(criticalPath).hasSize(2);
            assertThat(criticalPath).allMatch(ScheduleItemResponse::isCriticalPath);
        }
    }

    @Nested
    @DisplayName("Progress Update")
    class ProgressTests {

        @Test
        @DisplayName("Should update progress and audit")
        void updateProgress_Success() {
            when(itemRepository.findById(childItemId)).thenReturn(Optional.of(childItem));
            when(itemRepository.save(any(ScheduleItem.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleItemResponse response = itemService.updateProgress(
                    childItemId, new UpdateProgressRequest(75));

            assertThat(response.progress()).isEqualTo(75);
            verify(auditService).logUpdate("ScheduleItem", childItemId,
                    "progress", "50", "75");
        }
    }
}
