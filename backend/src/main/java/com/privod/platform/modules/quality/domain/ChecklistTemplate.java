package com.privod.platform.modules.quality.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "checklist_templates", indexes = {
        @Index(name = "idx_ct_work_type", columnList = "work_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 50)
    @Builder.Default
    private ChecklistWorkType workType = ChecklistWorkType.OTHER;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", columnDefinition = "jsonb")
    @Builder.Default
    private List<Object> items = new ArrayList<>();
}
