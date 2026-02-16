package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.BaselineType;
import com.privod.platform.modules.planning.domain.ScheduleBaseline;
import com.privod.platform.modules.planning.repository.ScheduleBaselineRepository;
import com.privod.platform.modules.planning.web.dto.CreateScheduleBaselineRequest;
import com.privod.platform.modules.planning.web.dto.ScheduleBaselineResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class ScheduleBaselineServiceTest {

    @Mock
    private ScheduleBaselineRepository baselineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ScheduleBaselineService scheduleBaselineService;

    private UUID baselineId;
    private UUID projectId;
    private ScheduleBaseline testBaseline;

    @BeforeEach
    void setUp() {
        baselineId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testBaseline = ScheduleBaseline.builder()
                .projectId(projectId)
                .name("Original Baseline")
                .baselineType(BaselineType.ORIGINAL)
                .baselineDate(LocalDate.of(2025, 1, 15))
                .snapshotData("{\"nodes\":[]}")
                .createdById(UUID.randomUUID())
                .notes("Initial baseline capture")
                .build();
        testBaseline.setId(baselineId);
        testBaseline.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Baseline")
    class CreateTests {

        @Test
        @DisplayName("Should create baseline with default ORIGINAL type")
        void shouldCreateBaseline_withDefaultType() {
            CreateScheduleBaselineRequest request = new CreateScheduleBaselineRequest(
                    projectId, "New Baseline", null,
                    LocalDate.of(2025, 6, 1), "{\"nodes\":[]}",
                    UUID.randomUUID(), "Notes");

            when(baselineRepository.save(any(ScheduleBaseline.class))).thenAnswer(inv -> {
                ScheduleBaseline b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            ScheduleBaselineResponse response = scheduleBaselineService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.baselineType()).isEqualTo(BaselineType.ORIGINAL);
            assertThat(response.name()).isEqualTo("New Baseline");
            verify(auditService).logCreate(eq("ScheduleBaseline"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create baseline with specific type")
        void shouldCreateBaseline_withSpecificType() {
            CreateScheduleBaselineRequest request = new CreateScheduleBaselineRequest(
                    projectId, "Revised Baseline", BaselineType.REVISED,
                    LocalDate.of(2025, 6, 1), null,
                    UUID.randomUUID(), null);

            when(baselineRepository.save(any(ScheduleBaseline.class))).thenAnswer(inv -> {
                ScheduleBaseline b = inv.getArgument(0);
                b.setId(UUID.randomUUID());
                b.setCreatedAt(Instant.now());
                return b;
            });

            ScheduleBaselineResponse response = scheduleBaselineService.create(request);

            assertThat(response.baselineType()).isEqualTo(BaselineType.REVISED);
        }
    }

    @Nested
    @DisplayName("Read Baseline")
    class ReadTests {

        @Test
        @DisplayName("Should find baseline by ID")
        void shouldReturnBaseline_whenFound() {
            when(baselineRepository.findById(baselineId)).thenReturn(Optional.of(testBaseline));

            ScheduleBaselineResponse response = scheduleBaselineService.findById(baselineId);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Original Baseline");
            assertThat(response.baselineType()).isEqualTo(BaselineType.ORIGINAL);
        }

        @Test
        @DisplayName("Should throw when baseline not found")
        void shouldThrowException_whenBaselineNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(baselineRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleBaselineService.findById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when baseline is deleted")
        void shouldThrowException_whenBaselineDeleted() {
            testBaseline.softDelete();
            when(baselineRepository.findById(baselineId)).thenReturn(Optional.of(testBaseline));

            assertThatThrownBy(() -> scheduleBaselineService.findById(baselineId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return paginated baselines for project")
        void shouldReturnPagedBaselines_forProject() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ScheduleBaseline> page = new PageImpl<>(List.of(testBaseline));
            when(baselineRepository.findByProjectIdAndDeletedFalse(projectId, pageable)).thenReturn(page);

            Page<ScheduleBaselineResponse> result = scheduleBaselineService.findByProject(projectId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("Original Baseline");
        }
    }

    @Nested
    @DisplayName("Delete Baseline")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete baseline")
        void shouldSoftDeleteBaseline() {
            when(baselineRepository.findById(baselineId)).thenReturn(Optional.of(testBaseline));
            when(baselineRepository.save(any(ScheduleBaseline.class))).thenReturn(testBaseline);

            scheduleBaselineService.delete(baselineId);

            assertThat(testBaseline.isDeleted()).isTrue();
            verify(auditService).logDelete("ScheduleBaseline", baselineId);
        }
    }
}
