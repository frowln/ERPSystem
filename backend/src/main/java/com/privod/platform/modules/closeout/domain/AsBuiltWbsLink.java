package com.privod.platform.modules.closeout.domain;

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

import java.util.UUID;

@Entity
@Table(name = "as_built_wbs_links", indexes = {
        @Index(name = "idx_asbuilt_link_wbs", columnList = "wbs_node_id"),
        @Index(name = "idx_asbuilt_link_project", columnList = "project_id"),
        @Index(name = "idx_asbuilt_link_doc", columnList = "document_container_id"),
        @Index(name = "idx_asbuilt_link_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsBuiltWbsLink extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "wbs_node_id", nullable = false)
    private UUID wbsNodeId;

    @Column(name = "doc_category", nullable = false, length = 100)
    private String docCategory;

    @Column(name = "document_container_id")
    private UUID documentContainerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AsBuiltLinkStatus status = AsBuiltLinkStatus.PENDING;
}
