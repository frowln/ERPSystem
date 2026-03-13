package com.privod.platform.modules.crm.domain;

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
@Table(name = "crm_stages", indexes = {
        @Index(name = "idx_crm_stage_org", columnList = "organization_id"),
        @Index(name = "idx_crm_stage_sequence", columnList = "sequence"),
        @Index(name = "idx_crm_stage_closed", columnList = "is_closed"),
        @Index(name = "idx_crm_stage_won", columnList = "is_won")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmStage extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private int sequence = 0;

    @Column(name = "probability", nullable = false)
    @Builder.Default
    private int probability = 0;

    @Column(name = "is_closed", nullable = false)
    @Builder.Default
    private boolean closed = false;

    @Column(name = "is_won", nullable = false)
    @Builder.Default
    private boolean won = false;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
}
