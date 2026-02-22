package com.privod.platform.modules.isup.domain;

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
@Table(name = "isup_project_mappings", indexes = {
        @Index(name = "idx_isup_map_org", columnList = "organization_id"),
        @Index(name = "idx_isup_map_project", columnList = "privod_project_id"),
        @Index(name = "idx_isup_map_isup_project", columnList = "isup_project_id"),
        @Index(name = "idx_isup_map_gov_contract", columnList = "government_contract_number"),
        @Index(name = "idx_isup_map_sync", columnList = "sync_enabled")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IsupProjectMapping extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "privod_project_id", nullable = false)
    private UUID privodProjectId;

    @Column(name = "isup_project_id", length = 255)
    private String isupProjectId;

    @Column(name = "isup_object_id", length = 255)
    private String isupObjectId;

    @Column(name = "government_contract_number", length = 255)
    private String governmentContractNumber;

    @Column(name = "registration_number", length = 255)
    private String registrationNumber;

    @Column(name = "sync_enabled", nullable = false)
    @Builder.Default
    private boolean syncEnabled = true;
}
