package com.privod.platform.modules.calendar;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.CalendarType;
import com.privod.platform.modules.calendar.domain.DayType;
import com.privod.platform.modules.calendar.domain.WorkCalendar;
import com.privod.platform.modules.calendar.domain.WorkCalendarDay;
import com.privod.platform.modules.calendar.repository.WorkCalendarDayRepository;
import com.privod.platform.modules.calendar.repository.WorkCalendarRepository;
import com.privod.platform.modules.calendar.service.WorkCalendarService;
import com.privod.platform.modules.calendar.web.dto.WorkCalendarResponse;
import com.privod.platform.modules.calendar.web.dto.WorkingDaysResponse;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkCalendarServiceTest {

    @Mock
    private WorkCalendarRepository calendarRepository;

    @Mock
    private WorkCalendarDayRepository dayRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WorkCalendarService calendarService;

    private UUID calendarId;
    private WorkCalendar testCalendar;

    @BeforeEach
    void setUp() {
        calendarId = UUID.randomUUID();

        testCalendar = WorkCalendar.builder()
                .year(2025)
                .calendarType(CalendarType.STANDARD)
                .name("Производственный календарь 2025")
                .build();
        testCalendar.setId(calendarId);
        testCalendar.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Initialize Year")
    class InitializeYearTests {

        @Test
        @DisplayName("Should create calendar with all days for the year")
        void initializeYear_CreatesAllDays() {
            when(calendarRepository.existsByYearAndCalendarTypeAndProjectIdIsNullAndDeletedFalse(
                    2025, CalendarType.STANDARD)).thenReturn(false);
            when(calendarRepository.save(any(WorkCalendar.class))).thenAnswer(inv -> {
                WorkCalendar c = inv.getArgument(0);
                c.setId(calendarId);
                c.setCreatedAt(Instant.now());
                return c;
            });
            when(dayRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

            WorkCalendarResponse response = calendarService.initializeYear(2025);

            assertThat(response.year()).isEqualTo(2025);
            assertThat(response.calendarType()).isEqualTo(CalendarType.STANDARD);
            verify(dayRepository).saveAll(anyList());
            verify(auditService).logCreate(eq("WorkCalendar"), eq(calendarId));
        }

        @Test
        @DisplayName("Should reject duplicate standard calendar for same year")
        void initializeYear_DuplicateRejected() {
            when(calendarRepository.existsByYearAndCalendarTypeAndProjectIdIsNullAndDeletedFalse(
                    2025, CalendarType.STANDARD)).thenReturn(true);

            assertThatThrownBy(() -> calendarService.initializeYear(2025))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Working Days Calculation")
    class WorkingDaysTests {

        @Test
        @DisplayName("Should calculate working days in a range")
        void getWorkingDays_CalculatesCorrectly() {
            LocalDate start = LocalDate.of(2025, 3, 1);
            LocalDate end = LocalDate.of(2025, 3, 31);

            when(calendarRepository.findById(calendarId)).thenReturn(Optional.of(testCalendar));
            when(dayRepository.countWorkingDays(eq(calendarId), eq(start), eq(end), anyList()))
                    .thenReturn(21L);

            WorkingDaysResponse response = calendarService.getWorkingDays(calendarId, start, end);

            assertThat(response.workingDays()).isEqualTo(21);
            assertThat(response.totalDays()).isEqualTo(31);
            assertThat(response.startDate()).isEqualTo(start);
            assertThat(response.endDate()).isEqualTo(end);
        }
    }

    @Nested
    @DisplayName("Working Day Check")
    class IsWorkingDayTests {

        @Test
        @DisplayName("Should identify holiday as non-working day")
        void isWorkingDay_HolidayReturnsFalse() {
            LocalDate newYear = LocalDate.of(2025, 1, 1);

            WorkCalendarDay holidayDay = WorkCalendarDay.builder()
                    .calendarId(calendarId)
                    .calendarDate(newYear)
                    .dayType(DayType.HOLIDAY)
                    .workHours(BigDecimal.ZERO)
                    .note("Новый год")
                    .build();

            when(calendarRepository.findById(calendarId)).thenReturn(Optional.of(testCalendar));
            when(dayRepository.findByCalendarIdAndCalendarDateAndDeletedFalse(calendarId, newYear))
                    .thenReturn(Optional.of(holidayDay));

            boolean result = calendarService.isWorkingDay(calendarId, newYear);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should identify working day correctly")
        void isWorkingDay_WorkingDayReturnsTrue() {
            LocalDate monday = LocalDate.of(2025, 3, 3); // Monday

            WorkCalendarDay workDay = WorkCalendarDay.builder()
                    .calendarId(calendarId)
                    .calendarDate(monday)
                    .dayType(DayType.WORKING)
                    .workHours(new BigDecimal("8.00"))
                    .build();

            when(calendarRepository.findById(calendarId)).thenReturn(Optional.of(testCalendar));
            when(dayRepository.findByCalendarIdAndCalendarDateAndDeletedFalse(calendarId, monday))
                    .thenReturn(Optional.of(workDay));

            boolean result = calendarService.isWorkingDay(calendarId, monday);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should treat short day as working day")
        void isWorkingDay_ShortDayReturnsTrue() {
            LocalDate preHoliday = LocalDate.of(2025, 2, 22);

            WorkCalendarDay shortDay = WorkCalendarDay.builder()
                    .calendarId(calendarId)
                    .calendarDate(preHoliday)
                    .dayType(DayType.SHORT_DAY)
                    .workHours(new BigDecimal("7.00"))
                    .note("Предпраздничный день")
                    .build();

            when(calendarRepository.findById(calendarId)).thenReturn(Optional.of(testCalendar));
            when(dayRepository.findByCalendarIdAndCalendarDateAndDeletedFalse(calendarId, preHoliday))
                    .thenReturn(Optional.of(shortDay));

            boolean result = calendarService.isWorkingDay(calendarId, preHoliday);

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("Calculate End Date")
    class CalculateEndDateTests {

        @Test
        @DisplayName("Should calculate end date based on working days")
        void calculateEndDate_SkipsNonWorkingDays() {
            LocalDate startDate = LocalDate.of(2025, 3, 3); // Monday

            when(calendarRepository.findById(calendarId)).thenReturn(Optional.of(testCalendar));

            // Mon through Fri are working, Sat/Sun are weekends
            // For simplicity, return empty (defaults to weekend logic)
            when(dayRepository.findByCalendarIdAndCalendarDateAndDeletedFalse(eq(calendarId), any(LocalDate.class)))
                    .thenReturn(Optional.empty());

            LocalDate endDate = calendarService.calculateEndDate(calendarId, startDate, 5);

            // 5 working days from Monday Mar 3 = Friday Mar 7
            assertThat(endDate).isEqualTo(LocalDate.of(2025, 3, 7));
        }
    }
}
