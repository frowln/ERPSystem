package com.privod.platform.modules.chatter.domain;

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

@Entity
@Table(name = "chatter_activity_types", indexes = {
        @Index(name = "idx_activity_type_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTypeEntity extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "default_days", nullable = false)
    @Builder.Default
    private int defaultDays = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private ActivityTypeCategory category = ActivityTypeCategory.DEFAULT;
}
