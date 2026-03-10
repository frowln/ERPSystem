package com.privod.platform.modules.safety.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "safety_briefings", indexes = {
        @Index(name = "idx_sb_org", columnList = "organization_id"),
        @Index(name = "idx_sb_type", columnList = "briefing_type"),
        @Index(name = "idx_sb_date", columnList = "briefing_date"),
        @Index(name = "idx_sb_project", columnList = "project_id"),
        @Index(name = "idx_sb_instructor", columnList = "instructor_id"),
        @Index(name = "idx_sb_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyBriefing extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "briefing_type", nullable = false, length = 30)
    private BriefingType briefingType;

    @Column(name = "briefing_date", nullable = false)
    private LocalDate briefingDate;

    @Column(name = "instructor_id")
    private UUID instructorId;

    @Column(name = "instructor_name", length = 300)
    private String instructorName;

    @Column(name = "topic", length = 1000)
    private String topic;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BriefingStatus status = BriefingStatus.PLANNED;

    @Column(name = "next_briefing_date")
    private LocalDate nextBriefingDate;

    @OneToMany(mappedBy = "briefing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BriefingAttendee> attendees = new ArrayList<>();

    public void addAttendee(BriefingAttendee attendee) {
        attendees.add(attendee);
        attendee.setBriefing(this);
    }
}
