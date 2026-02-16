package com.privod.platform.modules.organization.domain;

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

import java.util.UUID;

@Entity
@Table(name = "departments", indexes = {
        @Index(name = "idx_dept_org", columnList = "organization_id"),
        @Index(name = "idx_dept_code", columnList = "code"),
        @Index(name = "idx_dept_parent", columnList = "parent_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "head_id")
    private UUID headId;

    @Column(name = "parent_id")
    private UUID parentId;
}
