package com.privod.platform.modules.closing.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "ks3_ks2_links", indexes = {
        @Index(name = "idx_ks3_ks2_link_ks3", columnList = "ks3_id"),
        @Index(name = "idx_ks3_ks2_link_ks2", columnList = "ks2_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_ks3_ks2", columnNames = {"ks3_id", "ks2_id"})
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks3Ks2Link extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "ks3_id", nullable = false)
    private UUID ks3Id;

    @Column(name = "ks2_id", nullable = false)
    private UUID ks2Id;
}
