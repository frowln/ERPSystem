package com.privod.platform.modules.punchlist.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "punch_lists", indexes = {
        @Index(name = "idx_punch_list_project", columnList = "project_id"),
        @Index(name = "idx_punch_list_status", columnList = "status"),
        @Index(name = "idx_punch_list_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PunchList extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PunchListStatus status = PunchListStatus.OPEN;

    @Column(name = "completion_percent")
    @Builder.Default
    private Integer completionPercent = 0;

    @Column(name = "area_or_zone", length = 255)
    private String areaOrZone;
}
