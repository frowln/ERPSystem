package com.privod.platform.modules.support.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "ticket_categories", indexes = {
        @Index(name = "idx_ticket_category_org", columnList = "organization_id"),
        @Index(name = "idx_ticket_category_org_code", columnList = "organization_id, code", unique = true)
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCategory extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "default_assignee_id")
    private UUID defaultAssigneeId;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
