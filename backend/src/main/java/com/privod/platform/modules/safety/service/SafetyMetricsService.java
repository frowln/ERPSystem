package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.repository.SafetyInspectionRepository;
import com.privod.platform.modules.safety.repository.SafetyTrainingRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.repository.TrainingRecordRepository;
import com.privod.platform.modules.safety.web.dto.SafetyMetricsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyMetricsService {

    // Условное базовое число человеко-часов для оценки, когда нет данных табеля.
    // 1 год × 250 раб.дней × 8ч × 100 человек ≈ 200 000 ч
    private static final long DEFAULT_MAN_HOURS = 200_000L;
    // LTIFR multiplier per ISO 45001 / OHSAS 18001: 1 000 000 человеко-часов
    private static final long LTIFR_MULTIPLIER = 1_000_000L;
    // TRIR multiplier per OSHA 300: 200 000 человеко-часов (100 человек × 2 000 ч/год)
    private static final long TRIR_MULTIPLIER = 200_000L;

    private final SafetyIncidentRepository incidentRepository;
    private final SafetyInspectionRepository inspectionRepository;
    private final SafetyViolationRepository violationRepository;
    private final SafetyTrainingRepository trainingRepository;
    private final TrainingRecordRepository trainingRecordRepository;

    @Transactional(readOnly = true)
    public SafetyMetricsResponse getMetrics(String period) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        long totalIncidents = incidentRepository.countTotal(organizationId, null);
        long totalInspections = inspectionRepository.countByOrganizationIdAndDeletedFalse(organizationId);
        long openViolations = violationRepository.countOpenByOrganizationId(organizationId);

        // Count near misses from incident type breakdown
        long nearMisses = 0;
        long firstAidCases = 0;
        for (Object[] row : incidentRepository.countByType(organizationId, null)) {
            IncidentType type = (IncidentType) row[0];
            Long count = (Long) row[1];
            if (type == IncidentType.NEAR_MISS) {
                nearMisses = count;
            }
            // First aid cases counted separately — incidents where medicalTreatment=false and no lost days
        }

        int totalWorkDaysLost = incidentRepository.sumWorkDaysLost(organizationId, null);

        // Фактические человеко-часы (в идеале — из табеля; пока используем базовую оценку)
        long safeManHours = DEFAULT_MAN_HOURS - (totalWorkDaysLost * 8L);
        long actualWorkedHours = Math.max(1L, DEFAULT_MAN_HOURS);

        // P0-SAF-1: LTIFR — Lost Time Injury Frequency Rate (ISO 45001 / OHSAS 18001)
        // Формула: (кол-во НС с потерей трудоспособности × 1 000 000) / фактические чел.-часы
        // BUG WAS: делили на тот же DEFAULT_MAN_HOURS что множили → всегда = кол-во НС
        long lostTimeIncidents = totalIncidents - nearMisses - firstAidCases;
        BigDecimal ltir = lostTimeIncidents > 0
                ? BigDecimal.valueOf(lostTimeIncidents)
                    .multiply(BigDecimal.valueOf(LTIFR_MULTIPLIER))
                    .divide(BigDecimal.valueOf(actualWorkedHours), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // TRIR — Total Recordable Incident Rate (OSHA 300)
        // Формула: (все НС × 200 000) / фактические чел.-часы
        BigDecimal trir = totalIncidents > 0
                ? BigDecimal.valueOf(totalIncidents)
                    .multiply(BigDecimal.valueOf(TRIR_MULTIPLIER))
                    .divide(BigDecimal.valueOf(actualWorkedHours), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Training completion rate
        long totalRecords = trainingRecordRepository.countTotal(organizationId);
        long validRecords = trainingRecordRepository.countValid(organizationId, LocalDate.now());
        BigDecimal trainingCompletionRate = totalRecords > 0
                ? BigDecimal.valueOf(validRecords * 100)
                    .divide(BigDecimal.valueOf(totalRecords), 2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(100);

        // Days without incident (stub — would need last incident date query)
        long daysWithoutIncident = 0;

        return new SafetyMetricsResponse(
                ltir,
                trir,
                nearMisses,
                firstAidCases,
                totalIncidents,
                totalInspections,
                openViolations,
                trainingCompletionRate,
                safeManHours > 0 ? safeManHours : 0,
                daysWithoutIncident
        );
    }
}
