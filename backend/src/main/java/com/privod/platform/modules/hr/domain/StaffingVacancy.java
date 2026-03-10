package com.privod.platform.modules.hr.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "hr_staffing_vacancies", indexes = {
        @Index(name = "idx_vacancy_position", columnList = "staffing_position_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffingVacancy extends BaseEntity {

    @Column(name = "staffing_position_id", nullable = false)
    private UUID staffingPositionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private VacancyStatus status = VacancyStatus.OPEN;

    public enum VacancyStatus {
        OPEN, IN_PROGRESS, CLOSED
    }
}
