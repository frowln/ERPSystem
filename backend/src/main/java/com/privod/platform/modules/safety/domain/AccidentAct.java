package com.privod.platform.modules.safety.domain;

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
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "safety_accident_acts", indexes = {
        @Index(name = "idx_accident_act_org", columnList = "organization_id"),
        @Index(name = "idx_accident_act_project", columnList = "project_id"),
        @Index(name = "idx_accident_act_status", columnList = "status"),
        @Index(name = "idx_accident_act_number", columnList = "act_number", unique = true),
        @Index(name = "idx_accident_act_incident", columnList = "incident_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccidentAct extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "act_number", unique = true, length = 50)
    private String actNumber;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "incident_id")
    private UUID incidentId;

    @Column(name = "accident_date", nullable = false)
    private LocalDateTime accidentDate;

    @Column(name = "accident_location", length = 500)
    private String accidentLocation;

    // Victim info (Form N-1)
    @Column(name = "victim_full_name", nullable = false, length = 300)
    private String victimFullName;

    @Column(name = "victim_position", length = 300)
    private String victimPosition;

    @Column(name = "victim_birth_date")
    private LocalDate victimBirthDate;

    @Column(name = "victim_gender", length = 10)
    private String victimGender;

    @Column(name = "victim_work_experience", length = 100)
    private String victimWorkExperience;

    @Column(name = "victim_briefing_date")
    private LocalDate victimBriefingDate;

    @Column(name = "victim_briefing_type", length = 50)
    private String victimBriefingType;

    // Investigation
    @Column(name = "investigation_start_date")
    private LocalDate investigationStartDate;

    @Column(name = "investigation_end_date")
    private LocalDate investigationEndDate;

    @Column(name = "commission_chairman", length = 300)
    private String commissionChairman;

    @Column(name = "commission_members", columnDefinition = "TEXT")
    private String commissionMembers;

    // Circumstances
    @Column(name = "circumstances", columnDefinition = "TEXT")
    private String circumstances;

    @Column(name = "root_causes", columnDefinition = "TEXT")
    private String rootCauses;

    @Column(name = "corrective_measures", columnDefinition = "TEXT")
    private String correctiveMeasures;

    @Column(name = "responsible_persons", columnDefinition = "TEXT")
    private String responsiblePersons;

    // Injury details
    @Column(name = "injury_description", columnDefinition = "TEXT")
    private String injuryDescription;

    @Column(name = "injury_severity", length = 30)
    private String injurySeverity;

    @Column(name = "work_days_lost")
    @Builder.Default
    private Integer workDaysLost = 0;

    @Column(name = "hospitalization")
    @Builder.Default
    private boolean hospitalization = false;

    @Column(name = "fatal")
    @Builder.Default
    private boolean fatal = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AccidentActStatus status = AccidentActStatus.DRAFT;

    @Column(name = "approved_by_name", length = 300)
    private String approvedByName;

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    @Column(name = "sent_to_authorities_date")
    private LocalDate sentToAuthoritiesDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(AccidentActStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
