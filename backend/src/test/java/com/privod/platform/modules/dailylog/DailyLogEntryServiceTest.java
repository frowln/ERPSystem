package com.privod.platform.modules.dailylog;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogEntry;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.domain.EntryType;
import com.privod.platform.modules.dailylog.domain.WeatherCondition;
import com.privod.platform.modules.dailylog.repository.DailyLogEntryRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.dailylog.service.DailyLogEntryService;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogEntryRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogEntryResponse;
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
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyLogEntryServiceTest {

    @Mock
    private DailyLogEntryRepository entryRepository;

    @Mock
    private DailyLogRepository dailyLogRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DailyLogEntryService entryService;

    private UUID logId;
    private UUID entryId;
    private DailyLog testLog;

    @BeforeEach
    void setUp() {
        logId = UUID.randomUUID();
        entryId = UUID.randomUUID();

        testLog = DailyLog.builder()
                .code("KS6-00001")
                .projectId(UUID.randomUUID())
                .logDate(LocalDate.of(2025, 6, 15))
                .weatherConditions(WeatherCondition.CLEAR)
                .status(DailyLogStatus.DRAFT)
                .build();
        testLog.setId(logId);
        testLog.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Entry")
    class CreateTests {

        @Test
        @DisplayName("Should create entry in draft log")
        void createEntry_Success() {
            CreateDailyLogEntryRequest request = new CreateDailyLogEntryRequest(
                    EntryType.WORK_PERFORMED,
                    "Бетонирование фундамента блока Б",
                    new BigDecimal("45.5"),
                    "м3",
                    LocalTime.of(8, 0),
                    LocalTime.of(17, 0),
                    "Кузнецов В.Г.",
                    null
            );

            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(entryRepository.save(any(DailyLogEntry.class))).thenAnswer(inv -> {
                DailyLogEntry entry = inv.getArgument(0);
                entry.setId(UUID.randomUUID());
                entry.setCreatedAt(Instant.now());
                return entry;
            });

            DailyLogEntryResponse response = entryService.createEntry(logId, request);

            assertThat(response.entryType()).isEqualTo(EntryType.WORK_PERFORMED);
            assertThat(response.description()).isEqualTo("Бетонирование фундамента блока Б");
            assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("45.5"));
            verify(auditService).logCreate(eq("DailyLogEntry"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject creating entry in approved log")
        void createEntry_ApprovedLogReject() {
            testLog.setStatus(DailyLogStatus.APPROVED);

            CreateDailyLogEntryRequest request = new CreateDailyLogEntryRequest(
                    EntryType.WORK_PERFORMED, "Тест", null, null,
                    null, null, null, null
            );

            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> entryService.createEntry(logId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно добавить запись в утвержденный журнал");
        }
    }
}
